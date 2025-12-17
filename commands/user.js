// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

function getDiscordJoinTimestamp(userId) {
    const discordEpoch = 1420070400000; // Discord's epoch in milliseconds
    const binarySnowflake = BigInt(userId)
        .toString(2)
        .padStart(64, "0"); // Convert to 64-bit binary
    const timestamp = parseInt(binarySnowflake.slice(0, 42), 2) + discordEpoch;
    return Math.floor(timestamp / 1000);
}

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("user")
            .setDescription("Display a user's profile")
            .addBooleanOption(option =>
                option.setName("large-pfp").setDescription("Display the PFP in large mode?")
            )
            .addUserOption(option =>
                option.setName("who").setDescription("Who do you want to display?")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Information, Categories.Administration, Categories.Entertainment],
            shortDesc: "Display a user's profile", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Choose a user and expand their profile information into the embed. If specified, you can also enlarge the profile picture which makes it easier to save which can be useful for various purposes.`
        }

    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        let member = await cmd.guild.members.fetch(cmd.options.getUser("who") ? cmd.options.getUser("who").id : cmd.user.id);
        if (!member) {
            cmd.followUp(`I can't seem to locate them.`);
            return;
        }

        const joinedServer = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
        const joinFields = joinedServer
            ? `<t:${joinedServer}:f>, <t:${joinedServer}:R>`
            : "Unknown";

        const displayName = member.nickname || member.user.globalName || member.user.username;
        const roleList = member.roles.cache
            .filter(r => r.name !== "@everyone")
            .map(r => `<@&${r.id}>`)
            .join(", ");

        const embed = new EmbedBuilder()
            .setTitle(displayName)
            .setDescription(roleList || "No roles")
            .setColor(0x006400)
            .setTimestamp()
            .setThumbnail(member.displayAvatarURL())
            .setAuthor({
                name: member.user.globalName || member.user.username,
                url: `https://discord.com/users/${member.id}`,
                iconURL: member.user.displayAvatarURL()
            })
            .setFooter({
                text: member.user.username,
                iconURL: member.user.displayAvatarURL()
            })
            .addFields(
                { name: "Joined Server", value: joinFields, inline: true },
                { name: "Joined Discord", value: `<t:${getDiscordJoinTimestamp(member.id)}:f>, <t:${getDiscordJoinTimestamp(member.id)}:R>`, inline: true }
            );

        const large = cmd.options.getBoolean("large-pfp") ?? false;
        if (large) {
            embed.setImage(`${member.displayAvatarURL()}?size=1024`);
        }

        await cmd.followUp({
            content: `User card for <@${member.id}>`,
            embeds: [embed],
            allowedMentions: { parse: [] }
        });

    }
};
