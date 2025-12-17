// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, GuildUsers, guildByObj, guildUserByObj } = require("./modules/database.js");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, GuildMember } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const { getEmojiFromMessage } = require("./emojiboard");
const { isDirty } = require("./filter");
const { getLvl } = require("./rank.js");

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("leaderboard")
            .setDescription("View a leaderboard for a guild or a rank card for a user.")
            .addStringOption(option =>
                option.setName("which").setDescription("Which leaderboard do you want to see?")
                    .setChoices(
                        { name: "Counting", value: "counting" },
                        { name: "Emojiboard", value: "emojiboard" },
                        { name: "Cleanliness", value: "cleanliness" },
                        { name: "Profanity", value: "profanity" },
                        { name: "Level-Ups", value: "levels" }
                    )
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName("who").setDescription("If applicable, who's spot on the leaderboard do you wish to highlight?")
            )
            .addStringOption(option =>
                option.setName("emoji").setDescription("If emojiboard, which emoji do you want a leaderboard for?")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),

        // Optional fields

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.Information, Categories.Entertainment],
            shortDesc: "View a leaderboard", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`View one of the leaderboards. See what server has globally counted the highest, how many people in this server have been on the emojiboard the most times, who has broken the filter rules the least, who has broken them the most (if you're an admin), or who's gotten the highest amount of server XP`
        }

    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        let guild;
        let requestedUser;
        let emoji = cmd.options.getString("emoji");

        // Only some leaderboards are able to be used in servers
        if (cmd.guild?.id === undefined && cmd.options.getString("which") !== "counting") {
            cmd.followUp(`This leaderboard can only be used in servers that have it enabled. Try in a server that uses it!`);
            return;
        }
        else {
            // Only create guild if we need it
            guild = await guildByObj(cmd.guild);
        }

        switch (cmd.options.getString("which")) {
            case "levels":
                if (!guild.levels.active) {
                    // @ts-ignore
                    cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config.mention}.`);
                    return;
                }
                if (cmd.options.getUser("who")?.id) {
                    let usr = cmd.options.getUser("who")?.id || cmd.user.id;


                    // TODO: optimize into a single aggregation query
                    requestedUser = await guildUserByObj(cmd.guild, usr);
                    const requestedUserRank = await GuildUsers.countDocuments({
                        guildId: cmd.guild.id,
                        $or: [
                            { exp: { $gt: requestedUser.exp } }
                        ]
                    }) + 1;


                    if (!requestedUser) {
                        // Since mongo, this shouldn't be hit, the user should always be returned at least as a virtual default.
                        cmd.followUp(`I am unaware of this user presently`);
                        return;
                    }

                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Rank for ${cmd.guild.name}`)
                        .setColor(0x006400)
                        .setThumbnail(cmd.guild.iconURL())
                        .setAuthor({
                            name: client.users.cache.get(usr)
                                ? client.users.cache.get(usr).username
                                : "Unknown",
                            iconURL: client.users.cache.get(usr)?.displayAvatarURL()
                        })
                        .addFields(
                            { name: "Level", value: `${requestedUser.lvl}`, inline: true },
                            { name: "EXP", value: `${requestedUser.exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","), inline: true },
                            { name: "Server Rank", value: `#${requestedUserRank}`, inline: true }
                        )
                        .setFooter({
                            text: `Next rank up at ${(getLvl(requestedUser.lvl) + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                        });

                    cmd.followUp({
                        content: `Server rank card for <@${usr}>`,
                        embeds: [levelEmbed],
                        allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Leaderboard leaderboard
                const mostLevelsUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id
                })
                    .select("userId lvl exp")
                    .sort([["lvl", -1], ["exp", -1]]) // Sort by level, then the users within those level
                    .limit(10)
                    .lean();


                const levelsEmbed = new EmbedBuilder()
                    .setTitle(`${cmd.guild.name} Leaderboard`)
                    .setDescription(
                        mostLevelsUsers.map((user, rank) =>
                            `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][rank]}. <@${user.userId}>, level ${user.lvl}`
                        ).join("")
                    )
                    .setColor(0x006400)
                    .setThumbnail(cmd.guild.iconURL())
                    .setFooter({ text: `${cmd.guild.name} Levels Leaderboard` });

                cmd.followUp({
                    content: `**Levels Leaderboard**`,
                    embeds: [levelsEmbed]
                });
                break;
            case "emojiboard":
                if (guild?.emojiboards.size < 1) {
                    // @ts-ignore
                    cmd.followUp(`This server doesn't use any emojiboards at the moment. It can be configured using ${cmds.emojiboard.add.mention}.`);
                    break;
                }

                var leaderboard = "";
                var emote = emoji ? getEmojiFromMessage(emoji) : ""; // Emoji formatted for the leaderboards

                if (emote && !guild.emojiboards.has(emote)) {
                    cmd.followUp(`This server doesn't have that emojiboard setup.`);
                    break;
                }

                // @ts-ignore
                const topPosters = await Guilds.aggregate([
                    { $match: { id: cmd.guild.id } },
                    { $project: {
                        id: 1,
                        emojiboards: { $objectToArray: "$emojiboards" }
                    } },
                    { $unwind: {
                        path: "$emojiboards"
                    } },
                    { $project: {
                        id: 1,
                        emoji: "$emojiboards.k",
                        posters: {
                            $objectToArray: "$emojiboards.v.posters"
                        }
                    } },
                    // Only match the requested emoji, and only if it exists
                    (
                        emote ?
                            { $match: { emoji: emote } }
                            : undefined
                    ),
                    // Finally we can split out the user per emoji with how many they have
                    { $unwind: { path: "$posters" } },
                    // Group across emojiboards together by the user
                    { $group: {
                        _id: "$posters.k",
                        total: { $sum: "$posters.v" }
                    } },
                    { $sort: { total: -1 } },
                    { $limit: 10 },
                    // Only ones with posts
                    { $match: {
                        total: { $gt: 0 }
                    } }
                ].filter(s => s != undefined));

                leaderboard = topPosters
                    .map((user, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${user._id}> ${user.total} emojiboards`)
                    .join("");


                const emojiName = emote && emote.includes(":") ? emote.split(":")[1] : (emoji ?? "Emoji");
                const emoteEmbed = new EmbedBuilder()
                    .setTitle(`${cmd.guild.name} ${emote ? emote : emoji ?? "Emoji"}board Leaderboard`)
                    .setDescription(leaderboard)
                    .setColor(0xffff00)
                    .setThumbnail(cmd.guild.iconURL())
                    .setFooter({ text: `${emojiName}board Leaderboards` });

                cmd.followUp({
                    content: `**Emojiboard Leaderboard**`,
                    embeds: [emoteEmbed]
                });
                break;
            case "counting":
                const topCountingGuilds = await Guilds.find({
                    // Find eligible, public servers
                    "counting": { $exists: true },
                    "counting.highestNum": { $gt: 0 },
                    "counting.public": true,
                    "counting.legit": true
                })
                    .select("id counting")
                    .sort([["counting.highestNum", -1]])
                    .limit(10)
                    .lean();

                // Process into easier to read format
                let leaders = []; // [name, highestNum, id]
                for (const guild of topCountingGuilds) {
                    const discordGuild = await client.guilds.fetch(guild.id).catch(() => null);
                    const guildName = discordGuild?.name
                        ? await isDirty(discordGuild.name, cmd.guild?.id, true)
                            ? "[Blocked name]"
                            : discordGuild.name
                        : "Unknown Guild";

                    leaders.push([
                        guildName,
                        guild.counting.highestNum,
                        guild.id
                    ]);
                }

                let footerRank = "";
                if (cmd.guild && guild?.counting?.active) {
                    const place = leaders.map(a => a[2]).indexOf(cmd.guildId);
                    let placeEnd = ["st", "nd", "rd"][place] || "th";

                    footerRank =
                        `${cmd.guild.name} is in ${place + 1}${placeEnd} place with a high score of ${guild.counting.highestNum}.`;
                }

                const countingEmbed = new EmbedBuilder()
                    .setTitle(`Counting Leaderboard`)
                    .setDescription(
                        leaders.map((guild, rank) =>
                            `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][rank]}. ${guild[0]}: \`${guild[1]}\``
                        ).join("")
                    )
                    .setColor(0x006400)
                    .setThumbnail("https://stewbot.kestron.software/roboabacus.jpg")
                    .setFooter({ text: footerRank });

                cmd.followUp({
                    content: `**Counting Leaderboard**`,
                    embeds: [countingEmbed]
                });
                break;
            case "profanity":
                if (!guild.filter.active) {
                    // @ts-ignore
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }

                if (!(cmd.member instanceof GuildMember) || !cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    cmd.followUp(`I'm sorry, to prevent being filtered being used as a game this leaderboard is only available to moderators.`);
                    return;
                }

                // Rank card for a specific user
                if (cmd.options.getUser("who")?.id) {
                    let usr = cmd.options.getUser("who")?.id || cmd.user.id;

                    requestedUser = await guildUserByObj(cmd.guild, usr);
                    const requestedUserInfractions = requestedUser.infractions || 0;
                    const requestedUserRank = await GuildUsers.countDocuments({
                        guildId: cmd.guild.id,
                        infractions: { $gt: requestedUserInfractions }
                    }) + 1;

                    const discordUser = await client.users.fetch(usr).catch(() => null);

                    const profanityEmbed = new EmbedBuilder()
                        .setTitle(`Profanity rank for ${cmd.guild.name}`)
                        .setColor(0x006400)
                        .setThumbnail(cmd.guild.iconURL())
                        .setAuthor({
                            name: discordUser ? discordUser.username : "Unknown",
                            iconURL: discordUser?.displayAvatarURL()
                        })
                        .addFields(
                            { name: `Times Filtered`, value: `${requestedUserInfractions || 0}`, inline: true },
                            { name: `Profanity Rank`, value: `#${requestedUserRank}`, inline: true }
                        )
                        .setFooter({ text: `Profanity Leaderboard` });

                    cmd.followUp({
                        content: `Server profanity card for <@${usr}>`,
                        embeds: [profanityEmbed],
                        allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Compile leaderboard for whole server

                const mostProfaneUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id
                })
                    .select("userId infractions")
                    .sort([["infractions", -1]])
                    .limit(10)
                    .lean();

                const profanityBoard = new EmbedBuilder()
                    .setTitle(`${cmd.guild.name} Profanity Leaderboard`)
                    .setDescription(
                        mostProfaneUsers.map((userObj, i) =>
                            `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${userObj.userId}>, ${userObj.infractions || 0} times filtered`
                        ).join("")
                    )
                    .setColor(0x006400)
                    .setThumbnail(cmd.guild.iconURL())
                    .setFooter({ text: `${cmd.guild.name} Profanity Leaderboard` });

                cmd.followUp({
                    content: `**Profanity Leaderboard**`,
                    embeds: [profanityBoard]
                });
                break;
            case "cleanliness":
                if (!guild.filter.active) {
                    // @ts-ignore
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }

                // User-specific cleanliness leaderboard
                if (cmd.options.getUser("who")?.id) {
                    let usr = cmd.options.getUser("who")?.id || cmd.user.id;

                    requestedUser = await guildUserByObj(cmd.guild, usr);
                    const requestedUserInfractions = requestedUser.infractions || 0;
                    const requestedUserExp = requestedUser.exp || 0;
                    const requestedUserRank = await GuildUsers.countDocuments({
                        guildId: cmd.guild.id,
                        $expr: {
                            $or: [
                                // Get all users with less infractions in our DB.
                                // TODO: unstored users kinda aren't counted, so assume everyone not in our DB is 0
                                { $lt: [
                                    { $ifNull: ["$infractions", 0] }, // Treat missing infractions as 0
                                    requestedUserInfractions
                                ] },

                                // Users with the same amount of infractions but more time spent in the server are cleaner
                                { $and: [
                                    { $eq: [
                                        { $ifNull: ["$infractions", 0] },
                                        requestedUserInfractions
                                    ] },
                                    { $gt: [
                                        { $ifNull: ["$exp", 0] },
                                        requestedUserExp
                                    ] }
                                ] }
                            ]
                        }
                    }) + 1;

                    const discordUser = await client.users.fetch(usr).catch(() => null);

                    const cleanEmbed = new EmbedBuilder()
                        .setTitle(`Cleanliness rank for ${cmd.guild.name}`)
                        .setColor(0x006400)
                        .setThumbnail(cmd.guild.iconURL())
                        .setAuthor({
                            name: discordUser ? discordUser.username : "Unknown",
                            iconURL: discordUser?.displayAvatarURL()
                        })
                        .addFields(
                            { name: `Times Filtered`, value: `${requestedUser.infractions || 0}`, inline: true },
                            { name: `Cleanliness Rank`, value: `#${requestedUserRank}`, inline: true }
                        )
                        .setFooter({ text: `Cleanliness Leaderboard` });

                    cmd.followUp({
                        content: `Server cleanliness card for <@${usr}>`,
                        embeds: [cleanEmbed],
                        allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Server cleanliness leaderboard
                const mostCleanUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id
                })
                    .select("userId infractions exp")
                    .sort([["infractions", 1], ["exp", -1]]) // fewest infractions, then higher exp
                    .limit(10)
                    .lean();


                const cleanBoard = new EmbedBuilder()
                    .setTitle(`${cmd.guild.name} Cleanliness Leaderboard`)
                    .setDescription(
                        mostCleanUsers.map((user, i) =>
                            `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${user.userId}>, ${user.infractions || 0} times filtered`
                        ).join("")
                    )
                    .setColor(0x006400)
                    .setThumbnail(cmd.guild.iconURL())
                    .setFooter({ text: `${cmd.guild.name} Cleanliness Leaderboard` });

                cmd.followUp({
                    content: `**Cleanliness Leaderboard**`,
                    embeds: [cleanBoard]
                });
                break;
        }

    }
};
