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

// TODO: text... text on the modal... text saying that the ratelimit may not be respected if stewbot restarts.

const Categories = require("./modules/Categories");
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuOptionBuilder, TextInputStyle, LabelBuilder, ActionRowBuilder, Events, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, MessageFlags, StringSelectMenuBuilder, PermissionFlagsBits } = require("discord.js");
const { PersonalAIs, guildByObj } = require("./modules/database.js");
const { buildDiscordTools, GROQ_MODEL, maxTools: defaultMaxTools } = require("./chat.js");
const { limitLength, notify } = require("../utils.js");
const ms = require("ms");
const NodeCache = require("node-cache");


function parseRoleIds(input) {
    if (!input) return [];

    const ids = [];
    const mentionRegex = /<@&(\d+)>/g;
    let match;

    while ((match = mentionRegex.exec(input))) {
        ids.push(match[1]);
    }

    const tokens = input.split(/[\s,]+/).map(t => t.trim())
        .filter(Boolean);
    for (const token of tokens) {
        if (/^\d{5,}$/.test(token)) {
            ids.push(token);
        }
    }

    return Array.from(new Set(ids));
}

const personalExplanation = `We allow you to provide an API key we should use **just for you**. Because this is your key, we let you configure your own limits. We do not use your personal key for others, it will only be used on any of your calls to our API system.`;
const serverExplanation = `If you are a server owner, we allow you to set an AI API key that we should use *for your whole server*, allowing your members and moderators to have higher limits that you set. If a user has a personal API key set, his messages will use this key before using the server API key.`;
const helpExplanation = [
    new ContainerBuilder()
        .setAccentColor(4180079)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("## How does our AI system work?")
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "### Global API\n" +
                `We pay to host a global AI for everyone. This costs a lot of money, and Stewbot is just a passion project that does not have paid tiers. This means we have to limit how much everyone can use our AI. Want to help? ${cmds.donate.mention}\n` +
                "\n" +
                "### Your Personal API Key\n" +
                `${personalExplanation} Setup with ${cmds.ai_config.personal_ai.mention}\n` +
                "\n" +
                "### Server API Key\n" +
                `${serverExplanation} Setup with ${cmds.ai_config.server_ai.mention}\n`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
                .setDivider(true)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "- [Register for an API Key](https://console.groq.com/keys)\n" +
                "- [Join the Support Server](https://discord.gg/cRqzQXNp)"
            )
        )
];

const pendingServerOverrides = new NodeCache({ stdTTL: 600, checkperiod: 60 });


function censorApiKey(key) {
    // Note: current logic dictates that a double censored key must be the same as a single censored key.
    if (key.length <= 20) return "*".repeat(key.length); // Fallback in case they change it to something short
    return key.slice(0, 8) + "*".repeat(20) + key.slice(-4);
}

/**
 * @returns {Promise<[[boolean, boolean], string]>} A promise that resolves to a tuple:
 *   - The first element is an array of two booleans:
 *     - The first boolean indicates if the API key is valid.
 *     - The second boolean indicates if the model is valid.
 *   - The second element is a message describing the result or error.
 */
async function validateKeyAndModel(key, model) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (data.error) {
            if (data.error.code === "invalid_api_key") {
                return [[false, false], "The API key you provided is invalid."];
            }
            throw new Error(`Unknown validateKeyAndModel error: ${JSON.stringify(data.error)}`);
        }
        const models = data.data.map(m => m.id);
        if (model && !models.includes(model)) {
            return [[true, false], `The model "${model}" is not valid. Please see https://console.groq.com/docs/models for a list of valid models.`];
        }
        return [[true, true], ""];
    }
    catch (e) {
        notify(e);
        return [[false, false], "Unknown error"];
    }

}

/**
 * @param {Guild} guild
 * @param {HydratedDocument<PersonalAIs>} existing - PersonalAIs document containing existing settings
 * @param {"personal"|"server"} type - The type of API key being configured ("personal" or "server").
 */
function buildModalComponents(guild, existing, type) {

    // Builds modal components
    const terms = new LabelBuilder()
        .setLabel("Terms Acknowledgment")
        .setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
                .setCustomId("terms_acknowledge")
                .setRequired(true)
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Agreed")
                        .setDescription("I acknowledge and agree to the API usage terms (see /ai_config terms)")
                        .setValue("agreed")
                        .setDefault(Boolean(existing))
                )
        );

    const apiKeyInput = new LabelBuilder()
        .setLabel(type === "personal" ? "Your API key - this is used only for you" : "Server API key - only for your server")
        .setTextInputComponent(
            new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId("my_api_key")
                .setPlaceholder("e.g., gsk_********************************")
                .setValue(existing?.key ? censorApiKey(existing.key) : "")
                .setRequired(false)
        );


    const possibleTools = Object.entries(buildDiscordTools(guild)); // TODO: if this gets above 25, it will need a solution such as multiple dropdowns
    const disabledToolsInput = new LabelBuilder()
        .setLabel("Disabled Tools")
        .setDescription("Select any tools you want to disable Stewbot using when talking with you. ")
        .setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
                .setCustomId("disabled_tools")
                .setRequired(false)
                .setMaxValues(possibleTools.length)
                .addOptions(
                    possibleTools.map(([toolName, tool]) => (
                        new StringSelectMenuOptionBuilder()
                            .setLabel(toolName)
                            .setDescription(limitLength(tool.description, 100))
                            .setValue(toolName)
                            .setDefault(existing?.toolBlacklist?.includes(toolName) || false)
                    ))
                )
        );

    const llmModelInput = new LabelBuilder()
        .setLabel("LLM Model")
        .setDescription("Must be a valid text LLM supported by Groq.")
        .setTextInputComponent(
            new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId("model")
                .setPlaceholder(GROQ_MODEL)
                .setValue(existing?.llm_model || "")
                .setRequired(false)
        );

    const subsequentToolLimitInput = new LabelBuilder()
        .setLabel("Subsequent Tool Call Limit")
        .setDescription("This prevents burning through your API credits when the model hallucinates.")
        .setTextInputComponent(
            new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId("subsequent_tool_limit")
                .setPlaceholder(String(defaultMaxTools))
                .setValue(existing?.subsequentToolLimit ? String(existing.subsequentToolLimit) : "")
                .setRequired(false)
        );

    const ratelimitCycleLengthInput = new LabelBuilder()
        .setLabel("Rate Limit Cycle Length")
        .setDescription("How long a ratelimit cycle should last?")
        .setTextInputComponent(
            new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId("ratelimitCycleLength")
                .setPlaceholder("5 minutes")
                .setValue(existing?.ratelimitCycleLength ? ms(existing.ratelimitCycleLength) : "")
                .setRequired(false)
        );

    const ratelimitInput = new LabelBuilder()
        .setLabel("Rate Limit")
        .setDescription("How many requests per user per ratelimit cycle?")
        .setTextInputComponent(
            new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId("ratelimit")
                .setPlaceholder("e.g., 10")
                .setValue(existing?.ratelimit ? String(existing.ratelimit) : "")
                .setRequired(false)
        );

    const ratelimitRebootDisclaimer = new TextDisplayBuilder()
        .setContent("Note: ratelimits may not be fully respected if Stewbot restarts.");


    return {
        terms,
        apiKeyInput,
        disabledToolsInput,
        llmModelInput,
        subsequentToolLimitInput,
        ratelimitCycleLengthInput,
        ratelimitInput,
        ratelimitRebootDisclaimer
    };
}

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setName("ai_config")
            .setDescription("Configure AI settings")
            .addSubcommand(sub =>
                sub.setName("personal_ai")
                    .setDescription("Set your personal AI API key")
            )
            .addSubcommand(sub =>
                sub.setName("server_ai")
                    .setDescription("Set a custom server AI API key")
            )
            .addSubcommand(sub =>
                sub.setName("server_ai_access")
                    .setDescription("Control which roles can use Stewbot's AI in this server")
                    .addStringOption(option =>
                        option.setName("mode")
                            .setDescription("Choose how AI access should work")
                            .setRequired(true)
                            .addChoices(
                                { name: "Allow All", value: "disabled" },
                                { name: "Whitelist", value: "whitelist" },
                                { name: "Blacklist", value: "blacklist" }
                            )
                    )
                    .addRoleOption(option =>
                        option.setName("role")
                            .setDescription("Role to add to the access list")
                            .setRequired(false)
                    )
                    .addStringOption(option =>
                        option.setName("roles")
                            .setDescription("Additional roles (IDs or mentions, space/comma separated)")
                            .setRequired(false)
                    )
            )
            .addSubcommand(sub =>
                sub.setName("help")
                    .setDescription("Send an explanation for how our AI is setup, and how to configure your own API keys.")
            )
            .addSubcommand(sub =>
                sub.setName("terms")
                    .setDescription("View terms related to AI API key usage and billing")
            ),

        extra: { "contexts": [0], "integration_types": [0] },
        requiredGlobals: [],
        help: {
            helpCategories: [Categories.Configuration, Categories.Information],
            shortDesc: "Configure AI settings",
            detailedDesc: "Configure your personal AI API key for Stewbot integrations."
        }
    },

    async execute(cmd) {
        if (cmd.options.getSubcommand() === "help") {
            return await cmd.followUp({
                components: helpExplanation,
                flags: [MessageFlags.IsComponentsV2]
                // ephemeral: true
            });
        }
        else if (cmd.options.getSubcommand() === "terms") {
            const termsComponents = [
                new ContainerBuilder()
                    .setAccentColor(0xAA0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("## AI API Usage Terms")
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                            .setSpacing(SeparatorSpacingSize.Small)
                            .setDivider(true)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "**Billing & Usage**\n" +
                            "- By providing an API key, you acknowledge that this service will make requests to the associated API provider on your behalf.\n" +
                            "- These requests may consume usage credits and may result in charges from your provider if billing is enabled on your API provider account.\n" +
                            "- All pricing, quotas, limits, and billing are determined solely by the API provider.\n\n" +

                            "**Responsibility**\n" +
                            "- You are solely responsible for monitoring your API usage, securing your API key, and any charges incurred.\n" +
                            "- You may revoke or rotate your API key at any time via your API provider.\n\n" +

                            "**Liability**\n" +
                            "- The service and its representatives accept no responsibility or liability for API charges, service interruptions, unexpected usage, or damages arising from the use of your API key."
                        )
                    )
            ];

            return await cmd.followUp({
                components: termsComponents,
                flags: [MessageFlags.IsComponentsV2],
                ephemeral: true
            });
        }
        else if (cmd.options.getSubcommand() === "personal_ai") {
            const existing = await PersonalAIs.findOne({ id: cmd.user.id });

            const buttons = [
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Setup")
                    .setCustomId("personal_ai_setup")
            ];

            if (existing?.key) {
                buttons.push(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Delete My Key")
                        .setCustomId("personal_ai_delete")
                );
            }

            const personalAiSetup = [
                new ContainerBuilder()
                    .setAccentColor(4180079)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(personalExplanation)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                            .addComponents(...buttons)
                    )
            ];

            return await cmd.followUp({
                components: personalAiSetup,
                flags: [MessageFlags.IsComponentsV2]
            });

        }
        else if (cmd.options.getSubcommand() === "server_ai_access") {
            if (!cmd.guild?.id) {
                return await cmd.followUp({
                    content: "Sorry, this command can only be used in servers that I am installed into.",
                    ephemeral: true
                });
            }

            if (!cmd.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return await cmd.followUp({
                    content: "You need the `Manage Server` permission to configure server AI access.",
                    ephemeral: true
                });
            }

            const mode = cmd.options.getString("mode", true);
            const selectedRole = cmd.options.getRole("role");
            const rolesInput = cmd.options.getString("roles");

            const existingGuild = await guildByObj(cmd.guild);
            const existingRoles = Array.isArray(existingGuild?.config?.aiAccessRoles)
                ? existingGuild.config.aiAccessRoles.filter(Boolean)
                : [];

            const parsedRoles = parseRoleIds(rolesInput);
            if (selectedRole) parsedRoles.push(selectedRole.id);

            const shouldUpdateRoles = mode === "disabled" || selectedRole !== null || rolesInput !== null;
            const finalRoles = mode === "disabled"
                ? []
                : (shouldUpdateRoles ? Array.from(new Set(parsedRoles)) : existingRoles);

            await guildByObj(cmd.guild, {
                "config.aiAccessMode": mode,
                "config.aiAccessRoles": finalRoles
            });

            return await cmd.followUp({
                content: `Updated AI access for this server.`,
                ephemeral: true,
                allowedMentions: { parse: [] }
            });
        }
        else if (cmd.options.getSubcommand() === "server_ai") {
            if (!cmd.guild?.id) {
                return await cmd.followUp({
                    content: "Sorry, this command can only be used in servers that I am installed into.",
                    ephemeral: true
                });
            }

            const existing = await PersonalAIs.findOne({ id: cmd.guild.id });

            const buttons = [
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Setup")
                    .setCustomId("server_ai_setup"),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Configure Ratelimits")
                    .setCustomId("server_ai_ratelimits")
            ];

            if (existing?.key) {
                buttons.push(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Delete My Key")
                        .setCustomId("server_ai_delete")
                );
            }

            const serverAiSetup = [
                new ContainerBuilder()
                    .setAccentColor(4180079)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(serverExplanation)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                            .addComponents(...buttons)
                    )
            ];

            return await cmd.followUp({
                components: serverAiSetup,
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    },

    // Handle buttons
    subscribedButtons: [
        "personal_ai_setup",
        "server_ai_setup",
        "server_ai_ratelimits",
        "personal_ai_delete",
        "server_ai_delete",
        /personal_ai_delete_confirm.+/,
        /personal_ai_delete_cancel.+/,
        /server_ai_delete_confirm.+/,
        /server_ai_delete_cancel.+/,
        /server_ai_override_confirm.+/,
        /server_ai_override_cancel.+/
    ],
    async onbutton(cmd) {
        if (cmd.customId === "personal_ai_setup") {
            // Load current settings:
            const existing = await PersonalAIs.findOne({
                "id": cmd.user.id
            });

            const components = buildModalComponents(cmd.guild, existing, "personal");

            // Show modal for API key input
            const modal = new ModalBuilder()
                .setCustomId("personal_ai_modal")
                .setTitle("Personal AI Configuration");

            modal.addLabelComponents(components.terms);
            modal.addLabelComponents(components.apiKeyInput);
            modal.addLabelComponents(components.disabledToolsInput);
            modal.addLabelComponents(components.llmModelInput);
            modal.addLabelComponents(components.subsequentToolLimitInput);

            return await cmd.showModal(modal);
        }
        else if (cmd.customId === "server_ai_setup") {
            if (!cmd.guild?.id) {
                return await cmd.reply({
                    content: "Sorry, this button can only be used in servers that I am installed into.",
                    ephemeral: true
                });
            }

            if (!cmd.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return await cmd.reply({
                    content: "You need the `Manage Server` permission to configure server AI access.",
                    ephemeral: true
                });
            }

            // Load current settings:
            const existing = cmd.user.id ? await PersonalAIs.findOne({
                id: cmd.guildId,
                ownerId: cmd.user.id
            }) : null; // (Fallback to null in case ID is missing, to make sure we don't load something random)

            const components = buildModalComponents(cmd.guild, existing, "server");

            // Show modal for API key input
            const modal = new ModalBuilder()
                .setCustomId("server_ai_modal")
                .setTitle("Server AI Configuration");

            modal.addLabelComponents(components.terms);
            modal.addLabelComponents(components.apiKeyInput);
            modal.addLabelComponents(components.disabledToolsInput);
            modal.addLabelComponents(components.llmModelInput);
            // modal.addLabelComponents(components.subsequentToolLimitInput); // Put in ratelimit section for servers

            return await cmd.showModal(modal);
        }
        else if (cmd.customId === "server_ai_ratelimits") {
            if (!cmd.guild?.id) {
                return await cmd.reply({
                    content: "Sorry, this button can only be used in servers that I am installed into.",
                    ephemeral: true
                });
            }

            if (!cmd.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return await cmd.reply({
                    content: "You need the `Manage Server` permission to configure server AI access.",
                    ephemeral: true
                });
            }

            // Load current settings:
            const existing = cmd.user.id ? await PersonalAIs.findOne({
                id: cmd.guildId,
                ownerId: cmd.user.id
            }) : null; // (Fallback to null in case ID is missing, to make sure we don't load something random)

            const components = buildModalComponents(cmd.guild, existing, "server");

            // Show modal for API key input
            const modal = new ModalBuilder()
                .setCustomId("server_ai_modal")
                .setTitle("Server AI Ratelimits");

            modal.addLabelComponents(components.terms);
            modal.addLabelComponents(components.subsequentToolLimitInput);
            modal.addLabelComponents(components.ratelimitCycleLengthInput);
            modal.addLabelComponents(components.ratelimitInput);
            modal.addTextDisplayComponents(components.ratelimitRebootDisclaimer);

            return await cmd.showModal(modal);
        }
        else if (cmd.customId === "personal_ai_delete") {
            if (!cmd.user?.id) return;

            return await cmd.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(13154111)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("Are you sure? This will delete settings tied to your AI key.")
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`personal_ai_delete_confirm:${cmd.user.id}`)
                                        .setLabel("Yes, delete it")
                                        .setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder()
                                        .setCustomId(`personal_ai_delete_cancel:${cmd.user.id}`)
                                        .setLabel("Cancel")
                                        .setStyle(ButtonStyle.Secondary)
                                )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2],
                ephemeral: true
            });

        }
        else if (cmd.customId === "server_ai_delete") {
            if (!cmd.guild?.id || !cmd.user?.id) {
                return await cmd.reply({ content: "Sorry, this button can only be used in servers that I am installed into.", ephemeral: true });
            }

            const existing = await PersonalAIs.findOne({ id: cmd.guild.id });
            if (!existing) {
                return await cmd.reply({ content: "No server AI key is set for this server.", ephemeral: true });
            }
            if (existing.ownerId && existing.ownerId !== cmd.user.id) {
                return await cmd.reply({ content: `Only the current server key owner (<@${existing.ownerId}>) can delete it.`, ephemeral: true });
            }

            return await cmd.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(13154111)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("Are you sure? This will delete settings tied to your AI key.")
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`server_ai_delete_confirm:${cmd.guild.id}:${cmd.user.id}`)
                                        .setLabel("Yes, delete it")
                                        .setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder()
                                        .setCustomId(`server_ai_delete_cancel:${cmd.guild.id}:${cmd.user.id}`)
                                        .setLabel("Cancel")
                                        .setStyle(ButtonStyle.Secondary)
                                )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2],
                ephemeral: true
            });


        }
        else if (cmd.customId.startsWith("personal_ai_delete_confirm:")) {
            const [, ownerId] = cmd.customId.split(":");
            if (cmd.user.id !== ownerId) {
                return await cmd.reply({ content: "You cannot confirm deletion for another user.", ephemeral: true });
            }

            await PersonalAIs.deleteOne({ id: cmd.user.id });

            return await cmd.reply({
                content: "Your personal AI settings were deleted.",
                ephemeral: true
            });
        }
        else if (cmd.customId.startsWith("personal_ai_delete_cancel:")) {
            const [, ownerId] = cmd.customId.split(":");
            if (cmd.user.id !== ownerId) {
                return await cmd.reply({ content: "This delete prompt is not for you.", ephemeral: true });
            }
            return await cmd.reply({ content: "Deletion canceled.", ephemeral: true });
        }
        else if (cmd.customId.startsWith("server_ai_delete_confirm:")) {
            if (!cmd.guild?.id) return;
            const [, guildId, ownerId] = cmd.customId.split(":");
            if (cmd.guild.id !== guildId || cmd.user.id !== ownerId) {
                return await cmd.reply({ content: "This delete prompt is not for you.", ephemeral: true });
            }

            await PersonalAIs.deleteOne({ id: guildId });

            return await cmd.reply({ content: "Server AI settings were deleted.", ephemeral: true });
        }
        else if (cmd.customId.startsWith("server_ai_delete_cancel:")) {
            const [, guildId, ownerId] = cmd.customId.split(":");
            if (!cmd.guild?.id || cmd.guild.id !== guildId || cmd.user.id !== ownerId) {
                return await cmd.reply({ content: "This delete prompt is not for you.", ephemeral: true });
            }
            return await cmd.reply({ content: "Deletion canceled.", ephemeral: true });
        }
        else if (cmd.customId.startsWith("server_ai_override_confirm:")) {
            if (!cmd.guild?.id || !cmd.user?.id) return;
            const [, userId, guildId] = cmd.customId.split(":");
            if (cmd.user.id !== userId || cmd.guild.id !== guildId) {
                return await cmd.reply({ content: "This override request is not for you.", ephemeral: true });
            }

            const key = `${userId}:${guildId}`;
            const pending = pendingServerOverrides.get(key) || null;
            if (!pending) {
                return await cmd.reply({ content: "This override request expired. Please fill out the Server AI fields again.", ephemeral: true });
            }

            pendingServerOverrides.del(key);

            // Might as well re-check permissions
            if (!cmd.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return await cmd.reply({
                    content: "You need the `Manage Server` permission to configure server AI access.",
                    ephemeral: true
                });
            }


            await PersonalAIs.updateOne(
                { id: cmd.guild.id, ownerId: pending.userId },
                { $set: pending.updates },
                { upsert: true, new: true }
            );

            return await cmd.reply({
                content:
                    "Settings saved.\n" +
                    (pending.errors.length > 0 ? "\n" + pending.errors.map(e => `- ${e}`).join("\n") : ""),
                ephemeral: true
            });
        }
        else if (cmd.customId.startsWith("server_ai_override_cancel:")) {
            if (!cmd.guild?.id || !cmd.user?.id) return;
            const [, userId, guildId] = cmd.customId.split(":");
            if (cmd.user.id !== userId || cmd.guild.id !== guildId) {
                return await cmd.reply({ content: "This override request is not for you.", ephemeral: true });
            }

            pendingServerOverrides.del(`${userId}:${guildId}`);
            return await cmd.reply({ content: "Override canceled.", ephemeral: true });
        }
    },

    // Handle modals
    async [Events.InteractionCreate](cmd) {
        if (!cmd.isModalSubmit()) return;

        const isPersonalModal = cmd.customId === "personal_ai_modal";
        const isServerModal = cmd.customId === "server_ai_modal";
        if (!isPersonalModal && !isServerModal) return;

        if (!cmd.user?.id || (isServerModal && !cmd.guild?.id)) return;

        // Recheck permissions here
        if (!cmd.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return await cmd.reply({
                content: "You need the `Manage Server` permission to configure server AI access.",
                ephemeral: true
            });
        }


        const existingConfig = await PersonalAIs.findOne(
            isPersonalModal
                ? { id: cmd.user.id }
                : { id: cmd.guild.id, ownerId: cmd.user.id }
        );

        const apiKeyInput = cmd.fields.fields.has("my_api_key") && cmd.fields.getTextInputValue("my_api_key").trim();
        const apiKeyWasCensored = apiKeyInput && censorApiKey(apiKeyInput) === apiKeyInput;
        const differentOwner = isServerModal && existingConfig?.ownerId && existingConfig.ownerId !== cmd.user.id;

        if (differentOwner && (apiKeyWasCensored || !apiKeyInput)) {
            return await cmd.reply({
                content: "Please enter your full API key when overriding another owner's server key.",
                ephemeral: true
            });
        }

        const apiKeyToUse = apiKeyInput
            ? (apiKeyWasCensored ? existingConfig?.key : apiKeyInput)
            : existingConfig?.key;

        if (!apiKeyToUse) {
            return await cmd.reply({
                content: "Please enter your API key first.",
                ephemeral: true
            });
        }

        const requestedModel = cmd.fields.fields.has("model") && cmd.fields.getTextInputValue("model") || existingConfig?.llm_model || undefined;
        const validationResult = await validateKeyAndModel(apiKeyToUse, requestedModel);
        const [[keyValid, modelValid], validationMessage] = validationResult || [[false, false], "Unknown error"];
        if (!keyValid || !modelValid) {
            return await cmd.reply({
                content: validationMessage || "Could not validate your API key or model.",
                ephemeral: true
            });
        }

        const disabledTools = cmd.fields.fields.has("disabled_tools") && cmd.fields.getStringSelectValues("disabled_tools");
        const llmModel = cmd.fields.fields.has("model") && cmd.fields.getTextInputValue("model") || undefined;
        const subsequentToolLimit = cmd.fields.fields.has("subsequent_tool_limit") && cmd.fields.getTextInputValue("subsequent_tool_limit");

        const updates = {
            ownerId: cmd.user.id,
            toolBlacklist: disabledTools.length > 0 ? disabledTools : []
        };

        if (!apiKeyWasCensored && apiKeyInput) updates.key = apiKeyInput;
        if (!existingConfig && apiKeyToUse) updates.key = apiKeyToUse;
        if (llmModel) updates.llm_model = llmModel;
        if (subsequentToolLimit) updates.subsequentToolLimit = Number(subsequentToolLimit);

        if (isPersonalModal) {
            await PersonalAIs.updateOne(
                { id: cmd.user.id },
                { $set: updates },
                { upsert: true, new: true }
            );

            return await cmd.reply({
                content: "Settings saved!",
                ephemeral: true
            });
        }
        else {
            const ratelimit = cmd.fields.fields.has("ratelimit") && cmd.fields.getTextInputValue("ratelimit");
            const ratelimitCycleLength = cmd.fields.fields.has("ratelimitCycleLength") && cmd.fields.getTextInputValue("ratelimitCycleLength");

            const errors = [];
            if (ratelimitCycleLength && !ms(ratelimitCycleLength)) {
                errors.push("The ratelimit cycle length is not a valid duration, it will be ignored.");
            }

            if (ratelimit) updates.ratelimit = Number(ratelimit);
            if (ratelimitCycleLength && ms(ratelimitCycleLength)) updates.ratelimitCycleLength = ms(ratelimitCycleLength);

            if (differentOwner) {
                const key = `${cmd.user.id}:${cmd.guild.id}`;
                pendingServerOverrides.set(key, {
                    guildId: cmd.guild.id,
                    userId: cmd.user.id,
                    updates,
                    errors
                });

                return await cmd.reply({
                    content: `A server AI key is already set by <@${existingConfig.ownerId}>. Override it with your key?`,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`server_ai_override_confirm:${cmd.user.id}:${cmd.guild.id}`)
                                    .setLabel("Override Server Key")
                                    .setStyle(ButtonStyle.Danger),
                                new ButtonBuilder()
                                    .setCustomId(`server_ai_override_cancel:${cmd.user.id}:${cmd.guild.id}`)
                                    .setLabel("Cancel")
                                    .setStyle(ButtonStyle.Secondary)
                            )
                    ],
                    ephemeral: true
                });
            }

            await PersonalAIs.updateOne(
                { id: cmd.guild.id, ownerId: cmd.user.id },
                { $set: updates },
                { upsert: true, new: true }
            );

            await cmd.reply({
                content:
                    "Settings saved.\n" +
                    (errors.length > 0 ? "\n" + errors.map(e => `- ${e}`).join("\n") : ""),
                ephemeral: true
            });
        }
    }
};
