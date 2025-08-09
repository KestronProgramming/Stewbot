// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, EmbedType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const { limitLength } = require("../utils.js")
const config = require("../data/config.json");
const { checkDirty } = require("./filter");

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("admin_message").setDescription("Anonymously make a post in the server's name")
            .addStringOption(option =>
                option.setName("what").setDescription("What to say").setMaxLength(2000).setRequired(true)
            ).addUserOption(option =>
                option.setName("target").setDescription("The user to message")
            ).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        deferEphemeral: true,

        help: {
            helpCategories: [Categories.Administration, Categories.Server_Only],
            shortDesc: "Post anonymously in the server's name",
            detailedDesc:
                `Moderators can use this command to make a post in the server's name. If you specify a user, Stewbot will DM the selected user with the message of choice. If no user is selected, the bot will use webhooks to post your message in the server's name in the same channel this command is used in.`
        },
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        if (
            !cmd.channel ||
            !cmd.guild ||
            !("permissionsFor" in cmd.channel) ||
            !("fetchWebhooks" in cmd.channel)
        ) {
            return cmd.followUp("This command must be run in a guild text channel.");
        }

        const target = cmd.options.getUser("target");
        const message = cmd.options.getString("what", true);

        // If we're supposed to DM a user something:
        if (target?.id) {
            let worked = true;
            try {
                await target.send({
                    embeds: [{
                        type: EmbedType.Rich,
                        title: (await checkDirty(config.homeServer, limitLength(cmd.guild.name, 80), true))[1],
                        description: (await checkDirty(config.homeServer, message.replaceAll("\\n", "\n"), true))[1],
                        color: 0x006400,
                        thumbnail: {
                            url: String(cmd.guild.iconURL() || ""),
                            height: 0,
                            width: 0,
                        },
                        footer: {
                            text: `This message was sent by a moderator of ${cmd.guild.name}`
                        }
                    }]
                })
            } catch (e) {
                worked = false;
            }
            await cmd.followUp(
                worked ?
                    "Messaged them" :
                    "I couldn't message them, most likely they blocked me."
            );
        }

        // If we're supposed to post something:
        else if (cmd.channel.permissionsFor(client.user.id)?.has(PermissionFlagsBits.ManageWebhooks)) {
            let resp = {
                "content": (await checkDirty(config.homeServer, message.replaceAll("\\n", "\n"), true))[1],
                "avatarURL": cmd.guild.iconURL() || undefined,
                "username": (await checkDirty(config.homeServer, cmd.guild.name.slice(0, 80), true))[1]
            };
            // Discord server name edge case
            if (resp?.username?.toLowerCase().includes("discord")) {
                resp.username = "[SERVER]"
            }
            let webhook = await cmd.channel.fetchWebhooks();
            let hook = webhook.find(h => h.token);
            if (hook) {
                hook.send(resp);
            }
            else {
                cmd.channel.createWebhook({
                    name: config.name,
                    avatar: config.pfp
                }).then(d => {
                    d.send(resp);
                });
            }
            cmd.followUp({ content: "Posted", ephemeral: true });
        }
        else {
            cmd.followUp(`I don't have the MANAGE_WEBHOOKS permission, so I can't post an admin message in this server.`);
        }

    }
};
