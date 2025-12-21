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

const Categories = require("./modules/Categories");
const client = require("../client.js");
const { PersonalAIs, userByObj, guildByObj } = require("./modules/database.js");
const { Events, SlashCommandBuilder, MessageFlags, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ContainerBuilder } = require("discord.js");
const { limitLength, notify } = require("../utils.js");
const fs = require("fs");
const ms = require("ms");
const Fuse = require("fuse.js");
const NodeCache = require("node-cache");
const { censor } = require("./filter");

// AI SDKs
const { groq, createGroq } = require("@ai-sdk/groq");
const { streamText, tool, stepCountIs } = require("ai");
const { z } = require("zod");

// Configuration
const REASONING_EFFORT = "low";
const MAX_USER_MENTIONS = 3;
const maxTools = 2;
const COOLDOWN_MS = process.env.beta ? ms("4s") : ms("8s");
const DEFAULT_CUSTOM_RATELIMIT = 10;
const DEFAULT_CUSTOM_RATELIMIT_CYCLE_MS = ms("1 hour");
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


function resetAIRequests() {
    activeAIRequests.flushAll();
    userCooldowns.flushAll();
}

//#region Tools

// Setup discord -> tool calling functions
const GeminiType = {
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
    BOOLEAN: "BOOLEAN",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT"
};

// Mapping from Discord ApplicationCommandOptionType enum values
// https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandOptionType
function discordTypeToGeminiType(discordType) {
    switch (discordType) {
        case 3: return "STRING"; // STRING
        case 4: return "INTEGER"; // INTEGER
        case 5: return "BOOLEAN"; // BOOLEAN
        case 6: return "STRING"; // USER (ID or mention)
        case 7: return "STRING"; // CHANNEL (ID or mention)
        case 8: return "STRING"; // ROLE (ID or mention)
        case 9: return "STRING"; // MENTIONABLE
        case 10: return "NUMBER"; // NUMBER
        case 11: return "STRING"; // ATTACHMENT (ID or URL placeholder)
        default:
            console.warn(`Unknown Discord option type: ${discordType}. Defaulting to STRING.`);
            return GeminiType.STRING; // Fallback
    }
}

function processParameterOptions(discordOptions) {
    const parameters = {
        type: GeminiType.OBJECT, // Or Type.OBJECT
        properties: {},
        required: []
    };

    if (!discordOptions || !Array.isArray(discordOptions)) {
        // No parameters, return empty structure
        // Gemini requires 'parameters', even if empty
        delete parameters.required;
        return parameters;
    }

    for (const paramOption of discordOptions) {
        const paramName = paramOption.name;
        // Fallback description if none provided
        const paramDesc = paramOption.description || `Parameter ${paramName}`;

        // Enhance description with constraints
        let enhancedDesc = paramDesc;
        if (paramOption.channel_types) {
            enhancedDesc += ` (Channel types: ${paramOption.channel_types.join(", ")})`; // You might map numbers to names
        }
        if (paramOption.min_length !== undefined) {
            enhancedDesc += ` (Min length: ${paramOption.min_length})`;
        }
        if (paramOption.max_length !== undefined) {
            enhancedDesc += ` (Max length: ${paramOption.max_length})`;
        }
        if (paramOption.choices && Array.isArray(paramOption.choices)) {
            const choiceList = paramOption.choices.map(c => `'${c.name}' (${c.value})`).join(", ");
            enhancedDesc += ` (Choices: ${choiceList})`;
        }
        // Add min/max value if applicable (for NUMBER/INTEGER types if present in your data)

        parameters.properties[paramName] = {
            type: discordTypeToGeminiType(paramOption.type),
            description: enhancedDesc
        };

        if (paramOption.required) {
            parameters.required.push(paramName);
        }
    }

    // If there are no required parameters, Gemini might prefer omitting the 'required' array
    if (parameters.required.length === 0) {
        delete parameters.required;
    }

    // Keep properties object even if empty, Gemini seems to require it.
    // if (Object.keys(parameters.properties).length === 0) {
    //    delete parameters.properties;
    //}

    return parameters;
}

function convertCommandsToTools(commandsLoaded) {
    const tools = [];

    for (const commandName in commandsLoaded) {
        const commandDefinition = commandsLoaded[commandName];
        if (!commandDefinition?.data?.command) continue; // Skip malformed

        const commandData = commandDefinition.data;
        const mainCommand = commandData.command;
        const helpData = commandData.help || {};

        const hasOptions = mainCommand.options && Array.isArray(mainCommand.options) && mainCommand.options.length > 0;
        let isSubcommandBased = false;

        if (hasOptions) {
            // Check if the *first* option looks like a subcommand (has nested options or specific type)
            // Relying on nested 'options' seems most reliable based on your examples.
            const firstOption = mainCommand.options[0];
            // Type 1 = SUB_COMMAND, Type 2 = SUB_COMMAND_GROUP
            // if (firstOption.type === 1 || firstOption.type === 2 || (firstOption.options && Array.isArray(firstOption.options))) {
            if (firstOption.options && Array.isArray(firstOption.options)) { // Simplified check based on examples
                isSubcommandBased = true;
            }
        }

        if (isSubcommandBased) {
            // --- Process Subcommands ---
            for (const subCommandOption of mainCommand.options) {
                // Ensure it's definitely a subcommand structure before processing
                if (subCommandOption.options && Array.isArray(subCommandOption.options)) {
                    const toolName = `${commandName}_${subCommandOption.name}`;
                    // Use specific help description if available, otherwise subcommand description
                    const toolDescription = helpData[subCommandOption.name]?.detailedDesc || subCommandOption.description || `Executes the ${toolName} action.`;

                    const parameters = processParameterOptions(subCommandOption.options); // Process its parameters

                    const thisTool = {
                        name: toolName,
                        description: toolDescription,
                        parameters: parameters
                    };
                    tools.push(thisTool);
                }
                else {
                    // Handle cases where a command might unexpectedly mix subcommands and direct parameters
                    console.warn(`Command '${commandName}' has an option '${subCommandOption.name}' that looks like a direct parameter mixed with subcommands. Skipping.`);
                }
            }
        }
        else {
            // --- Process as Main Command (with or without parameters) ---
            const toolName = commandName;
            // For non-subcommand commands, the 'help' object directly contains the details (if structured like admin_message)
            // Or fallback to main command description
            const toolDescription = helpData?.detailedDesc || mainCommand.description || `Executes the ${toolName} command.`;

            // Process the main command's options (which are direct parameters)
            const parameters = processParameterOptions(mainCommand.options); // Pass options directly

            const thisTool = {
                name: toolName,
                description: toolDescription,
                parameters: parameters // Contains parameters if mainCommand.options existed, empty otherwise
            };
            tools.push(thisTool);
        }
    }

    return tools;
}

// Hardcoded Discord tools the AI can call
const TOOL_DEFAULT_LIMIT = 5;
const TOOL_MAX_LIMIT = 15;
const TOOL_MESSAGE_PREVIEW = 400;

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

//#region AI
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
 * @typedef {"success"|"error"|"limit"} Status
 * @returns {Promise<[InteractionReplyOptions, Status]>} Resolves to a tuple: [AI response object, status].
 */
async function getAiResponse(threadID, message, guild, contextualData = {}, aiOptions = {}) {
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
    let tools = buildDiscordTools(guild) || undefined;
    const toolBlacklist = Array.isArray(aiOptions?.toolBlacklist) ? aiOptions.toolBlacklist : [];
    if (tools) {
        toolBlacklist.forEach(toolName => {
            if (toolName && Object.prototype.hasOwnProperty.call(tools, toolName)) {
                delete tools[toolName];
            }
        });

        if (Object.keys(tools).length === 0) {
            tools = undefined;
        }
    }

    const selectedModel = aiOptions?.model || GROQ_MODEL;
    const toolCallLimit = sanitizePositiveInteger(aiOptions?.maxSubsequentTools) || maxTools;
    const limitContext = {
        source: aiOptions?.source || "global",
        limit: toolCallLimit
    };

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
            }
        });

        // Wait for the COMPLETE multi-step response (includes all tool calls and final text)
        const finalResponse = await result.response;

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

            const toolCallCount = finalResponse.messages?.reduce((count, ai_message) => {
                if (ai_message.role === "assistant" && Array.isArray(ai_message.content)) {
                    return count + ai_message.content.filter(c => c.type === "tool-call").length;
                }
                return count;
            }, 0) || 0;

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

/** @type {import("../command-module").CommandModule} */
module.exports = {
    resetAIRequests,
    convertCommandsToTools,
    buildDiscordTools: buildDiscordTools,
    GROQ_MODEL: GROQ_MODEL,
    maxTools: maxTools,

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

        let [response, _success] = await getAiResponse(threadID, message, cmd.guild, {
            name: cmd.user.username,
            server: cmd.guild ? cmd.guild.name : "Direct Messages"
        }, aiUsageContext.aiOptions);

        cmd.followUp(response);

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

            let [response, success] = await getAiResponse(threadID, message, msg.guild, {
                name: msg.author.username,
                server: msg.guild ? msg.guild.name : "Direct Messages"
            }, aiUsageContext.aiOptions);

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
    }
};
