// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, guildByObj } = require("./modules/database.js");
const { Events, PermissionFlagsBits } = require("discord.js");

// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { notify } = require("../utils");

async function sendWelcome(guild) {
    guild = await client.guilds.fetch(guild.id); // fetch the full guild
    for (const [, chan] of guild.channels.cache) {
        const perms = chan?.permissionsFor?.(client.user.id);
        if (chan?.isTextBased?.() && perms?.has(PermissionFlagsBits.ViewChannel) && chan.isSendable()) {
            const messages = await chan?.messages?.fetch({ limit: 3 });
            if (messages) for (const [, msg] of messages) {
                const guildStore = await guildByObj(guild);
                if (
                    !guildStore.sentWelcome && (
                        msg.content?.toLowerCase().includes("stewbot") ||
                        msg.content?.includes(client.user.id) ||
                        msg.author?.id === client.user.id
                    )
                ) {
                    var errorFields = [];
                    var neededPerms = {
                        "AddReactions": "Without this permission, some things like the counting game will not function properly",
                        "ViewAuditLog": "Without this permission, I cannot run deleted message logs if you set it up",
                        "SendMessages": "Without this permission, there may be instances where I cannot respond when requested to",
                        "ManageMessages": "Without this permission, I cannot run the filter, or the move_message options, or persistent messages",
                        "EmbedLinks": "Without this permission, any function where I would be uploading an image will not work",
                        "AttachFiles": "Without this permission, any function where I upload a file (primarily images) does not work",
                        "ManageRoles": "Without this permission, I cannot help you automatically manage roles for sticky roles or auto roles",
                        "ManageWebhooks": "Without this permission, I cannot run level-ups, the censor function of the filter, one of the emojiboard modes, anonymous admin messaging, auto join and leave messages, tickets, or a couple other things."
                    };
                    Object.keys(PermissionFlagsBits).forEach(perm => {
                        if (
                            !guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm]) && perm in neededPerms) {
                            errorFields.push({
                                "name": `${perm}`,
                                "value": neededPerms[perm],
                                "inline": true
                            });
                        }
                    });
                    var embs = [{
                        "author": {
                            "name": `Greetings! I am Stewbot.`,
                            "icon_url": config.pfp
                        },
                        "description": "I am designed to assist moderators, entertain users, and provide many quality of life and utility functions. I'm looking forward to working with you! To get started, press any of the buttons below, or type `/` and start looking through my commands! You can also right click or hold down on any message, press Apps, and see what I can do there, too!\n\nWhat you see here is only the beginning, and there's so much more to discover!",
                        "color": 0x006400,
                        "fields": [
                            {
                                "name": `${cmds.filter.config.mention} ${cmds.filter.add.mention}`,
                                "value": "Configure the filter to keep your server clean",
                                "inline": true
                            },
                            {
                                "name": `${cmds.emojiboard.add.mention}`,
                                "value": "Setup an emojiboard for use in your server",
                                "inline": true
                            },
                            {
                                "name": `${cmds["auto-join-message"].mention} ${cmds["auto-leave-message"].mention}`,
                                "value": "Setup a customized message when a member joins or leaves the server",
                                "inline": true
                            },
                            {
                                "name": `${cmds.counting.config.mention}`,
                                "value": "Setup the counting game",
                                "inline": true
                            },
                            {
                                "name": `${cmds.embed_message.mention}`,
                                "value": "Need to display a message from another channel or server? I've got you covered.",
                                "inline": true
                            },
                            {
                                "name": `${cmds.general_config.mention} ${cmds.personal_config.mention}`,
                                "value": "Don't like some things that the bot does? Change the bot's automatic behaviors using these commands.",
                                "inline": true
                            },
                            {
                                "name": `${cmds["sticky-roles"].mention} ${cmds["auto-join-roles"].mention}`,
                                "value": "Setup roles that stay even when the user leaves and automatically apply roles when any user joins.",
                                "inline": true
                            }
                        ],
                        "footer": {
                            "text": "Liking what you see? Press my profile and then Add App to use me anywhere, even in DMs with other people!"
                        },
                        "thumbnail": {
                            "url": config.pfp
                        }
                    }];
                    if (errorFields.length > 0) {
                        embs.push({
                            "description": "I ran some diagnostics, there are some permissions I am missing. This isn't urgent, but without some of these permissions I will not be able to run some of my functions. Consider allowing Administrator permission, while not required it will make all of these errors irrelevant at once.",
                            "fields": errorFields,
                            "color": 0xff0000,
                            "title": "Permissions Errors",
                            "footer": {
                                "text": "Just a couple notes"
                            },
                            author: undefined,
                            thumbnail: undefined
                        });
                    }

                    await msg.channel.send({ content: "Greetings!", embeds: embs });
                    console.log("New server welcomed");

                    guildStore.sentWelcome = true;
                    await guildStore.save();
                }
            };
        }
    };
}

module.exports = {
    sendWelcome,

    data: {
        command: null,

        help: {
            helpCategories: [Categories.Module],
            shortDesc: "Welcomer module.",
            detailedDesc:
                `When Stewbot is added to a new server, this module attempts to find the most appropriate channel to post an intro message in.
                This message can recommend commands and explain how Stewbot works. `
        }
    },

    async [Events.GuildCreate](guild) {
        await sendWelcome(guild);
    },

    async [Events.ClientReady]() {
        // Check for new servers that got added / removed while we were offline
        const guilds = await client.guilds.fetch();
        guilds.forEach(async guild => {
            const knownGuild = await Guilds.findOne({ id: guild.id })
                .select("sentWelcome")
                .lean()
                .catch(() => null);

            if (!knownGuild) {
                notify("Added to **new server** (detected on boot scan)");
                await guildByObj(guild); // This will create the guild
                sendWelcome(guild);
            }
        });
    }
};
