// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, GuildUsers, guildByID, userByID, guildByObj, userByObj, guildUserByObj } = require("./modules/database.js")
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
// #endregion CommandBoilerplate

const { getLvl } = require("./rank.js")

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("leaderboard").setDescription("View a leaderboard for a guild or a rank card for a user.")
            .addStringOption(option =>
                option.setName("which").setDescription("Which leaderboard do you want to see?").setChoices(
                    { name: "Counting", value: "counting" },
                    { name: "Emojiboard", value: "emojiboard" },
                    { name: "Cleanliness", value: "cleanliness" },
                    { name: "Profanity", value: "profanity" },
                    { name: "Level-Ups", value: "levels" }
                ).setRequired(true)
            ).addUserOption(option =>
                option.setName("who").setDescription("If applicable, who's spot on the leaderboard do you wish to highlight?")
            ).addStringOption(option =>
                option.setName("emoji").setDescription("If emojiboard, which emoji do you want a leaderboard for?")
            ).addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ),

        // Optional fields

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: ["getEmojiFromMessage"],

        help: {
            helpCategories: [Categories.Information, Categories.Entertainment],
			shortDesc: "View a leaderboard",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`View one of the leaderboards. See what server has globally counted the highest, how many people in this server have been on the emojiboard the most times, who has broken the filter rules the least, who has broken them the most (if you're an admin), or who's gotten the highest amount of server XP`
        },

    },

    /** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const guild = await guildByObj(cmd.guild);

        let requestedUser;
        let emoji = cmd.options.getString("emoji")

        // Only some leaderboards are able to be used in servers
        if (cmd.guild?.id === undefined && cmd.options.getString("which") !== "counting") {
            cmd.followUp(`I can't find leaderboard content for that board at the moment. Try in a server that uses it!`);
            return;
        }

        switch (cmd.options.getString("which")) {
            case "levels":
                if (!guild.levels.active) {
                    cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config.mention}.`);
                    return;
                }
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;


                    // TODO: optimize into a single aggregation query
                    requestedUser = await guildUserByObj(cmd.guild, usr);
                    const requestedUserRank = await GuildUsers.countDocuments({
                        guildId: cmd.guild.id,
                        $or: [
                            { exp: { $gt: requestedUser.exp } },
                        ]
                    }) + 1;


                    if (!requestedUser) {
                        // Since mongo, this shouldn't be hit, the user should always be returned at least as a virtual default.
                        cmd.followUp(`I am unaware of this user presently`);
                        return;
                    }
                    
                    // Single user rank
                    cmd.followUp({
                        content: `Server rank card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Level`,
                                    "value": requestedUser.lvl + "",
                                    "inline": true
                                },
                                {
                                    "name": `EXP`,
                                    "value": `${requestedUser.exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                                    "inline": true
                                },
                                {
                                    "name": `Server Rank`,
                                    "value": `#${requestedUserRank}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr) 
                                    ? client.users.cache.get(usr).username 
                                    : "Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Next rank up at ${
                                    (getLvl(requestedUser.lvl) + "")
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Leaderboard leaderboard
                const mostLevelsUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id,
                })
                    .select("userId lvl exp")
                    .sort([['lvl', -1], ['exp', -1]]) // Sort by level, then the users within those level
                    .limit(10)
                    .lean();


                cmd.followUp({
                    content: `**Levels Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Leaderboard`,
                        "description": mostLevelsUsers.map((user, rank) => 
                                `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][rank]}. <@${user.userId}>, level ${user.lvl}`
                            ).join(""),
                        "color": 0x006400,
                        "thumbnail": {
                            "url": cmd.guild.iconURL(),
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${cmd.guild.name} Levels Leaderboard`
                        }
                    }]
                });
                break;
            case "emojiboard":
                if (guild.emojiboards.size < 1) {
                    cmd.followUp(`This server doesn't use any emojiboards at the moment. It can be configured using ${cmds.add_emojiboard.mention}.`);
                    break;
                }

                var searchId = cmd.options.getUser("who")?.id || cmd.user.id; // TODO: unused rn
                var leaderboard = "";
                var emote = emoji ? getEmojiFromMessage(emoji) : ""; // Emoji formatted for the leaderboards

                if (emote && !guild.emojiboards.has(emote)) {
                    cmd.followUp(`This server doesn't have that emojiboard setup.`);
                    break;
                }

                const topPosters = await Guilds.aggregate([
                    {
                        $match: {
                            id: cmd.guild.id
                        }
                    },
                    {
                        $project: {
                            id: 1,
                            emojiboards: {
                                $objectToArray: "$emojiboards"
                            }
                        }
                    },
                    {
                        $unwind: {
                            path: "$emojiboards"
                        }
                    },
                    {
                        $project: {
                            id: 1,
                            emoji: "$emojiboards.k",
                            posters: {
                                $objectToArray: "$emojiboards.v.posters"
                            }
                        }
                    },
                    // Only match the requested emoji, and only if it exists
                    (emote ? { $match: { emoji: emote } } : undefined),
                    {
                        $unwind:
                        // Finally we can split out the user per emoji with how many they have
                        {
                            path: "$posters"
                        }
                    },
                    {
                        $group:
                        // Group across emojiboards together by the user
                        {
                            _id: "$posters.k",
                            total: {
                                $sum: "$posters.v"
                            }
                        }
                    },
                    {
                        $sort: {
                            total: -1
                        }
                    },
                    {
                        $limit: 10
                    },
                    {
                        $match:
                        // Only ones with posts
                        {
                            total: {
                                $gt: 0
                            }
                        }
                    }
                ].filter(s=>s!=undefined))

                leaderboard = topPosters
                    .map((user, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${user._id}> ${user.total} emojiboards`)
                    .join("");
                
                
                cmd.followUp({
                    content: `**Emojiboard Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} ${emote.includes(":") ? emote : emoji !== null ? emoji : "Emoji"}board Leaderboard`,
                        "description": leaderboard,
                        "color": 0xffff00,
                        "thumbnail": {
                            "url": cmd.guild.iconURL(),
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${emote.includes(":") ? emote.split(":")[1] : emoji !== null ? emoji : "Emoji"}board Leaderboards`
                        }
                    }]
                });
                break;
            case "counting":
                const topCountingGuilds = await Guilds.find({
                    // Find eligible, public servers
                    "counting": { $exists: true },
                    "counting.highestNum": { $gt: 0 },
                    "counting.public": true,
                    "counting.legit": true,
                })
                    .select("id counting")
                    .sort([['counting.highestNum', -1]])
                    .limit(10)
                    .lean();

                // Process into easier to read format
                let leaders = []; // [name, highestNum, id]
                for (const guild of topCountingGuilds) {
                    const discordGuild = await client.guilds.fetch(guild.id).catch(e=>null);
                    const guildName = discordGuild?.name
                        ? await checkDirty(cmd.guild?.id, discordGuild.name) 
                            ? "[Blocked name]" 
                            : discordGuild.name
                        : "Unknown Guild"

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
                        `${cmd.guild.name} is in ${place+1}${placeEnd} place with a high score of ${guild.counting.highestNum}.`
                }

                
                cmd.followUp({
                    "content": `**Counting Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `Counting Leaderboard`,
                        "description": `${
                            leaders.map((guild, rank) => 
                                `\n${
                                    ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][rank]
                                }. ${guild[0]}: \`${guild[1]}\``
                            ).join("")
                        }`,
                        "color": 0x006400,
                        "thumbnail": {
                            "url": "https://stewbot.kestron.software/roboabacus.jpg",
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": footerRank
                        }
                    }]
                });
                break;
            case "profanity":
                if (!guild.filter.active) {
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }
                if(!cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages)){
                    cmd.followUp(`I'm sorry, to prevent being filtered being used as a game this leaderboard is only available to moderators.`);
                    return;
                }

                // Rank card for a specific user
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;

                    requestedUser = await guildUserByObj(cmd.guild, usr);
                    const requestedUserInfractions = requestedUser.infractions || 0;
                    const requestedUserRank = await GuildUsers.countDocuments({
                        guildId: cmd.guild.id,
                        infractions: { $gt: requestedUserInfractions },
                    }) + 1;

                    const discordUser = await client.users.fetch(usr).catch(e=>null);

                    cmd.followUp({
                        content: `Server profanity card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Profanity rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Times Filtered`,
                                    "value": requestedUserInfractions || 0,
                                    "inline": true
                                },
                                {
                                    "name": `Profanity Rank`,
                                    "value": `#${requestedUserRank}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": discordUser ? discordUser.username : "Unknown",
                                "icon_url": discordUser?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Profanity Leaderboard`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Compile leaderboard for whole server

                const mostProfaneUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id,
                })
                    .select("userId infractions")
                    .sort([['infractions', -1]])
                    .limit(10)
                    .lean();

                cmd.followUp({
                    content: `**Profanity Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Profanity Leaderboard`,
                        "description": 
                            mostProfaneUsers.map((userObj, i) => 
                                `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${userObj.userId}>, ${userObj.infractions || 0} times filtered`
                            )
                            .join(""),
                        "color": 0x006400,
                        "thumbnail": {
                            "url": cmd.guild.iconURL(),
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${cmd.guild.name} Profanity Leaderboard`
                        }
                    }]
                });
            break;
            case "cleanliness":
                if (!guild.filter.active) {
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }

                // User-specific cleanliness leaderboard
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;

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
                                ]},

                                // Users with the same amount of infractions but more time spent in the server are cleaner
                                { $and: [
                                    { $eq: [
                                            { $ifNull: ["$infractions", 0] },
                                            requestedUserInfractions
                                    ]},
                                    { $gt: [
                                        { $ifNull: ["$exp", 0] },
                                        requestedUserExp
                                    ]}
                                ]}
                            ]
                        }
                    }) + 1;

                    const discordUser = await client.users.fetch(usr).catch(e=>null);

                    cmd.followUp({
                        content: `Server cleanliness card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Cleanliness rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Times Filtered`,
                                    "value": requestedUser.infractions || 0,
                                    "inline": true
                                },
                                {
                                    "name": `Cleanliness Rank`,
                                    "value": `#${requestedUserRank}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": discordUser ? discordUser.username : "Unknown",
                                "icon_url": discordUser?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Cleanliness Leaderboard`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }

                // Server cleanliness leaderboard
                const mostCleanUsers = await GuildUsers.find({
                    "guildId": cmd.guild.id,
                })
                    .select("userId infractions exp")
                    .sort([['infractions', 1], ['exp', -1]]) // fewest infractions, then higher exp
                    .limit(10)
                    .lean();
                

                cmd.followUp({
                    content: `**Cleanliness Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Cleanliness Leaderboard`,
                        "description": mostCleanUsers.map((user, i) => 
                                `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${user.userId}>, ${user.infractions || 0} times filtered`
                            ).join(""),
                        "color": 0x006400,
                        "thumbnail": {
                            "url": cmd.guild.iconURL(),
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${cmd.guild.name} Cleanliness Leaderboard`
                        }
                    }]
                });
            break;
        }

    }
};
