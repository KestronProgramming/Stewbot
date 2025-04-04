// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
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
        command: new SlashCommandBuilder().setName("leaderboard").setDescription("View a leaderboard")
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

        if (cmd.guild?.id === undefined && cmd.options.getString("which") !== "counting") {
            cmd.followUp(`I can't find leaderboard content for that board at the moment. Try in a server that uses it!`);
            return;
        }
        switch (cmd.options.getString("which")) {
            case "levels":
                if (!storage[cmd.guildId].levels.active) {
                    cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config.mention}.`);
                    return;
                }
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;
                    if (!storage[cmd.guildId].users.hasOwnProperty(usr)) {
                        cmd.followUp(`I am unaware of this user presently`);
                        return;
                    }
                    cmd.followUp({
                        content: `Server rank card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Level`,
                                    "value": storage[cmd.guildId].users[usr].lvl + "",
                                    "inline": true
                                },
                                {
                                    "name": `EXP`,
                                    "value": `${storage[cmd.guildId].users[usr].exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                                    "inline": true
                                },
                                {
                                    "name": `Server Rank`,
                                    "value": `#${Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.exp - a.exp).map(a => a.id).indexOf(usr) + 1}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr) ? client.users.cache.get(usr).username : "Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Next rank up at ${(getLvl(storage[cmd.guildId].users[usr].lvl) + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }
                cmd.followUp({
                    content: `**Levels Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.exp - a.exp).slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${a.id}>, level ${a.lvl}`).join(""),
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
                if (Object.keys(storage[cmd.guildId]?.emojiboards).length < 1) {
                    cmd.followUp(`This server doesn't use any emojiboards at the moment. It can be configured using ${cmds.add_emojiboard.mention}.`);
                    break;
                }
                var searchId = cmd.options.getUser("who")?.id || cmd.user.id;
                if (searchId !== cmd.user.id) {
                    if (!storage[cmd.guildId].users.hasOwnProperty(searchId)) {
                        cmd.followUp(`I am unaware of this user presently`);
                        break;
                    }
                }
                var leaderboard = "";
                var emote = "Emoji";
                if (cmd.options.getString("emoji") === null) {
                    leaderboard = Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.stars - a.stars).slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${a.id}> ${a.stars} emojiboards`).join("");
                }
                else {
                    if (storage[cmd.guildId].emojiboards.hasOwnProperty(getEmojiFromMessage(cmd.options.getString("emoji")))) {
                        emote = getEmojiFromMessage(cmd.options.getString("emoji"));
                        leaderboard = Object.keys(storage[cmd.guildId].emojiboards[emote].posters).map(a => Object.assign(storage[cmd.guildId].emojiboards[emote].posters[a], { "id": a })).sort((a, b) => b - a).slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${a.id}> ${a} ${emote.includes(":") ? emote : cmd.options.getString("emoji") !== null ? cmd.options.getString("emoji") : "Emoji"}boards`).join("");
                    }
                    else {
                        cmd.followUp(`This server doesn't have that emojiboard setup.`);
                        break;
                    }
                }
                cmd.followUp({
                    content: `**Emojiboard Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} ${emote.includes(":") ? emote : cmd.options.getString("emoji") !== null ? cmd.options.getString("emoji") : "Emoji"}board Leaderboard`,
                        "description": leaderboard,
                        "color": 0xffff00,
                        "thumbnail": {
                            "url": cmd.guild.iconURL(),
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${emote.includes(":") ? emote.split(":")[1] : cmd.options.getString("emoji") !== null ? cmd.options.getString("emoji") : "Emoji"}board Leaderboards`
                        }
                    }]
                });
                break;
            case "counting":
                var leaders = [];
                for (let a in storage) {
                    if (storage[a].counting?.public) {
                        try {
                            leaders.push([await checkDirty(cmd.guild?.id, client.guilds.cache.get(a).name) ? "[Blocked name]" : client.guilds.cache.get(a).name, storage[a].counting.highestNum, a]);
                        }
                        catch (e) { }
                    }
                }
                leaders.sort((a, b) => b[1] - a[1]);
                cmd.followUp({
                    "content": `**Counting Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `Counting Leaderboard`,
                        "description": `${leaders.slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. ${a[0]}: \`${a[1]}\``).join("")}`,
                        "color": 0x006400,
                        "thumbnail": {
                            "url": "https://stewbot.kestron.software/roboabacus.jpg",
                            "height": 0,
                            "width": 0
                        },
                        "footer": {
                            "text": `${cmd.guild && storage[cmd.guild?.id]?.counting?.active ? `${cmd.guild.name} is in ${leaders.map(a => a[2]).indexOf(cmd.guildId) + 1}${leaders.map(a => a[2]).indexOf(cmd.guildId) === 0 ? "st" : leaders.map(a => a[2]).indexOf(cmd.guildId) === 1 ? "nd" : leaders.map(a => a[2]).indexOf(cmd.guildId) === 2 ? "rd" : "th"} place with a high score of ${storage[cmd.guildId].counting.highestNum}.` : ""}`
                        }
                    }]
                });
                break;
            case "profanity":
                if (!storage[cmd.guildId].filter.active) {
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }
                if(!cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages)){
                    cmd.followUp(`I'm sorry, to prevent being filtered being used as a game this leaderboard is only available to moderators.`);
                    return;
                }
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;
                    if (!storage[cmd.guildId].users.hasOwnProperty(usr)) {
                        cmd.followUp(`I am unaware of this user presently`);
                        return;
                    }
                    cmd.followUp({
                        content: `Server profanity card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Profanity rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Times Filtered`,
                                    "value": storage[cmd.guildId].users[usr].infractions + "",
                                    "inline": true
                                },
                                {
                                    "name": `Profanity Rank`,
                                    "value": `#${Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.infractions - a.infractions).map(a => a.id).indexOf(usr) + 1}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr) ? client.users.cache.get(usr).username : "Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Profanity Leaderboard`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }
                cmd.followUp({
                    content: `**Profanity Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Profanity Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.infractions - a.infractions).slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${a.id}>, ${a.infractions} times filtered`).join(""),
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
                if (!storage[cmd.guildId].filter.active) {
                    cmd.followUp(`This server doesn't use the filter at the moment. It can be configured using ${cmds.filter.config.mention}.`);
                    return;
                }
                if (cmd.options.getUser("who")?.id) {
                    var usr = cmd.options.getUser("who")?.id || cmd.user.id;
                    if (!storage[cmd.guildId].users.hasOwnProperty(usr)) {
                        cmd.followUp(`I am unaware of this user presently`);
                        return;
                    }
                    cmd.followUp({
                        content: `Server cleanliness card for <@${usr}>`, embeds: [{
                            "type": "rich",
                            "title": `Cleanliness rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Times Filtered`,
                                    "value": storage[cmd.guildId].users[usr].infractions + "",
                                    "inline": true
                                },
                                {
                                    "name": `Cleanliness Rank`,
                                    "value": `#${Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a,b)=>b.exp-a.exp).sort((a, b) => a.infractions - b.infractions).map(a => a.id).indexOf(usr) + 1}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr) ? client.users.cache.get(usr).username : "Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Cleanliness Leaderboard`
                            }
                        }], allowedMentions: { parse: [] }
                    });
                    break;
                }
                cmd.followUp({
                    content: `**Cleanliness Leaderboard**`, embeds: [{
                        "type": "rich",
                        "title": `${cmd.guild.name} Cleanliness Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a,b)=>b.exp-a.exp).sort((a, b) => a.infractions - b.infractions).slice(0, 10).map((a, i) => `\n${["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][i]}. <@${a.id}>, ${a.infractions} times filtered`).join(""),
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
