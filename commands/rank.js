// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { GuildUsers, guildByObj, guildUserByObj } = require("./modules/database.js");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

function getLvl(lvl) {
    var total = 0;
    while (lvl > -1) {
        total += 5 * (lvl * lvl) + (50 * lvl) + 100;
        lvl--;
    }
    return total;
}

module.exports = {
    getLvl, // exported functions

    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("rank")
            .setDescription("View someone's rank for this server's level ups")
            .addUserOption(option =>
                option.setName("target").setDescription("Who's rank are you trying to view?")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],
        help: {
            helpCategories: [Categories.Information, Categories.General, Categories.Entertainment, Categories.Server_Only],
            shortDesc: "View someone's rank for this server's level ups", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Check someone's rank for this server's level ups if this server has them configured.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const guild = await guildByObj(cmd.guild);

        if (!guild.levels.active) {
            // @ts-ignore
            cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config.mention}.`);
            return;
        }

        var usrId = cmd.options.getUser("target")?.id || cmd.user.id;
        const targetUser = await guildUserByObj(cmd.guild, usrId);

        // TODO: optimize these three queries into a single one?
        const targetExp = targetUser.exp ?? 0;
        const requestedUserRank = await GuildUsers.countDocuments({
            guildId: cmd.guild.id,
            $or: [
                { exp: { $gt: targetExp } }
            ]
        }) + 1;

        const discordUser = await client.users.fetch(usrId);
        const embed = new EmbedBuilder()
            .setTitle(`Rank for ${cmd.guild.name}`)
            .setColor(0x006400)
            .addFields(
                { name: "Level", value: `${targetUser.lvl || 0}`, inline: true },
                { name: "EXP", value: `${targetExp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","), inline: true },
                { name: "Server Rank", value: `#${requestedUserRank}`, inline: true }
            )
            .setThumbnail(cmd.guild.iconURL() || null)
            .setAuthor({ name: discordUser?.username ?? "Unknown", iconURL: discordUser?.displayAvatarURL() ?? undefined })
            .setFooter({ text: `Next rank up at ${(getLvl(targetUser.lvl) + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` });

        await cmd.followUp({
            content: `Server rank card for <@${usrId}>`,
            embeds: [embed],
            allowedMentions: { parse: [] }
        });
    }
};
