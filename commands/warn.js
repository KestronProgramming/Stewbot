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
        command: new SlashCommandBuilder().setName("warn").setDescription("Warn a user for bad behavior")
            .addUserOption(option =>
                option.setName("who").setDescription("Who are you warning?").setRequired(true)
            ).addStringOption(option =>
                option.setName("what").setDescription("What did they do?")
            ).addIntegerOption(option =>
                option.setName("severity").setDescription("On a scale from 1 to 10, how would you rate the severity?").setMinValue(1).setMaxValue(10)
            ).addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: ["defaultGuildUser"],

        // help: {
        // 	helpCategory: "General",
        // 	helpDesc: "View uptime stats",
        // 	// helpSortPriority: 1
        // },
    },

    async execute(cmd, context) {
        applyContext(context);

        const who = cmd.options.getUser("who");
        const what = checkDirty(config.homeServer,cmd.options.getString("what"),true)[1];
        const severity = cmd.options.getInteger("severity");

        if (who.bot) {
            cmd.followUp(`Bots cannot be warned. Consider reconfiguring or removing a bot if it's giving you issues.`);
            return;
        }
        if (!storage[cmd.guild.id].users.hasOwnProperty(who.id)) {
            storage[cmd.guild.id].users[who.id] = structuredClone(defaultGuildUser);
        }
        if (!storage[cmd.guild.id].users[who.id].hasOwnProperty("warnings")) {
            storage[cmd.guild.id].users[who.id].warnings = [];
        }
        storage[cmd.guild.id].users[who.id].warnings.push({
            "moderator": cmd.user.id,
            "reason": what === null ? `None given` : what,
            "severity": severity === null ? 0 : severity,
            "when": Math.round(Date.now() / 1000)
        });
        try {
            who.send({
                embeds: [{
                    type: "rich",
                    title: cmd.guild.name.slice(0, 80),
                    description: `You were given a warning.\nReason: \`${what === null ? `None given` : what}\`\nSeverity level: \`${severity === null ? "None given" : severity}\``,
                    color: 0xff0000,
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
        } catch (e) { }
        cmd.followUp({ content: `Alright, I have warned <@${who.id}>${what === null ? `` : ` with the reason \`${what}\``}${severity === null ? `` : ` at a level \`${severity}\``}. This is warning #\`${storage[cmd.guild.id].users[who.id].warnings.length}\` for them.`, allowedMentions: { parse: [] } });
    }
};
