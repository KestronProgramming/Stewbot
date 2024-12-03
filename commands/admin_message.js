// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
// #endregion Boilerplate

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

        requiredGlobals: ["config"],

        help: { 
            "helpCategory": "Administration", 
            "helpDesc": "Send a message anonymously in the server's name" 
        },
    },

    async execute(cmd, context) {
        applyContext(context);

        if (cmd.options.getUser("target")?.id) {
            try {
                cmd.options.getUser("target").send({
                    embeds: [{
                        type: "rich",
                        title: checkDirty(config.homeServer,cmd.guild.name.slice(0, 80),true)[1],
                        description: checkDirty(config.homeServer,cmd.options.getString("what").replaceAll("\\n", "\n"),true)[1],
                        color: 0x006400,
                        thumbnail: {
                            url: cmd.guild.iconURL(),
                            height: 0,
                            width: 0,
                        },
                        footer: {
                            text: `This message was sent by a moderator of ${cmd.guild.name}`
                        }
                    }]
                }).catch(e => { });
                cmd.followUp("Messaged them");
            } catch (e) { }
        }
        else if (cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)) {
            var resp = {
                "content": checkDirty(config.homeServer,cmd.options.getString("what").replaceAll("\\n", "\n"),true)[1],
                "avatarURL": cmd.guild.iconURL(),
                "username": checkDirty(config.homeServer,cmd.guild.name.slice(0, 80),true)[1]
            };
            // Discord server name edge case
            if (resp?.username?.toLowerCase().includes("discord")) {
                resp.username = "[SERVER]"
            }
            var hook = await cmd.channel.fetchWebhooks();
            hook = hook.find(h => h.token);
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
