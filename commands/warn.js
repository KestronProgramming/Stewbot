// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, guildUserByObj } = require("./modules/database.js")
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("warn").setDescription("Warn a user for bad behaviour")
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

        requiredGlobals: [],

        help: {
        	helpCategories: [Categories.General, Categories.Administration, Categories.Server_Only],
			shortDesc: "Warn a user for bad behaviour",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Moderators can use this command to send a user a warning for doing something wrong anonymously in the server's name, with a severity scale from 1 to 10. You can then use ${cmds.warnings.mention} to check a list of all warnings dealt.`
        },
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const who = cmd.options.getUser("who");
        const what = (await checkDirty(config.homeServer,cmd.options.getString("what"),true))[1];
        const severity = cmd.options.getInteger("severity");

        if (who.bot) {
            cmd.followUp(`Bots cannot be warned. Consider reconfiguring or removing a bot if it's giving you issues.`);
            return;
        }

        // TODO_DB: minimize into one query instead of two
        const guildUser = await guildUserByObj(cmd.guild, who.id);
        guildUser.warnings.push({
            "moderator": cmd.user.id,
            "reason": what === null ? `None given` : what,
            "severity": severity === null ? 0 : severity,
            "when": Math.round(Date.now() / 1000)
        });
        await guildUser.save();

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
        cmd.followUp({ content: `Alright, I have warned <@${who.id}>${what === null ? `` : ` with the reason \`${what}\``}${severity === null ? `` : ` at a level \`${severity}\``}. This is warning #\`${guildUser.warnings.length}\` for them.`, allowedMentions: { parse: [] } });
    }
};
