/*
 * Copyright (c) 2025, Kestron and WKoA
 *
 * This file was originally distributed under the BSD-3-Clause License
 * and is now relicensed under the GNU General Public License v3.0.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Yeah this is 2K lines... :bobert:

const Categories = require("./modules/Categories");
const client = require("../client.js");
const { PersonalAIs, userByObj, guildByObj, guildByID } = require("./modules/database.js");
const { Events, SlashCommandBuilder, MessageFlags, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const { limitLength, notify } = require("../utils.js");
const { isModuleBlocked } = require("./block_module.js");
const fs = require("fs");
const ms = require("ms");
const Fuse = require("fuse.js");
const NodeCache = require("node-cache");
const { censor } = require("./filter");
const { groq, createGroq } = require("@ai-sdk/groq");
const { streamText, tool, stepCountIs } = require("ai");
const { z } = require("zod");

// Configuration
const TOOL_DEFAULT_LIMIT = 5; // Default limit for tool stuff
const TOOL_MAX_LIMIT = 15; // Max limit for tool stuff
const TOOL_MESSAGE_PREVIEW = 200; // How many chars of a message to preview
const REASONING_EFFORT = "low";
const MAX_USER_MENTIONS = 3;
const maxTools = 2;
const COOLDOWN_MS = process.env.beta ? ms("4s") : ms("8s");
const DEFAULT_CUSTOM_RATELIMIT = 10;
const DEFAULT_CUSTOM_RATELIMIT_CYCLE_MS = ms("1 hour");
const APPROVAL_TTL_MS = ms("5 minutes");
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const systemPrompt = fs.readFileSync("./data/system.prompt").toString();

// Server IDs and User IDs who need to wait for the requests to finish - this clears after 2 min in case of an error
let activeAIRequests = new NodeCache({ stdTTL: ms("5m") / 1000, checkperiod: 120 });
// Cooldown tracker for rate limiting
let userCooldowns = new NodeCache({ stdTTL: COOLDOWN_MS / 1000, checkperiod: Math.ceil((COOLDOWN_MS / 1000) / 2) });

// Custom per-key rate limiter (personal or server keys)
const customKeyRateLimits = new NodeCache({ stdTTL: 0, checkperiod: 60 });

// Non-persistent store of convos with users
let convoCache = {};

const noResponse = {
    flags: [MessageFlags.IsComponentsV2],
    allowedMentions: { parse: [] },
    components: [
        new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("-# *No response*")
            )
    ]
};

//#region Utils
function buildAllowedMentionsForContent(content) {
    const base = { parse: [] };
    if (typeof content !== "string" || content.length === 0) {
        return base;
    }

    const mentionRegex = /<@!?(\d+)>/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) && mentions.length < MAX_USER_MENTIONS) {
        const userId = match[1];
        if (!mentions.includes(userId)) {
            mentions.push(userId);
        }
    }

    if (mentions.length > 0) {
        return { ...base, users: mentions };
    }

    return base;
}

function buildCustomToolLimitResponse(limitContext) {
    const limitMsg = {
        global:
            `You've reached the limit of subsequent tool calls we can sustainably provide for free.\n` +
            `To increase this limit, you can provide your own API key for us to use to interface with [Groq](https://groq.com) by using ${cmds.ai_config.personal_ai.mention}.`,
        server:
            `You've reached the subsequent tool-call limit configured for this server's AI key (${limitContext?.limit || maxTools}).`,
        personal:
            `You've reached the subsequent tool-call limit configured for your personal AI key (${limitContext?.limit || maxTools}).`
    }[limitContext?.source || "global"];

    const disclaimer = {
        global:
            `-# This is ***not*** a premium tier issue - all features are free. We just don't have the money to host constant AI for everyone.  Want to help? ${cmds.donate.mention}`,
        server:
            `-# This limit was configured by a server manager. A server manager can raise it via ${cmds.ai_config.server_ai.mention}.`,
        personal:
            `-# This limit was configured by you. You can increase it with ${cmds.personal_config.mention}`
    }[limitContext?.source || "global"];

    const maxSubsequentTools = {
        flags: [MessageFlags.IsComponentsV2],
        allowedMentions: { parse: [] },
        components: [
            new ContainerBuilder()
                .setAccentColor(16048683)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(limitMsg)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
                        .setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(disclaimer)
                )
        ]
    };

    return maxSubsequentTools;
}

function sanitizePositiveInteger(value) {
    if (value === undefined || value === null) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    const int = Math.floor(num);
    return int > 0 ? int : undefined;
}

function formatDuration(valueMs) {
    if (!valueMs || valueMs <= 0) return "a moment";
    return ms(valueMs, { long: true }) || `${Math.round(valueMs / 1000)} seconds`;
}

/**
 * Generates a user-facing message explaining why an AI request was blocked due to rate limiting or access restrictions.
 *
 * @param {Object} blockReason - The reason for blocking the request.
 * @param {string} [blockReason.type] - The type of block ("access", "whitelist", etc.).
 * @param {string} [blockReason.mode] - The access mode ("whitelist", "blacklist").
 * @param {number} [blockReason.ratelimitCycleLength] - The duration of the rate limit cycle in milliseconds.
 * @param {number} [blockReason.resetAt] - The timestamp (ms) when the rate limit resets.
 * @param {string} [blockReason.source] - The source of the rate limit ("personal", "server").
 * @param {number} [blockReason.ratelimit] - The number of allowed requests per cycle.
 * @param {string} [blockReason.ownerId] - The ID of the server's AI owner.
 * @returns {string} A message describing the reason for the block and guidance for the user.
 */
function buildRateLimitBlockMessage(blockReason) {
    if (blockReason.mode === "whitelist") {
        return "AI is restricted to specific roles in this server. Ask a server manager to grant you access.";
    }
    if (blockReason.mode === "blacklist") {
        return "AI is disabled for one or more of your roles in this server.";
    }

    const windowText = blockReason.ratelimitCycleLength
        ? formatDuration(blockReason.ratelimitCycleLength)
        : "ratelimit cycle";
    const waitText = formatDuration(Math.max(0, blockReason.resetAt - Date.now()));

    if (blockReason.source === "personal") {
        return `You've reached the limit you set for your personal AI key (${blockReason.ratelimit} requests every ${windowText}). Try again in ${waitText}.`;
    }

    // const ownerText = blockReason.ownerId ? `<@${blockReason.ownerId}>` : "this server's AI owner";
    return `You've reached this server's AI allowance (${blockReason.ratelimit} requests every ${windowText}). Ask a server manager to raise it or try again in ${waitText}.`;
}

function normalizeRoleIds(list) {
    return Array.isArray(list) ? list.filter(Boolean) : [];
}

function resetAIRequests() {
    activeAIRequests.flushAll();
    userCooldowns.flushAll();
}
//#endregion

//#region Setting Utils
async function evaluateGuildAiAccess({ mode, roles, guild, member, userId }) {
    const normalizedMode = mode || "disabled";
    const roleIds = normalizeRoleIds(roles);

    if (!guild?.id || normalizedMode === "disabled" || roleIds.length === 0) {
        return { allowed: true };
    }

    let memberToCheck = member;
    if (!memberToCheck?.roles?.cache) {
        memberToCheck = await getGuildMember(guild, userId);
    }

    if (!memberToCheck) {
        return { allowed: false, reason: { mode: normalizedMode, roles: roleIds, detail: "member_fetch_failed" } };
    }

    const memberHasRole = memberToCheck.roles.cache?.some?.(role => roleIds.includes(role.id)) || false;

    if (normalizedMode === "whitelist" && !memberHasRole) {
        return { allowed: false, reason: { mode: "whitelist", roles: roleIds } };
    }

    if (normalizedMode === "blacklist" && memberHasRole) {
        return { allowed: false, reason: { mode: "blacklist", roles: roleIds } };
    }

    return { allowed: true };
}

async function resolveAiConfiguration(userId, guild, member) {
    const personalPromise = PersonalAIs.findOne({ id: userId }).lean();
    const serverPromise = guild?.id
        ? PersonalAIs.findOne({ id: guild.id }).lean()
        : Promise.resolve(null);

    const guildConfigPromise = guild?.id
        ? guildByObj(guild)
        : Promise.resolve(null);

    const [personalConfig, serverConfig, guildConfig] = await Promise.all([personalPromise, serverPromise, guildConfigPromise]);

    const accessCheck = await evaluateGuildAiAccess({
        mode: guildConfig?.config?.aiAccessMode,
        roles: guildConfig?.config?.aiAccessRoles,
        guild,
        member,
        userId
    });

    if (!accessCheck.allowed) {
        return { source: "global", config: null, blockReason: accessCheck.reason };
    }

    if (personalConfig?.key) {
        return { source: "personal", config: personalConfig };
    }

    if (serverConfig?.key && guild?.id) {
        return { source: "server", config: serverConfig };
    }

    return { source: "global", config: null };
}

function buildAiOptionsFromConfig(source, config) {
    const sanitizedToolLimit = sanitizePositiveInteger(config?.subsequentToolLimit);
    return {
        source,
        apiKey: config?.key,
        model: config?.llm_model,
        toolBlacklist: Array.isArray(config?.toolBlacklist) ? config.toolBlacklist : [],
        maxSubsequentTools: sanitizedToolLimit
    };
}

function consumeCustomRateLimit(source, config, userId) {
    const limit = sanitizePositiveInteger(config?.ratelimit) ?? DEFAULT_CUSTOM_RATELIMIT;
    const cycleLength = sanitizePositiveInteger(config?.ratelimitCycleLength) ?? DEFAULT_CUSTOM_RATELIMIT_CYCLE_MS;

    if (!limit || !cycleLength) {
        return { allowed: true, ratelimit: limit, ratelimitCycleLength: cycleLength };
    }

    const cacheKey = `${source}:${config.id}:${userId}`;
    const now = Date.now();
    let entry = customKeyRateLimits.get(cacheKey);

    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + cycleLength };
    }

    if (entry.count >= limit) {
        return { allowed: false, resetAt: entry.resetAt, ratelimit: limit, ratelimitCycleLength: cycleLength };
    }

    entry.count += 1;
    customKeyRateLimits.set(cacheKey, entry, Math.max(1, Math.ceil((entry.resetAt - now) / 1000)));
    return { allowed: true, resetAt: entry.resetAt, ratelimit: limit, ratelimitCycleLength: cycleLength };
}

/**
 * Prepares the AI usage context for a user, determining if the user is allowed to use AI features
 * based on configuration, block reasons, and custom rate limits.
 *
 * @async
 * @function
 * @param {Object} params - The parameters for preparing the AI usage context.
 * @param {string} params.userId - The ID of the user requesting AI usage.
 * @param {Object} params.guild - The guild (server) context.
 * @param {Object} params.member - The member object representing the user in the guild.
 * @returns {Promise<Object>} An object indicating whether AI usage is allowed, and if not, the reason for blocking.
 * If allowed, includes AI options built from the configuration.
 * @returns {Promise<{allowed: boolean, blockReason?: any, aiOptions?: any}>}
 */
async function prepareAiUsageContext({ userId, guild, member }) {
    const resolved = await resolveAiConfiguration(userId, guild, member);

    if (resolved.blockReason) {
        return {
            allowed: false,
            blockReason: resolved.blockReason
        };
    }

    if (resolved.source !== "global" && resolved.config) {
        const rateCheck = consumeCustomRateLimit(resolved.source, resolved.config, userId);
        if (!rateCheck.allowed) {
            return {
                allowed: false,
                blockReason: {
                    source: resolved.source,
                    ownerId: resolved.config.ownerId,
                    ratelimit: rateCheck.ratelimit,
                    ratelimitCycleLength: rateCheck.ratelimitCycleLength,
                    resetAt: rateCheck.resetAt
                }
            };
        }
    }

    return {
        allowed: true,
        aiOptions: buildAiOptionsFromConfig(resolved.source, resolved.config)
    };
}
//#endregion

//#region Command Tools

// Pending approval requests cache
const pendingApprovals = new NodeCache({ stdTTL: APPROVAL_TTL_MS / 1000, checkperiod: 30 });

// Auto-expire approvals and resolve as denied
pendingApprovals.on("expired", (_key, value) => {
    if (value?.resolve) value.resolve(false);
});

/**
 * Creates a polyfill/mock Discord interaction object for AI tool calls.
 * This allows command modules to be called as if they were invoked via slash command.
 *
 * @param {Object} params
 * @param {Object} params.user - The Discord user object
 * @param {Object} params.guild - The Discord guild object
 * @param {Object} params.member - The guild member object
 * @param {Object} params.channel - The channel where the AI is responding
 * @param {Object} params.args - The arguments passed by the AI
 * @param {string} params.commandName - The name of the command being invoked
 * @param {string|null} params.subcommand - The subcommand name if applicable
 * @returns {Object} A mock interaction object
 */
function createCommandPolyfill({ user, guild, member, channel, args, commandName, subcommand, sendDirectResponse }) {
    const responses = [];
    const fullResponses = []; // Store full message objects (for internal/debugging; not fed back to the model)
    let hasReplied = false;
    let isDeferred = false;
    let lastSentMessage = null;

    const mockInteraction = {
        // User and guild context
        user,
        member,
        guild,
        channel,
        channelId: channel?.id,
        guildId: guild?.id,
        commandName,

        // Track if this is an AI-invoked command
        _isAIToolCall: true,
        _aiToolArgs: args,

        // Options getter that returns AI-provided arguments
        options: {
            getString: (name, _required) => {
                const val = args[name];
                return typeof val === "string" ? val : null;
            },
            getInteger: (name, _required) => {
                const val = args[name];
                return typeof val === "number" ? Math.floor(val) : null;
            },
            getNumber: (name, _required) => {
                const val = args[name];
                return typeof val === "number" ? val : null;
            },
            getBoolean: (name, _required) => {
                const val = args[name];
                return typeof val === "boolean" ? val : null;
            },
            getUser: (name, _required) => {
                const userId = args[name];
                if (!userId) return null;
                return guild?.members?.cache?.get(userId)?.user || client.users?.cache?.get(userId) || null;
            },
            getMember: (name, _required) => {
                const userId = args[name];
                if (!userId || !guild) return null;
                return guild.members?.cache?.get(userId) || null;
            },
            getChannel: (name, _required) => {
                const channelId = args[name];
                if (!channelId || !guild) return null;
                return guild.channels?.cache?.get(channelId) || null;
            },
            getRole: (name, _required) => {
                const roleId = args[name];
                if (!roleId || !guild) return null;
                return guild.roles?.cache?.get(roleId) || null;
            },
            getSubcommand: (required = true) => {
                if (!subcommand && required) {
                    throw new Error("No subcommand was provided");
                }
                return subcommand;
            },
            getSubcommandGroup: () => null,
            get: (name, _required) => args[name] ?? null,
            data: Object.entries(args).map(([name, value]) => ({ name, value }))
        },

        // Response methods - capture output, and optionally send directly to user
        reply: async (content) => {
            hasReplied = true;
            const messageObj = typeof content === "string" ? { content } : content;
            const responseContent = messageObj?.content || JSON.stringify(messageObj);
            responses.push(responseContent);
            fullResponses.push(messageObj);

            if (typeof sendDirectResponse === "function") {
                lastSentMessage = await sendDirectResponse(messageObj);
                return lastSentMessage;
            }

            return { content: responseContent };
        },

        followUp: async (content) => {
            const messageObj = typeof content === "string" ? { content } : content;
            const responseContent = messageObj?.content || JSON.stringify(messageObj);
            responses.push(responseContent);
            fullResponses.push(messageObj);

            if (typeof sendDirectResponse === "function") {
                lastSentMessage = await sendDirectResponse(messageObj);
                return lastSentMessage;
            }

            return { content: responseContent };
        },

        editReply: async (content) => {
            const messageObj = typeof content === "string" ? { content } : content;
            const responseContent = messageObj?.content || JSON.stringify(messageObj);
            if (responses.length > 0) {
                responses[responses.length - 1] = responseContent;
                fullResponses[fullResponses.length - 1] = messageObj;
            }
            else {
                responses.push(responseContent);
                fullResponses.push(messageObj);
            }

            if (typeof sendDirectResponse === "function") {
                if (lastSentMessage && typeof lastSentMessage.edit === "function") {
                    lastSentMessage = await lastSentMessage.edit(messageObj);
                    return lastSentMessage;
                }

                // If we can't edit (no previous message), send a new one
                lastSentMessage = await sendDirectResponse(messageObj);
                return lastSentMessage;
            }

            return { content: responseContent };
        },

        deferReply: async () => {
            isDeferred = true;
            return {};
        },

        // Status checks
        isCommand: () => true,
        isChatInputCommand: () => true,
        isMessageContextMenuCommand: () => false,
        isAutocomplete: () => false,
        isButton: () => false,
        isModalSubmit: () => false,
        isSelectMenu: () => false,
        replied: () => hasReplied,
        deferred: () => isDeferred,

        // Get captured responses
        _getResponses: () => responses,
        _getResponseText: () => responses.join("\n"),
        _getFullResponses: () => fullResponses
    };

    return mockInteraction;
}

/**
 * Converts Discord command option type to Zod schema
 */
function discordTypeToZod(discordType, option) {
    // https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandOptionType
    let schema;

    switch (discordType) {
        case 3: // STRING
            schema = z.string();
            if (option.min_length) schema = schema.min(option.min_length);
            if (option.max_length) schema = schema.max(option.max_length);
            if (option.choices?.length > 0) {
                const values = option.choices.map(c => c.value);
                schema = z.enum(values);
            }
            break;
        case 4: // INTEGER
            schema = z.number().int();
            if (option.min_value !== undefined) schema = schema.min(option.min_value);
            if (option.max_value !== undefined) schema = schema.max(option.max_value);
            break;
        case 5: // BOOLEAN
            schema = z.boolean();
            break;
        case 6: // USER (ID)
        case 7: // CHANNEL (ID)
        case 8: // ROLE (ID)
        case 9: // MENTIONABLE (ID)
            schema = z.string().describe("Discord snowflake ID");
            break;
        case 10: // NUMBER
            schema = z.number();
            if (option.min_value !== undefined) schema = schema.min(option.min_value);
            if (option.max_value !== undefined) schema = schema.max(option.max_value);
            break;
        case 11: // ATTACHMENT
            schema = z.string().describe("Attachment URL or ID");
            break;
        default:
            schema = z.string();
    }

    return schema;
}

/**
 * Builds a Zod input schema from Discord command options
 */
function buildZodSchemaFromOptions(options, allowedArgNames = null) {
    if (!options || !Array.isArray(options) || options.length === 0) {
        return z.object({}).strict();
    }

    const schemaObj = {};
    const allowedSet = Array.isArray(allowedArgNames) ? new Set(allowedArgNames) : null;

    for (const opt of options) {
        // Skip the "private" option as it's Discord-specific
        if (opt.name === "private") continue;

        if (allowedSet && !allowedSet.has(opt.name)) continue;

        let fieldSchema = discordTypeToZod(opt.type, opt);

        // Add description
        if (opt.description) {
            fieldSchema = fieldSchema.describe(opt.description);
        }

        // Make optional if not required
        if (!opt.required) {
            fieldSchema = fieldSchema.optional();
        }

        schemaObj[opt.name] = fieldSchema;
    }

    return z.object(schemaObj).strict();
}

function buildOptionTypeMap(options, allowedArgNames = null) {
    const typeMap = new Map();
    if (!options || !Array.isArray(options) || options.length === 0) return typeMap;

    const allowedSet = Array.isArray(allowedArgNames) ? new Set(allowedArgNames) : null;

    for (const opt of options) {
        if (opt.name === "private") continue;
        if (allowedSet && !allowedSet.has(opt.name)) continue;
        typeMap.set(opt.name, opt.type);
    }

    return typeMap;
}

/**
 * Gets the AI tool config for a command/subcommand
 * @param {Object} aiToolOptions - The aiToolOptions from command data
 * @param {string|null} subcommand - The subcommand name if applicable
 * @returns {Object|null} The tool config or null if not toolable
 */
function getToolConfig(aiToolOptions, subcommand) {
    if (!aiToolOptions) return null;

    // If it's a direct config (has toolable property), return it
    if (aiToolOptions.toolable === true || Array.isArray(aiToolOptions.toolable)) {
        return aiToolOptions;
    }

    // Otherwise it's a map of subcommand -> config
    if (subcommand && (aiToolOptions[subcommand]?.toolable === true || Array.isArray(aiToolOptions[subcommand]?.toolable))) {
        return aiToolOptions[subcommand];
    }

    return null;
}

/**
 * Creates the approval UI for a tool call
 */
function createApprovalEmbed(toolName, args, approvalId) {
    const argsDisplay = Object.entries(args)
        .map(([k, v]) => `- **${k}:** ${JSON.stringify(v)}`)
        .join("\n") || null;

    const ttlDisplay = ms(APPROVAL_TTL_MS, { long: true });

    toolName = toolName.replace(/^cmd_/, "");

    const container =
        new ContainerBuilder()
            .setAccentColor(14080271)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("## Tool Approval Needed")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`Stewbot wants to run the \`${toolName}\` command on your behalf.`)
            );


    if (argsDisplay) container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "Arguments:\n" + argsDisplay
            )
    );

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ai_approve_${approvalId}`)
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`ai_deny_${approvalId}`)
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
            )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(`-# This request will expire in ${ttlDisplay}`)
    );

    return {
        components: [container],
        flags: [MessageFlags.IsComponentsV2]
    };

}

/**
 * Waits for user approval of a tool call
 * @returns {Promise<boolean>} True if approved, false if denied
 */
async function waitForApproval(approvalId, userId) {
    return new Promise((resolve) => {
        pendingApprovals.set(approvalId, { resolve, userId }, APPROVAL_TTL_MS / 1000);
    });
}

/**
 * Handles approval button clicks
 */
function handleApprovalButton(customId, userId) {
    const match = customId.match(/^ai_(approve|deny)_(.+)$/);
    if (!match) return null;

    const [, action, approvalId] = match;
    const pending = pendingApprovals.get(approvalId);

    if (!pending) return { error: "This request has expired." };
    if (pending.userId !== userId) return { error: "Only the original requester can approve this." };

    pendingApprovals.del(approvalId);
    pending.resolve(action === "approve");
    return { approved: action === "approve" };
}

//#endregion

//#region General Tools

/**
 * Builds command-based tools from all loaded command modules that have aiToolOptions
 * @param {Object} context - Context for tool execution
 * @param {Object} context.user - The Discord user
 * @param {Object} context.guild - The Discord guild
 * @param {Object} context.member - The guild member
 * @param {Object} context.channel - The channel
 * @param {Function} context.sendApprovalRequest - Function to send approval UI and wait
 * @returns {Object} Map of tool name to ai-sdk tool
 */
async function buildCommandTools(context) {
    const { user, guild, member, channel, sendApprovalRequest, sendDirectResponse } = context;
    const commandTools = {};

    const homeServerId = global?.config?.homeServer;
    const [guildStore, homeGuild] = guild?.id
        ? await Promise.all([
            guildByObj(guild).catch(() => null),
            homeServerId ? guildByID(homeServerId).catch(() => null) : Promise.resolve(null)
        ])
        : [null, null];

    const isAdmin = member?.permissions instanceof PermissionsBitField &&
        member.permissions?.has?.(PermissionFlagsBits.Administrator);

    // Access global commands
    const loadedCommands = global.commands || {};

    for (const commandName of Object.keys(loadedCommands)) {
        const commandModule = loadedCommands[commandName];
        if (!commandModule?.data?.command || !commandModule?.data?.aiToolOptions) continue;
        if (typeof commandModule.execute !== "function") continue;

        const commandData = commandModule.data;
        const mainCommand = commandData.command;
        const aiToolOptions = commandData.aiToolOptions;
        const helpData = commandData.help || {};

        // Check if command has subcommands (type 1 = SUB_COMMAND)
        const options = mainCommand.options || [];
        const hasSubcommands = options.length > 0 && options[0]?.type === 1;

        // Manually check the setDefaultMemberPermissions field
        const AdminPermissions = BigInt(8);
        if (commandData?.command?.default_member_permissions) {
            const requiredPermissions = BigInt(commandData.command.default_member_permissions);
            if (requiredPermissions) {
                const memberPermissions = BigInt(member.permissions);
                const hasAdminPerms = (memberPermissions & AdminPermissions) === AdminPermissions; // Admins bypass perm checks
                if (!hasAdminPerms && (memberPermissions & requiredPermissions) !== requiredPermissions) {
                    continue; // Don't add this tool
                }
            }
        }

        if (hasSubcommands) {
            // Process each subcommand
            for (const subOpt of options) {
                if (subOpt.type !== 1) continue; // Only SUB_COMMAND

                const toolConfig = getToolConfig(aiToolOptions, subOpt.name);
                if (!toolConfig) continue;

                // Ignore blocked commands
                const listeningModule = [`${commandName} ${subOpt.name}`.trim(), commandModule];
                const [blocked] = isModuleBlocked(
                    listeningModule,
                    guildStore,
                    homeGuild,
                    isAdmin
                );
                if (blocked) continue;

                const allowedArgs = Array.isArray(toolConfig.toolable) ? toolConfig.toolable : null;
                const optionTypeMap = buildOptionTypeMap(subOpt.options || [], allowedArgs);

                const toolName = `cmd_${commandName}_${subOpt.name}`;
                const toolDesc = helpData[subOpt.name]?.detailedDesc || subOpt.description || `Runs the ${commandName} ${subOpt.name} command`;
                const inputSchema = buildZodSchemaFromOptions(subOpt.options || [], allowedArgs);

                commandTools[toolName] = tool({
                    description: toolDesc,
                    inputSchema,
                    execute: createToolExecutor({
                        commandName,
                        commandModule,
                        subcommand: subOpt.name,
                        toolConfig,
                        toolName,
                        user,
                        guild,
                        member,
                        channel,
                        sendApprovalRequest,
                        sendDirectResponse,
                        optionTypeMap
                    })
                });
            }
        }
        else {
            // Process as main command
            const toolConfig = getToolConfig(aiToolOptions, null);
            if (!toolConfig) continue;

            // Ignore blocked commands
            const listeningModule = [commandName, commandModule];
            const [blocked] = isModuleBlocked(
                listeningModule,
                guildStore,
                homeGuild,
                isAdmin
            );
            if (blocked) continue;

            const allowedArgs = Array.isArray(toolConfig.toolable) ? toolConfig.toolable : null;
            const optionTypeMap = buildOptionTypeMap(options, allowedArgs);

            const toolName = `cmd_${commandName}`;
            const toolDesc = helpData?.detailedDesc || mainCommand.description || `Runs the ${commandName} command`;
            const inputSchema = buildZodSchemaFromOptions(options, allowedArgs);

            commandTools[toolName] = tool({
                description: toolDesc,
                inputSchema,
                execute: createToolExecutor({
                    commandName,
                    commandModule,
                    subcommand: null,
                    toolConfig,
                    toolName,
                    user,
                    guild,
                    member,
                    channel,
                    sendApprovalRequest,
                    sendDirectResponse,
                    optionTypeMap
                })
            });
        }
    }

    return commandTools;
}

/**
 * Creates the execute function for a command tool
 */
async function hydrateCachesForArgs(guild, args, optionTypeMap) {
    if (!guild || !(optionTypeMap instanceof Map) || optionTypeMap.size === 0) return;

    const fetches = [];

    for (const [name, type] of optionTypeMap.entries()) {
        const id = args?.[name];
        if (!id || typeof id !== "string") continue;

        switch (type) {
            case 6: // USER
                fetches.push(guild.members.fetch(id).catch(() => null));
                fetches.push(guild.client?.users?.fetch?.(id).catch(() => null));
                break;
            case 7: // CHANNEL
                fetches.push(guild.channels.fetch(id).catch(() => null));
                break;
            case 8: // ROLE
                fetches.push(guild.roles.fetch(id).catch(() => null));
                break;
            case 9: // MENTIONABLE (user or role)
                fetches.push(guild.roles.fetch(id).catch(() => null));
                fetches.push(guild.members.fetch(id).catch(() => null));
                fetches.push(guild.client?.users?.fetch?.(id).catch(() => null));
                break;
            default:
                break;
        }
    }

    if (fetches.length > 0) {
        await Promise.all(fetches);
    }
}

function createToolExecutor({ commandName, commandModule, subcommand, toolConfig, toolName, user, guild, member, channel, sendApprovalRequest, sendDirectResponse, optionTypeMap }) {
    return async (args) => {
        const requiresApproval = toolConfig.requiresApproval !== false; // Default true
        const sendDirect = toolConfig.sendDirect !== false; // Default true

        // Handle approval if required
        if (requiresApproval && sendApprovalRequest) {
            const approved = await sendApprovalRequest(toolName, args);
            if (!approved) {
                return {
                    ok: false,
                    denied: true,
                    message: "The user denied this tool request. Do not attempt to call this tool again for this request."
                };
            }
        }

        await hydrateCachesForArgs(guild, args, optionTypeMap);

        // Create the polyfill
        const mockCmd = createCommandPolyfill({
            user,
            guild,
            member,
            channel,
            args,
            commandName,
            subcommand,
            // Only send directly when the command's tool config requests it
            sendDirectResponse: sendDirect ? sendDirectResponse : undefined
        });

        try {
            // Execute the command
            await commandModule.execute(mockCmd, { config: global.config });

            const responseText = mockCmd._getResponseText();

            // Build the result
            const result = {
                ok: true,
                response: responseText || "Command executed successfully (no output)",
                executedAs: user.username, // Let AI know whose permissions were used
                sendDirect,
                note: sendDirect
                    ? "The response was sent directly to the user. Do not re-send it unless the user asks."
                    : `This response was generated using ${user.username}'s permissions. If the response indicates a permission error, relay that to the user.`
            };

            return result;
        }
        catch (error) {
            return {
                ok: false,
                error: error.message || "Command execution failed",
                executedAs: user.username
            };
        }
    };
}


async function getGuildMember(guild, userId) {
    if (!guild) return null;

    const cachedMember = guild.members.cache.get(userId);
    if (cachedMember) return cachedMember;

    try {
        return await guild.members.fetch(userId);
    }
    catch {
        return null;
    }
}

async function getUserInfo(guild, userId) {
    const member = await getGuildMember(guild, userId);
    const user = member?.user || await guild?.client?.users?.fetch?.(userId).catch(() => null);

    if (!user) {
        return { ok: false, reason: `No user found for id ${userId}` };
    }

    const roles = member
        ? member.roles.cache
            .filter(role => role.name !== "@everyone")
            .sort((a, b) => b.position - a.position)
            .map(role => ({ id: role.id, name: role.name, position: role.position }))
        : [];

    return {
        ok: true,
        userId: user.id,
        username: user.username,
        globalName: user.globalName,
        displayName: member?.displayName || user.globalName || user.username,
        bot: user.bot,
        createdAt: user.createdAt?.toISOString?.(),
        joinedAt: member?.joinedAt ? member.joinedAt.toISOString() : null,
        roles,
        mention: `<@${user.id}>`,
        avatar: user.displayAvatarURL?.({ dynamic: true, size: 256 }) || null,
        banner: user.bannerURL?.({ size: 512 }) || null,
        bio: user.bio || null
    };
}

async function searchMembersByName(guild, query, limit = TOOL_DEFAULT_LIMIT) {
    if (!guild) return { ok: false, reason: "No guild context available" };

    const cappedLimit = Math.min(Math.max(limit, 1), TOOL_MAX_LIMIT);
    let members = null;

    try {
        members = await guild.members.search({ query, limit: cappedLimit });
    }
    catch {
        // Fallback to cache only if search fails (missing intent or API error)
        members = guild.members.cache.filter(member => {
            const haystacks = [member.displayName, member.user.username, member.user.globalName].filter(Boolean).map(s => s.toLowerCase());
            const needle = query.toLowerCase();
            return haystacks.some(name => name.includes(needle));
        });
    }

    const memberArray = Array.from(members.values()).slice(0, cappedLimit);

    const fuse = new Fuse(memberArray, {
        keys: ["displayName", "user.username", "user.globalName"],
        threshold: 0.3,
        ignoreLocation: true
    });

    let result = fuse.search(query).slice(0, cappedLimit)
        .map(re => {
            const member = re.item;
            return {
                userId: member.id,
                displayName: member.displayName,
                username: member.user.username,
                globalName: member.user.globalName
            };
        });
    return result;
}

function searchChannelsByName(guild, query, limit = TOOL_DEFAULT_LIMIT) {
    if (!guild) return { ok: false, reason: "No guild context available" };

    const cappedLimit = Math.min(Math.max(limit, 1), TOOL_MAX_LIMIT);
    const channels = Array.from(guild.channels.cache.values()).filter(channel => typeof channel.name === "string");
    const fuse = new Fuse(channels, {
        keys: ["name"],
        threshold: 0.35,
        ignoreLocation: true
    });

    return fuse.search(query).slice(0, cappedLimit)
        .map(result => {
            const channel = result.item;
            return {
                channelId: channel.id,
                channelName: channel.name,
                type: channel.type,
                mention: `<#${channel.id}>`
            };
        });
}

async function recentMessagesByChannel(guild, channelId, limit = TOOL_DEFAULT_LIMIT) {
    if (!guild) return { ok: false, reason: "No guild context available" };

    const cappedLimit = Math.min(Math.max(limit, 1), TOOL_MAX_LIMIT);
    const channel = await guild.channels.fetch(channelId).catch(() => null);

    if (!channel) return { ok: false, reason: `Channel ${channelId} not found` };
    if (!channel.isTextBased()) return { ok: false, reason: "Channel is not text-based" };

    try {
        const messages = await channel.messages.fetch({ limit: cappedLimit });
        return Array.from(messages.values()).map(message => ({
            id: message.id,
            authorId: message.author.id,
            authorName: message.author.username,
            content: limitLength(message.content || "", TOOL_MESSAGE_PREVIEW),
            createdAt: message.createdAt?.toISOString?.(),
            attachments: Array.from(message.attachments.values()).map(att => ({
                id: att.id,
                name: att.name,
                size: att.size,
                url: att.url,
                contentType: att.contentType
            }))
        }));
    }
    catch (error) {
        return { ok: false, reason: `Unable to read messages: ${error.message}` };
    }
}

function buildDiscordTools(guild) {
    const tools = {
        user_info: tool({
            description: "Look up detailed information about a user in this server by userId.",
            inputSchema: z.object({
                userId: z.string().describe("Discord userId to look up")
            }),
            execute: ({ userId }) => getUserInfo(guild, userId)
        }),
        userId_by_name: tool({
            description: "Find the best list of matching users by display, global, or username.",
            inputSchema: z.object({
                userName: z.string().describe("Full or partial username to search for"),
                limit: z.number().int()
                    .min(1)
                    .max(TOOL_MAX_LIMIT)
                    .optional()
            }),
            execute: ({ userName, limit }) => searchMembersByName(guild, userName, limit || TOOL_DEFAULT_LIMIT)
        }),
        channelId_by_name: tool({
            description: "Find channels in this server by name and return their channelId.",
            inputSchema: z.object({
                channelName: z.string().describe("Channel name or partial match to search"),
                limit: z.number().int()
                    .min(1)
                    .max(TOOL_MAX_LIMIT)
                    .optional()
            }),
            execute: ({ channelName, limit }) => searchChannelsByName(guild, channelName, limit || TOOL_DEFAULT_LIMIT)
        }),
        recent_messages_by_channelId: tool({
            description: "Get recent messages from a channel by channelId.",
            inputSchema: z.object({
                channelId: z.string().describe("channelId to read"),
                limit: z.number().int()
                    .min(1)
                    .max(TOOL_MAX_LIMIT)
                    .optional()
            }),
            execute: ({ channelId, limit }) => recentMessagesByChannel(guild, channelId, limit || TOOL_DEFAULT_LIMIT)
        })
    };

    // If running beta, log tool calls.
    if (process.env.beta) {
        Object.keys(tools).forEach(toolName => {
            const originalTool = tools[toolName];
            const originalExecute = originalTool.execute;
            originalTool.execute = async function(args) {
                const result = await originalExecute.call(this, args);

                // Log at once in case multiple are running together
                console.log(
                    `[Tool Logger] Executing tool:`, toolName, `\n` +
                    `[Tool Logger] Arguments:`, args, `\n` +
                    `[Tool Logger] Result:`, result
                );

                return result;
            };
        });
    }

    return tools;
}

//#endregion

//#region AI Core
async function postprocessUserMessage(message, guild) {
    message = message.replace(/<@!?(\d+)>/g, (match, userId) => {
        const username = guild?.members.cache.get(userId)?.user?.username;
        return username ? `@${username}` : match;
    });

    // Convert role mentions to their raw format
    message = message.replace(/<@&(\d+)>/g, (match, roleId) => {
        const roleName = guild?.roles.cache.get(roleId)?.name;
        return roleName ? `<${roleName} (discord role mention)>` : match;
    });

    // Convert channel mentions to their raw format
    message = message.replace(/<#(\d+)>/g, (match, channelId) => {
        const channelname = guild?.channels.cache.get(channelId)?.name;
        return channelname ? `<#${channelname} (discord channel)>` : match;
    });

    return message;
}

/** Formats and censors AI messages */
async function postprocessAIMessage(message, guild) {
    // Replace @username with <@id-of-username>
    message = message.replace(/@([\w_.]+)/g, (match, username) => {
        const user = guild?.members.cache.find((member) => member.user.username === username);
        return user ? `<@${user.id}>` : match;
    });

    // Legacy code - may not be needed for GPT-OSS 120B.
    // // AI overuses the blush and star emojis (and trim the other one to prevent starboard abuse)
    // message = message.replaceAll(/🌟/g, "");
    // message = message.replaceAll(/⭐/g, "");
    // message = message.replaceAll(/😊/g, "");

    message = await censor(String(message), guild, true);

    return message;
}

/**
 * Generates an AI response for a given conversation thread, managing conversation history,
 * system prompts, tool usage, and error handling.
 *
 * @param {string} threadID - Unique identifier for the conversation thread.
 * @param {string} message - The user's message to send to the AI.
 * @param {Guild} guild
 * @param {?Object} [contextualData] - Additional contextual data to customize the system prompt.
 * @param {?Object} [aiOptions] - AI configuration options
 * @param {?Object} [toolContext] - Context for building command tools (user, member, channel, sendApprovalRequest)
 * @typedef {"success"|"error"|"limit"|"direct"} Status
 * @returns {Promise<[InteractionReplyOptions, Status, ?Object]>} Resolves to a tuple: [AI response object, status, optional direct response].
 */
async function getAiResponse(threadID, message, guild, contextualData = {}, aiOptions = {}, toolContext = null) {
    // Init convo cache
    if (
        !convoCache[threadID] ||
        !convoCache[threadID].messages ||
        Date.now() - convoCache[threadID].lastMessage > 1000 * 60 * 60 ||
        JSON.stringify(contextualData) !== JSON.stringify(convoCache[threadID].contextualData)
    ) {
        let localSystemPrompt = systemPrompt;
        if (process.env.beta) localSystemPrompt = localSystemPrompt.replaceAll("Stewbot", "Stewbeta");
        Object.keys(contextualData).forEach((key) => {
            localSystemPrompt = localSystemPrompt.replaceAll(`{${key}}`, contextualData[key]);
        });

        convoCache[threadID] = {
            systemPrompt: localSystemPrompt,
            messages: [],
            contextualData,
            lastMessage: Date.now()
        };
    }

    // Add user message to history
    convoCache[threadID].messages.push({
        role: "user",
        content: message
    });

    // Build Discord navigation tools
    let tools = buildDiscordTools(guild) || {};

    // Build command-based tools if enough context is provided
    if (toolContext) {
        const commandTools = await buildCommandTools(toolContext);
        tools = { ...tools, ...commandTools };
    }

    // Apply tool blacklist
    const toolBlacklist = Array.isArray(aiOptions?.toolBlacklist) ? aiOptions.toolBlacklist : [];
    toolBlacklist.forEach(toolName => {
        if (toolName && Object.prototype.hasOwnProperty.call(tools, toolName)) {
            delete tools[toolName];
        }
    });

    // Convert empty tools object to undefined
    if (Object.keys(tools).length === 0) {
        tools = undefined;
    }

    const selectedModel = aiOptions?.model || GROQ_MODEL;
    const toolCallLimit = sanitizePositiveInteger(aiOptions?.maxSubsequentTools) || maxTools;
    const limitContext = {
        source: aiOptions?.source || "global",
        limit: toolCallLimit
    };

    // Track if we encounter a sendDirect tool result
    let directResponse = null;
    let abortForDirect = false;
    const abortController = new AbortController();

    try {
        const thisGroq = aiOptions?.apiKey
            ? createGroq({ apiKey: aiOptions.apiKey })
            : groq;

        const result = streamText({
            model: thisGroq(selectedModel),
            system: convoCache[threadID].systemPrompt,
            messages: convoCache[threadID].messages,
            tools,
            toolChoice: tools ? "auto" : undefined,
            maxOutputTokens: 2000,
            stopWhen: stepCountIs(toolCallLimit),
            abortSignal: abortController.signal,
            providerOptions: {
                groq: {
                    "reasoningEffort": REASONING_EFFORT, // TODO: make users able to set this themselves
                    "parallelToolCalls": false,
                    "user": `discord-id-${threadID}` // Basic research suggests this helps monitor and detect abuse. I'll remove it if it isn't helpful once we've run this feature for a while.
                }
            },
            onStepFinish: ({ text, toolCalls, toolResults, finishReason, stepType }) => {
                if (process.env.beta) {
                    console.log(`[Step ${stepType}] Text: "${text}", ToolCalls: ${toolCalls?.length || 0}, Finish: ${finishReason}`);
                    if (toolResults?.length > 0) {
                        toolResults.forEach((re, i) => {
                            console.log(`  Tool ${i}: ${toolCalls[i].toolName} -> ${JSON.stringify(re).substring(0, 200)}`);
                        });
                    }
                }

                // Check for sendDirect tool results - these should be sent directly to the user
                // NOTE: ai-sdk toolResults usually look like { type: 'tool-result', toolName, input, output }
                if (toolResults?.length > 0) {
                    for (const toolResult of toolResults) {
                        const payload = toolResult?.output ?? toolResult?.result ?? toolResult;
                        const sendDirectFlag = payload?.sendDirect === true;
                        const okFlag = payload?.ok === true; // Must explicitly be true

                        if (process.env.beta) {
                            console.log(`  sendDirect check: sendDirectFlag=${sendDirectFlag}, okFlag=${okFlag}`);
                        }

                        if (sendDirectFlag && okFlag) {
                            directResponse = {
                                content: payload?.response || payload?.message || "Command executed successfully (no output)",
                                toolName: toolResult?.toolName || payload?.toolName || "tool",
                                note: payload?.note || "The response was sent directly to the user."
                            };

                            if (!abortForDirect) {
                                abortForDirect = true;
                                abortController.abort(); // Stop further model generation once we have a direct response
                            }

                            break;
                        }
                    }
                }
            }
        });

        // Wait for the COMPLETE multi-step response (includes all tool calls and final text)
        let finalResponse;
        try {
            finalResponse = await result.response;
        }
        catch (err) {
            // If we aborted because of a direct response, swallow abort errors
            if (!(abortForDirect && (err?.name === "AbortError" || err?.message?.includes?.("aborted")))) {
                throw err;
            }
            finalResponse = { messages: [] };
        }

        // If we have a direct response from a sendDirect tool, return immediately.
        // The tool itself already sent the user-facing message; callers must NOT send any assistant text.
        if (directResponse) {
            // Add messages to history for context continuity
            if (finalResponse.messages && finalResponse.messages.length > 0) {
                convoCache[threadID].messages.push(...finalResponse.messages);
            }

            // Add a note to the history so the AI knows the response was already delivered
            convoCache[threadID].messages.push({
                role: "assistant",
                content: [{
                    type: "text",
                    text: `${directResponse.toolName} responded via sendDirect. ${directResponse.note || "The response was sent directly to the user."}`
                }]
            });

            // Do not send anything else to the user for this turn.
            // We still include a history note + tool text so the model has continuity later.
            return [noResponse, "direct", directResponse];
        }

        // Collect the full TEXT from the final step only
        let fullText = "";
        for await (const textPart of result.textStream) {
            fullText += textPart;
        }

        // Add all messages from this complete multi-step turn
        if (finalResponse.messages && finalResponse.messages.length > 0) {
            convoCache[threadID].messages.push(...finalResponse.messages);
        }

        // Catch empty AI messages
        if (!fullText || fullText.trim().length === 0) {
            // Check if tools were actually called
            const hadToolCalls = finalResponse.messages?.some(m =>
                m.role === "assistant" &&
                Array.isArray(m.content) &&
                m.content.some(c => c.type === "tool-call")
            );

            // Count tool calls without relying on Array.reduce typing (ai-sdk message unions can confuse linters)
            let toolCallCount = 0;
            for (const ai_message of (finalResponse.messages || [])) {
                if (ai_message?.role === "assistant" && Array.isArray(ai_message.content)) {
                    toolCallCount += Number(ai_message.content.filter(c => c.type === "tool-call").length);
                }
            }

            // Max tool calls, warn about limit.
            if (hadToolCalls && toolCallCount >= toolCallLimit) {
                // If the AI ran out of tool calls, tell the user that they can provide their own API key to set a higher limit.
                return [buildCustomToolLimitResponse(limitContext), "limit"];
            }

            // AI chose to not respond - even though it could have continued.
            return [noResponse, "success"];
        }

        // Standard AI text response, post process
        let responseText = fullText;
        responseText = await postprocessAIMessage(responseText, guild);
        return [{
            content: responseText,
            allowedMentions: buildAllowedMentionsForContent(responseText)
        }, "success"];
    }
    catch (e) {
        notify(`AI API error: \n${e.stack}`);
        return [{
            content: `Sorry, there was an error with the AI response. It has already been reported. Try again later.`
        }, "error"];
    }
    finally {
        if (convoCache[threadID]) {
            convoCache[threadID].lastMessage = Date.now();
        }
    }
}
function checkRateLimit(userId) {
    // Check if user has an active request
    if (activeAIRequests.has(userId)) {
        return { allowed: false, message: "You already have an active chat request. Please wait for that one to finish before requesting another." };
    }

    // Check if user is on cooldown
    const cooldownRemaining = userCooldowns.get(userId);
    if (cooldownRemaining) {
        const secondsLeft = Math.ceil((cooldownRemaining - Date.now()) / 1000);
        return { allowed: false, message: `To keep the ping-AI free, please wait ${secondsLeft} more second${secondsLeft !== 1 ? "s" : ""} before trying again.` };
    }

    return { allowed: true };
}
//#endregion

//#region Discord Events
/** @type {import("../command-module").CommandModule} */
module.exports = {
    resetAIRequests,
    buildDiscordTools: buildDiscordTools,
    buildCommandTools: buildCommandTools,
    handleApprovalButton: handleApprovalButton,
    GROQ_MODEL: GROQ_MODEL,
    maxTools: maxTools,

    // Subscribe to approval buttons
    subscribedButtons: [/^ai_(approve|deny)_.+$/],

    data: {
        command: new SlashCommandBuilder().setName("chat")
            .setDescription("Chat with Stewbot")
            .addStringOption(option =>
                option
                    .setName("message")
                    .setDescription("Message to stewbot")
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName("clear").setDescription("Clear history?")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),

        // Optional fields
        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] }, //Where the command can be used and what kind of installs it supports

        // Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Information, Categories.Entertainment],
            shortDesc: "Ask Stewbot's AI something",
            detailedDesc: "Have a fun chat with Stewbot's self-hosted AI"
        }


    },

    async execute(cmd) {
        // Check rate limits
        const rateLimitCheck = checkRateLimit(cmd.user.id);
        if (!rateLimitCheck.allowed) {
            return cmd.followUp({
                content: rateLimitCheck.message,
                ephemeral: true
            });
        }

        activeAIRequests.set(cmd.user.id, true);

        let message = cmd.options.getString("message");

        const clearHistory = cmd.options.getBoolean("clear");
        const threadID = cmd.user.id;

        message = await postprocessUserMessage(message, cmd.guild);

        if (clearHistory) {
            delete convoCache[threadID];
        }

        const aiUsageContext = await prepareAiUsageContext({
            userId: cmd.user.id,
            guild: cmd.guild,
            member: cmd.member
        });

        if (!aiUsageContext.allowed) {
            activeAIRequests.del(cmd.user.id);
            return cmd.followUp({
                content: buildRateLimitBlockMessage(aiUsageContext.blockReason),
                ephemeral: true
            });
        }

        // Build tool context for command tools
        const toolContext = {
            user: cmd.user,
            guild: cmd.guild,
            member: cmd.member,
            channel: cmd.channel,
            // When a command tool is configured as sendDirect, it should be sent immediately via the same interaction.
            sendDirectResponse: async (payload) => cmd.followUp(payload),
            sendApprovalRequest: async (toolName, args) => {
                const approvalId = `${cmd.user.id}_${Date.now()}_${Math.random().toString(36)
                    .slice(2, 8)}`;
                const approvalMessage = createApprovalEmbed(toolName, args, approvalId);

                await cmd.followUp(approvalMessage);
                return await waitForApproval(approvalId, cmd.user.id);
            }
        };

        let [response, status] = await getAiResponse(threadID, message, cmd.guild, {
            name: cmd.user.username,
            server: cmd.guild ? cmd.guild.name : "Direct Messages"
        }, aiUsageContext.aiOptions, toolContext);

        // If a tool was sendDirect, it already sent the response; do not send anything else.
        if (status === "direct") {
            activeAIRequests.del(cmd.user.id);
            userCooldowns.set(cmd.user.id, Date.now() + COOLDOWN_MS);
            return;
        }

        await cmd.followUp(response);

        activeAIRequests.del(cmd.user.id);
        userCooldowns.set(cmd.user.id, Date.now() + COOLDOWN_MS);
    },

    async [Events.MessageCreate](msg, globals, guildStore) {
        if (!msg.channel.isSendable()) return;

        // if (msg.author.id == "724416180097384498") msg.reply(buildCustomToolLimitResponse({ source: "personal", limit: 1 }));

        if (!msg.mentions.users.has(client.user.id)) return; // If the bot wasn't pinged

        // Check the guild settings since we already have it first
        const guild = guildStore;
        if (!guild?.config?.ai) return;

        // Then as long as the user did not blacklist it
        const user = await userByObj(msg.author);
        if (user?.config?.aiPings) {

            // Check rate limits
            const rateLimitCheck = checkRateLimit(msg.author.id);
            if (!rateLimitCheck.allowed) {
                // Send rate limit message for mentions
                try {
                    await msg.reply({
                        content: rateLimitCheck.message,
                        allowedMentions: { parse: [] }
                    });
                }
                catch (e) {
                    console.error("Failed to send rate limit message:", e);
                }
                return;
            }

            if ("sendTyping" in msg.channel) msg.channel.sendTyping();
            activeAIRequests.set(msg.author.id, true);

            let message = await postprocessUserMessage(msg.content, msg.guild);
            let threadID = msg.author.id;

            const aiUsageContext = await prepareAiUsageContext({
                userId: msg.author.id,
                guild: msg.guild,
                member: msg.member
            });

            if (!aiUsageContext.allowed) {
                activeAIRequests.del(msg.author.id);
                const rateMsg = buildRateLimitBlockMessage(aiUsageContext.blockReason);
                await msg.reply({
                    content: rateMsg,
                    allowedMentions: { parse: [] }
                }).catch(() => {});
                return;
            }

            // Build tool context for command tools
            const toolContext = {
                user: msg.author,
                guild: msg.guild,
                member: msg.member,
                channel: msg.channel,
                // When a command tool is configured as sendDirect, it should be sent immediately as a reply.
                sendDirectResponse: async (payload) => msg.reply(payload),
                sendApprovalRequest: async (toolName, args) => {
                    const approvalId = `${msg.author.id}_${Date.now()}_${Math.random().toString(36)
                        .slice(2, 8)}`;
                    const approvalMessage = createApprovalEmbed(toolName, args, approvalId);

                    await msg.reply(approvalMessage);
                    return await waitForApproval(approvalId, msg.author.id);
                }
            };

            let [response, success] = await getAiResponse(threadID, message, msg.guild, {
                name: msg.author.username,
                server: msg.guild ? msg.guild.name : "Direct Messages"
            }, aiUsageContext.aiOptions, toolContext);

            // If a tool was sendDirect, it already sent the response; do not send anything else.
            if (success === "direct") {
                activeAIRequests.del(msg.author.id);
                userCooldowns.set(msg.author.id, Date.now() + COOLDOWN_MS);
                return;
            }

            if (success !== "error") { // TODO: send some level of errors if they own the key and the error is related to Groq
                let stillExists; // Message could have been deleted/filtered since sending
                try {
                    stillExists = await msg.channel.messages.fetch(msg.id);
                }
                catch {
                    stillExists = false;
                }

                // Trim emojis as reactions
                var emojiEnding = /[\p{Emoji}\uFE0F]\s*$/u;
                var emoji = null;

                let responseContent = typeof response.content === "string" ? response.content : "";

                if (responseContent && stillExists && emojiEnding.test(responseContent)) {
                    emoji = responseContent.match(emojiEnding)[0];
                    responseContent = responseContent.replace(emojiEnding, "");
                }

                // React
                try {
                    if (emoji) await msg.react(emoji.trim());
                }
                catch {
                    // Some emojis are not in discord, throw back on message instead.
                    responseContent += emoji;
                }

                if (!user.config?.beenAIDisclaimered && responseContent) {
                    user.config.beenAIDisclaimered = true;
                    user.save();
                    responseContent += `\n-# This is part of a Stewbot feature. If you wish to disable it, a user can run /personal_config to disable it for them personally, or a moderator can run /general_config.`;
                }

                // For text responses - TODO: this is a little janky, would be better if it was handled in getAiResponse which returned an array of messages to send.
                if (responseContent) {
                    // If response is > 2000 chars, split it up.
                    let remainingContent = responseContent;
                    while (remainingContent.length > 0) {
                        let chunk = remainingContent.slice(0, 2000 - 3);
                        remainingContent = remainingContent.slice(2000 - 3);
                        if (remainingContent.length > 0) chunk += "...";
                        const chunkAllowedMentions = buildAllowedMentionsForContent(chunk);

                        // If the user deleted their message, send without replying
                        if (stillExists) {
                            await msg.reply({
                                content: chunk,
                                allowedMentions: chunkAllowedMentions
                            });
                        }
                        else {
                            await msg.channel.send({
                                content: chunk,
                                allowedMentions: chunkAllowedMentions
                            });
                        }
                    }
                }
                else {
                    await msg.reply({
                        ...response,
                        allowedMentions: response.allowedMentions || { parse: [] }
                    }).catch((e) => {
                        notify(e);
                    });
                }

                activeAIRequests.del(msg.author.id);
                userCooldowns.set(msg.author.id, Date.now() + COOLDOWN_MS);
            }
            else {
                activeAIRequests.del(msg.author.id);
            }
        }
    },

    // Handle approval button clicks
    async onbutton(interaction) {
        const result = handleApprovalButton(interaction.customId, interaction.user.id);

        if (!result) {
            // Not an approval button we recognize
            return;
        }

        if (result.error) {
            await interaction.reply({
                content: result.error,
                ephemeral: true
            });
            return;
        }

        const toolApproved = [
            new ContainerBuilder()
                .setAccentColor(65360)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("## Tool Approved")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("Running command...")
                )
        ];

        const toolDenied = [
            new ContainerBuilder()
                .setAccentColor(14234383)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("## Tool Denied")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("You denied this tool request. The AI has been informed.")
                )
        ];

        await interaction.update({
            components: result.approved ? toolApproved : toolDenied,
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};
//#endregion
