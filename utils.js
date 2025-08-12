// Utility functions that should be / were previously "global" should be put here.
// These can then be required from other files.

const { PermissionFlagsBits, Message } = require("discord.js")
const config = require("./data/config.json");
const ms = require("ms");
const client = require("./client.js");

// Temp value for now to avoid circular references
let messageDataCache, Guilds, GuildUsers;
let checkDirty = () => {};

// This is so jank... but we use some functions that also use us, so short of splitting out each dep into it's own function...
setTimeout(() => {
    checkDirty = require("./commands/filter").checkDirty;
    // @ts-ignore
    ({ messageDataCache, Guilds, GuildUsers } = require("./commands/modules/database"));
}, 1);

// Easily cut output to a maximum length.
function limitLength(s, size = 1999) {
    s = String(s);
    return s.length > size ? s.slice(0, size - 3) + "..." : s;
}

// This function is useful anywhere to properly escape backticks to prevent format escaping
function escapeBackticks(text) {
    return text.replace(/(?<!\\)(?:\\\\)*`/g, "\\`");
}

async function notify(what, useWebhook = false) {
    // Notify the staff of the Kestron Support server

    console.log(what);
    try {
        if (useWebhook) {
            fetch(String(process.env.beta ? process.env.betaWebhook : process.env.logWebhook), {
                'method': 'POST',
                'headers': {
                    "Content-Type": "application/json"
                },
                'body': JSON.stringify({
                    'username': "Stewbot Notify Webhook",
                    "content": limitLength(what)
                })
            });
        }
        else {
            try {
                let channelId = process.env.beta ? config.betaNoticeChannel : config.noticeChannel;
                const channel = await client.channels.fetch(channelId);
                // @ts-ignore
                channel?.send(limitLength(what));
            } catch (e) {
                console.log("Couldn't send notify, retrying with webhook");
                notify(what, true);
            }
        }
    } catch (e) {
        console.log("Couldn't send notify");
    }
}

module.exports = {
    limitLength,
    escapeBackticks,
    notify,

    // A centralized permission-checking function for users and roles
    async canUseRole(user, role, channel) {
        // returns [ success, errorMsg ]
        if (user && role.comparePositionTo(channel.guild.members.cache.get(user.id)?.roles?.highest) >= 0) {
            return [false, `You cannot add this role because it is equal to or higher than your highest role.`];
        }
        if (user && !channel.permissionsFor(user.id).has(PermissionFlagsBits.ManageRoles)) {
            return [false, `You do not have permission to manage roles.`]
        }
        if (role.managed) {
            return [false, `This role is managed by an integration an cannot be used.`]
        }
        if (!channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageRoles)) {
            return [false, `I do not have the ManageRoles permission needed to preform this action.`]
        }
        if (channel.guild.members.cache.get(client.user.id)?.roles?.highest.position <= role.rawPosition) {
            return [false, `I cannot help with that role. If you would like me to, grant me a role that is ordered to be higher in the roles list than ${role.name}. You can reorder roles from Server Settings -> Roles.`];
        }
        return [true, null]
    },

    async sendHook(what, msg) {
        if (typeof what === "string") {
            what = { "content": what }
        }
        what.content = (await checkDirty(config.homeServer, what.content, true))[1];

        // Prevent pings
        what.allowedMentions = { parse: [] };

        // Thread IDs work a little different (channel is parent, and thread ID is channel ID)
        let mainChannel;
        if (msg.channel.isThread()) {
            mainChannel = msg.channel.parent;
            // Add in thread ID so it sends it there instead of the parent channel 
            what.threadId = msg.channel.id;
        } else {
            mainChannel = msg.channel;
        }

        var hook = await mainChannel.fetchWebhooks();
        hook = hook.find(h => h.token);
        if (hook) {
            hook.send(what);
        }
        else {
            mainChannel.createWebhook({
                name: config.name,
                avatar: config.pfp,
            }).then(d => {
                d.send(what);
            });
        }
    },

    inlineCode(text) {
        return "`" + escapeBackticks(text) + "`";
    },

    requireServer(interaction, error) {
        // This function takes in cmd.guild and an error message, 
        //  and will reply with the error message if the bot is not installed in the server.
        // Returns true if it had an error.
        // 
        // Usage:
        // if (requireServer(cmd) return;
        // if (requireServer(cmd, "Custom error here")) return;

        if (!error) error = `I must be installed to this server to run this command. A moderator can install me with this link:\n<${config.install}>`;

        if (!interaction.guild) {
            let replyMethod = interaction.deferred
                ? (opts) => interaction.followUp(opts)
                : (opts) => interaction.reply(opts);

            replyMethod({
                content: error,
                ephemeral: true,
            });
            return true;
        }
        return false;
    },

    /** 
     * Database lookup for high-traffic events (messageCreate, messageUpdate, etc) - TODO_DB: (look into) guild profile changes?
     * 
     * @typedef {import("./commands/modules/database").RawGuildDoc} RawGuildDoc
     * @typedef {import("./commands/modules/database").RawGuildUserDoc} RawGuildUserDoc
     * 
     * @returns {Promise<[RawGuildUserDoc|undefined, RawGuildDoc|undefined, RawGuildDoc|undefined]>} Array of read only DBs.
     * @param int Either an object with 'guildId' and 'userId' props, or a message object.  
     * */
    async getReadOnlyDBs(int, createGuildUser = true) {
        // returns [ readGuildUser, readGuild, readHomeGuild ]

        let readGuildUser;
        let readGuild;
        let readHomeGuild;

        let guildId;
        let userId;
        if (int instanceof Message) {
            guildId = int.guild?.id;
            userId = int.author?.id;
        }
        else if (typeof (int) == "object") {
            guildId = int.guildId;
            userId = int.userId || int.authorId;
        }

        // Efficiently create, store, and update users
        if (guildId && userId) {
            const guildKey = `${guildId}`;
            const guildUserKey = `${guildKey}>${userId}`;
            const homeGuildKey = config.homeServer;

            // Run all three DB queries in parallel
            const [cachedGuildUser, cachedGuild, cachedHomeGuild] = await Promise.all([
                // Get guild user
                messageDataCache.get(guildUserKey) || GuildUsers.findOneAndUpdate(
                    { guildId: guildId, userId: userId },
                    (createGuildUser ? { inServer: true } : {}), // set inServer since we're fetching them
                    { new: true, setDefaultsOnInsert: false, upsert: true }
                ).lean({ virtuals: true }).then(data => {
                    messageDataCache.set(guildUserKey, data);
                    return data;
                }),

                // Get guild
                messageDataCache.get(guildKey) || Guilds.findOneAndUpdate(
                    { id: guildId },
                    {},
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                ).lean({ virtuals: true }).then(data => {
                    messageDataCache.set(guildKey, data);
                    return data;
                }),

                // Get home guild (mainly for blocklist)
                messageDataCache.get(homeGuildKey) || Guilds.findOneAndUpdate(
                    { id: config.homeServer },
                    {},
                    { new: true, setDefaultsOnInsert: false, upsert: true }
                ).lean({ virtuals: true }).then(data => {
                    messageDataCache.set(homeGuildKey, data, ms("5 min") / 1000);
                    return data;
                })
            ]);

            readGuildUser = cachedGuildUser;
            readGuild = cachedGuild;
            readHomeGuild = cachedHomeGuild;
        }

        // @ts-ignore
        return [readGuildUser, readGuild, readHomeGuild];
    },

    // Are you an owner of stewbot?
    async isSudo(userId) {
        const guild = await client.guilds.fetch(config.homeServer);
        const member = await guild.members.fetch(userId).catch(() => null);
        return member?.permissionsIn(config.commandChannel).has(PermissionFlagsBits.ViewChannel) || false;
    }
}