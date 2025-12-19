// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { guildUserByObj } = require("./modules/database.js");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, GuildMemberRoleManager } = require("discord.js");
function applyContext(context = {}) {
    for (const key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const { censor } = require("./filter");

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("warn")
            .setDescription("Warn a user for bad behavior")
            .addUserOption(option =>
                option.setName("who").setDescription("Who are you warning?")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("what").setDescription("What did they do?")
            )
            .addIntegerOption(option =>
                option.setName("severity").setDescription("On a scale from 1 to 10, how would you rate the severity?")
                    .setMinValue(1)
                    .setMaxValue(10)
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Administration, Categories.Server_Only],
            shortDesc: "Warn a user for bad behavior", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Moderators can use this command to send a user a warning for doing something wrong anonymously in the server's name, with a severity scale from 1 to 10. You can then use ${cmds.warnings.mention} to check a list of all warnings dealt.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const who = cmd.options.getUser("who");
        const what = await censor(cmd.options.getString("what"));
        const severity = cmd.options.getInteger("severity");
        const member = await cmd.guild.members.fetch(who.id).catch(() => null);

        if (!member) {
            await cmd.followUp({
                content: "I can't find that user in this server.",
                ephemeral: true
            });
            return;
        }

        if (who.bot) {
            await cmd.followUp({
                content: "Bots cannot be warned. Consider reconfiguring or removing a bot if it's giving you issues.",
                ephemeral: true
            });
            return;
        }

        if (member.id === cmd.client.user.id) {
            await cmd.followUp({
                content: "I can't warn myself.",
                ephemeral: true
            });
            return;
        }

        if (
            cmd.user.id !== member.id && (
                cmd.member &&
                cmd.member.roles instanceof GuildMemberRoleManager &&
                member.roles.highest.comparePositionTo(cmd.member.roles.highest) >= 0 &&
                cmd.user.id !== cmd.guild.ownerId
            )
        ) {
            await cmd.followUp({
                content: "You cannot warn someone with an equal or higher role.",
                ephemeral: true
            });
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
            await who.send({
                embeds: [new EmbedBuilder()
                    .setTitle(cmd.guild.name.slice(0, 80))
                    .setDescription(`You were given a warning.\nReason: \`${what === null ? `None given` : what}\`\nSeverity level: \`${severity === null ? "None given" : severity}\``)
                    .setColor(0xff0000)
                    .setThumbnail(cmd.guild.iconURL())
                    .setFooter({ text: `This message was sent by a moderator of ${cmd.guild.name}` })
                ]
            }).catch(() => { });
        }
        catch { }
        await cmd.followUp({
            content: `Alright, I have warned <@${who.id}>${
                what === null ? `` : ` with the reason \`${what}\``
            }${
                severity === null ? `` : ` at a level \`${severity}\``
            }. This is warning #\`${guildUser.warnings.length}\` for them.`,
            allowedMentions: { parse: [] }
        });
    }
};
