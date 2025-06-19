// Stewbot main file.
// This file imports everything, dispatches events to the files they need to go to, and handles overall bot logic.

const bootedAt = Date.now();

//#region Startup
// Load envs and prepare for benchmarked boot.
const envs = require('./env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );
if (process.env.beta == 'false') delete process.env.beta; // ENVs are all strings, so make it falsy if it's "false"

console.beta = (...args) => process.env.beta && console.log(...args)

global.config = require("./data/config.json");
console.beta("Importing discord");
const {Client, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, TeamMemberMembershipState, Message}=require("discord.js");
console.beta("Importing commands");
const { getCommands } = require("./Scripts/launchCommands.js"); // Note: current setup requires this to be before the commands.json import (the cmd.globals setting)
const commandsLoadedPromise = getCommands();
const cmds = require("./data/commands.json"); global.cmds = cmds;
console.beta("Importing backup.js");
const { startBackupThreadPromise, checkForMongoRestore } = require("./backup.js");
console.beta("Importing everything else");
const { getEmojiFromMessage, parseEmoji } = require('./util');
const fs = require("fs");
const crypto = require('crypto');
const mongoose = require("mongoose");
const ms = require("ms");
const LRUCache = require("lru-cache").LRUCache;
console.beta("Importing InfluxDB");
const { initInflux, queueCommandMetric } = require('./commands/modules/metrics')
initInflux()

// Typedefs for DB
/**
 * @typedef {import("./commands/modules/database").GuildDoc} GuildDoc
 * @typedef {import("./commands/modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./commands/modules/database").UserDoc} UserDoc
 */

const DBConnectPromise = new Promise((resolve, reject) => {
    // Start the to the DB connection now, so it runs in the background and is ready later
    checkForMongoRestore().finally(_ => {
        mongoose.connect(`${process.env.databaseURI}/${process.env.beta ? "stewbeta" : "stewbot"}`)
        resolve();
    })
})

const cache = global.cache = {}; // This is used for things like antihack hashes that need to be stored, but not persistent 
const { updateBlocklists } = require("./commands/badware_scanner.js")
const { finTempSlow, scheduleTodaysSlowmode } = require("./commands/slowmode.js")
const { finTempRole, scheduleTodaysTemproles } = require("./commands/temp_role.js")
const { finHatPull, resetHatScheduleLocks, scheduleTodaysHats } = require("./commands/hat_pull.js")
const { finTempBan, scheduleTodaysUnbans } = require("./commands/ban.js")
const { finTimer, scheduleTimerEnds } = require("./commands/timer.js")
const { getStarMsg } = require("./commands/add_emojiboard.js")
const { processForNumber } = require("./commands/counting.js")
const { killMaintenanceBot } = require("./commands/restart.js")
const { resetAIRequests, convertCommandsToTools } = require("./commands/chat.js")
const { isModuleBlocked } = require("./commands/block_module.js")

//#endregion Imports

//#region Setup

// Load commands modules
function getSubscribedCommands(commands, subscription) {
    return Object.fromEntries(
        (Object.entries(commands)
                .filter(([name, command]) => command[subscription]) // Get all subscribed modules
        ).sort((a, b) => (a[1].data?.priority ?? 100) - (b[1].data?.priority ?? 100))
    )
}

let aiToolsCommands = { }
let commands = { }
let messageListenerModules = [ ];
let dailyListenerModules   = [ ];
let buttonListenerModules  = [ ];
let editListenerModules  = [ ];

commandsLoadedPromise.then( commandsLoaded => {
    commands = commandsLoaded;
    messageListenerModules = getSubscribedCommands(commands, "onmessage");
    dailyListenerModules = getSubscribedCommands(commands, "daily");
    buttonListenerModules = getSubscribedCommands(commands, "onbutton");
    editListenerModules = getSubscribedCommands(commands, "onedit");

    aiToolsCommands = convertCommandsToTools(commandsLoaded);
});

// Utility functions needed for processing some data blocks 
function hash(obj) {
    const input = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return crypto.createHash('md5').update(input).digest('hex');
}

// Log in with all intents expect guild presence
const client = new Client({
    intents: Object.values(GatewayIntentBits)
        .filter(i => typeof(i) == 'number')
        .filter(i => i !== GatewayIntentBits.GuildPresences),
    partials: Object.keys(Partials).map(a => Partials[a])
});
global.client = client;
global.notify = function(what, useWebhook=false) {
    console.beta(what);
    try {
        if (useWebhook) {
            fetch(process.env.logWebhook, {
                'method': 'POST',
                'headers': {
                    "Content-Type": "application/json"
                },
                'body': JSON.stringify({
                    'username': "Stewbot Notify Webhook", 
                    "content": limitLength(what)
                })
            })
        }
        else client.channels.cache.get(process.env.beta ? config.betaNoticeChannel : config.noticeChannel).send(limitLength(what));//Notify the staff of the Kestron Support server
    }catch(e){
        console.beta("Couldn't send notify()")
    }
}

// Other data
var uptime=0;
const { guildByID, guildByObj, userByID, userByObj, Guilds, Users, GuildUsers, ConfigDB, guildUserByID, guildUserByObj } = require('./commands/modules/database');
const NodeCache = require('node-cache');

// Build dynamic help pages
var helpCommands=[];
commandsLoadedPromise.finally( _ => {
    // Once commands are loaded
    Object.keys(commands).forEach(commandName=>{
        var cmd=commands[commandName];
        if(cmd.data?.help?.shortDesc!==undefined&&cmd.data?.help?.shortDesc!==`Stewbot's Admins Only`&&cmd.data?.help?.helpCategories.length>0){
            const commandMention = cmds[cmd.data?.command?.name]?.mention || `\`${commandName}\` Module`; // non-command modules don't have a mention
            helpCommands.push(Object.assign({
                name: cmd.data?.command?.name || commandName,
                mention: commandMention
            },cmd.data?.help));
        }
        else if(cmd.data?.help?.shortDesc!==`Stewbot's Admins Only`){
            Object.keys(cmd.data?.help || []).forEach(subcommand=>{
                var subcommandHelp=cmd.data?.help[subcommand];
                const subcommandMention = cmds[cmd.data?.command?.name]?.[subcommand]?.mention || `\`${commandName}\` Module` // No case for this rn but might have one in the future
                if(subcommandHelp.helpCategories?.length>0){
                    helpCommands.push(Object.assign({
                        name: `${commandName} ${subcommand}`,
                        mention: subcommandMention
                    },subcommandHelp));
                }
            });
        }
    });

    // Dump the help pages so we can import on websites and stuff
    fs.promises.writeFile("./data/helpPages.json", JSON.stringify(helpCommands, null, 4))
})


// Now that setup is done, define data that should be passed to each module - 
const pseudoGlobals = {
    config
};
//#endregion Setup

//#region Functions
// Global functions
global.canUseRole = async function(user, role, channel) { // A centralized permission-checking function for users and roles
    // returns [ success, errorMsg ]
    if (user && role.comparePositionTo(channel.guild.members.cache.get(user.id)?.roles?.highest) >= 0) {
        return [ false, `You cannot add this role because it is equal to or higher than your highest role.` ];
    }
    if (user && !channel.permissionsFor(user.id).has(PermissionFlagsBits.ManageRoles)){
        return [ false, `You do not have permission to manage roles.` ]
    }
    if (role.managed){
        return [ false, `This role is managed by an integration an cannot be used.` ]
    }
    if (!channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageRoles)){
        return [ false, `I do not have the ManageRoles permission needed to preform this action.` ]
    }
    if (channel.guild.members.cache.get(client.user.id)?.roles?.highest.position<=role.rawPosition){
        return [ false, `I cannot help with that role. If you would like me to, grant me a role that is ordered to be higher in the roles list than ${role.name}. You can reorder roles from Server Settings -> Roles.` ];
    }
    return [ true, null ]
}
global.sendHook = async function(what, msg) {
    if(typeof what==="string"){
        what={"content": what}
    }
    what.content=(await checkDirty(config.homeServer,what.content,true))[1];
    
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

    var hook=await mainChannel.fetchWebhooks();
    hook=hook.find(h=>h.token);
    if(hook){
        hook.send(what);
    }
    else{
        mainChannel.createWebhook({
            name: config.name,
            avatar: config.pfp,
        }).then(d=>{
            d.send(what);
        });
    }
}
global.limitLength = function(s, size=1999) { // Used everywhere, so global function.
    s = String(s);
    return s.length>size?s.slice(0,size-3)+"...":s;
}
global.escapeBackticks = function(text) { // This function is useful anywhere to properly escape backticks to prevent format escaping
    return text.replace(/(?<!\\)(?:\\\\)*`/g, "\\`");
}
global.requireServer = function(interaction, error) {
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
}


// Global message guild cache allows us to have less calls to the DB, and invalidate cache when we save DB changes
const messageDataCache = global.messageDataCache = new NodeCache({ stdTTL: 5, checkperiod: 30 });

// Database handlers for high-traffic events (messageCreate, messageUpdate, TODO_DB: (look into) guild profile changes?)
/** @returns {[GuildUserDoc, GuildDoc, GuildDoc]} */
async function getReadOnlyDBs(int, createGuildUser=true) {
    // returns [ readGuildUser, readGuild, readHomeGuild ]

    let readGuildUser;
    let readGuild;
    let readHomeGuild;

    // Efficiently create, store, and update users
    if (int.guild) {
        let authorId = int.author.id;

        const guildKey = `${int.guild.id}`;
        const guildUserKey = `${int.guild.id}>${authorId}`;
        const homeGuildKey = config.homeServer;

        // Run all three DB queries in parallel
        const [cachedGuildUser, cachedGuild, cachedHomeGuild] = await Promise.all([
            // Get guild user
            messageDataCache.get(guildUserKey) || GuildUsers.findOneAndUpdate(
                { guildId: int.guild.id, userId: authorId },
                (createGuildUser ? { inServer: true } : { }), // set inServer since we're fetching them
                { new: true, setDefaultsOnInsert: false, upsert: true }
            ).lean({ virtuals: true }).then(data => {
                messageDataCache.set(guildUserKey, data);
                return data;
            }),
            
            // Get guild
            messageDataCache.get(guildKey) || Guilds.findOneAndUpdate(
                { id: int.guild.id },
                { },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            ).lean({ virtuals: true }).then(data => {
                messageDataCache.set(guildKey, data);
                return data;
            }),

            // Get home guild (mainly for blocklist)
            messageDataCache.get(homeGuildKey) || Guilds.findOneAndUpdate(
                { id: config.homeServer },
                { },
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

    return [ readGuildUser, readGuild, readHomeGuild ];
}

// Local functions
function noPerms(guildId,what){
    if(!guildId) return false;
    switch(what){
        case "ManageMessages":
            guildByID(guildId, { "filter.active": false })
        break;
        case "ManageRoles":
            guildByID(guildId, { "stickyRoles": false })
        break;
        case "ManageWebhooks":
            guildByID(guildId, { "filter.censor": false })
        break;
    }
}
async function doEmojiboardReaction(react) {
    /**
    * Handle the information when a user reacts to a message, for emojiboards
    *
    * @param {MessageReaction | PartialMessageReaction} react: The reaction that was added
    * @returns {Promise<void>}
    */

    if (react.message.guildId == '0') return; // DMs patch

    const emoji = getEmojiFromMessage(
        react.emoji.requiresColons ?
            `<:${react.emoji.name}:${react.emoji.id}>` :
            react.emoji.name
    );

    const guild = await guildByID(react.message.guildId);
    const emojiboards = guild.emojiboards;

    // exit if the emojiboard for this emoji is not setup
    if (!emojiboards.has(emoji)) return;

    const emojiboard = emojiboards.get(emoji);

    if (!emojiboard.active) return;

    if (!emojiboard.isMute) {
        // exit if this message has already been posted
        if (emojiboard.posted.has(react.message.id)) return;

        // Exit if the message is already an emojiboard post
        if (react.message.channel.id === emojiboard.channel) return;
    }

    const messageData = await react.message.channel.messages.fetch(react.message.id);
    const foundReactions = messageData.reactions.cache.get(react.emoji.id || react.emoji.name);
    const selfReactions = react.message.reactions.cache.filter(r => r.users.cache.has(react.message.author.id) && r.emoji.name === react.emoji.name)

    // exit if we haven't reached the threshold
    if ((emojiboard.threshold + selfReactions.size) > foundReactions?.count) {
        return;
    }

    if (emojiboard.isMute) {
        var member = messageData.guild.members.cache.get(messageData.author.id);
        if (member === null || member === undefined) {
            member = await messageData.guild.members.fetch(messageData.author.id);
        }
        if (member === null || member === undefined) {
            return;
        }
        if (!member.bannable || !messageData.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ModerateMembers) || member.bot || member.permissions.has(PermissionFlagsBits.Administrator)) {
            return;
        }
        try {
            member.timeout(emojiboard.length, `I was configured with /groupmute_config to do so.`).catch(e => { });
        }
        catch (e) { }
        return;//If it's a groupmute, don't bother with emojiboard stuff.
    }

    var replyBlip = "";
    if (messageData.type === 19) {
        try {
            var refMessage = await messageData.fetchReference();
            replyBlip = `_[Reply to **${refMessage.author.username}**: ${refMessage.content.slice(0, 22).replace(/(https?\:\/\/|\n)/ig, "")}${refMessage.content.length > 22 ? "..." : ""}](<https://discord.com/channels/${refMessage.guild.id}/${refMessage.channel.id}/${refMessage.id}>)_`;
        } catch (e) { }
    }

    const resp = { files: [] };
    var i = 0;
    react.message.attachments.forEach((attached) => {
        let url = attached.url.toLowerCase();
        if (i !== 0 || (!url.includes(".jpg") && !url.includes(".png") && !url.includes(".jpeg") && !url.includes(".gif")) || emojiboard.messType === "0") {
            resp.files.push(attached.url);
        }
        i++;
    });

    if (emojiboard.messType === "0") {
        resp.content = react.message.content;
        resp.username = react.message.author.globalName || react.message.author.username;
        resp.avatarURL = react.message.author.displayAvatarURL();
        var c = client.channels.cache.get(emojiboard.channel);
        if (!c.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
            emojiboard.messType = "2";
            guild.save();
            return;
        }
        var hook = await c.fetchWebhooks();
        hook = hook.find(h => h.token);
        if (hook) {
            hook.send(resp).then(h => {
                emojiboard.posted.set(react.message.id, `webhook${h.id}`);
            });
        }
        else {
            client.channels.cache.get(emojiboard.channel).createWebhook({
                name: config.name,
                avatar: config.pfp,
            }).then(d => {
                d.send(resp).then(h => {
                    emojiboard.posted.set(react.message.id, `webhook${h.id}`);
                });
            });
        }
    }
    else {
        const emojiURL = (
            react.emoji.requiresColons ?
                (
                    react.emoji.animated ?
                        `https://cdn.discordapp.com/emojis/${react.emoji.id}.gif` :
                        `https://cdn.discordapp.com/emojis/${react.emoji.id}.png`
                ) :
                undefined
        )

        resp.embeds = [new EmbedBuilder()
            .setColor(0x006400)
            .setTitle("(Jump to message)")
            .setURL(`https://www.discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id}`)
            .setAuthor({
                name: react.message.author.globalName || react.message.author.username,
                iconURL: react.message.author.displayAvatarURL(),
                url: `https://discord.com/users/${react.message.author.id}`
            })
            .setDescription(`${replyBlip ? `${replyBlip}\n` : ""}${react.message.content ? react.message.content : "⠀"}`)
            .setTimestamp(new Date(react.message.createdTimestamp))
            .setFooter({
                text: `${!emojiURL ? react.emoji.name + ' ' : ''}${react.message.channel.name}`,
                iconURL: emojiURL
            })
            .setImage(react.message.attachments.first() ? react.message.attachments.first().url : null)
        ];
        if (emojiboard.messType === "1") {
            resp.content = getStarMsg(react.message);
        }
        var c = client.channels.cache.get(emojiboard.channel)
        if (!c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)) {
            emojiboard.active = false;
            guild.save();
            return;
        }
        const d = await c.send(resp);
        emojiboard.posted.set(react.message.id, d.id);
    }
    
    if (!guild.emojiboards.get(emoji).posters.get(react.message.author.id)) {
        guild.emojiboards.get(emoji).posters.set(react.message.author.id, 0);
    }

    guild.emojiboards.get(emoji).posters.set(react.message.author.id, guild.emojiboards.get(emoji).posters.get(react.message.author.id) + 1);
    guild.save();
}
function daily(dontLoop=false){
    if(!dontLoop) setInterval(()=> { daily(true) },60000*60*24);
    // Dispatch daily calls to all listening modules
    Object.values(dailyListenerModules).forEach(module => module.daily(pseudoGlobals))
}
async function sendWelcome(guild) {
    guild = await client.guilds.fetch(guild.id); // fetch the full guild
    for (const [ channelId, chan ] of guild.channels.cache) {
        if (chan?.permissionsFor(client.user.id).has(PermissionFlagsBits.ViewChannel)) {
            const messages = await chan?.messages?.fetch({limit:3});
            if (messages) for (const [ msgId, msg ] of messages) {
                const guildStore = await guildByObj(guild);
                if(
                    !guildStore.sentWelcome && (
                        msg.content?.toLowerCase().includes("stewbot") ||
                        msg.content?.includes(client.user.id) ||
                        msg.author?.id === client.user.id
                    )
                ){
                    var errorFields=[];
                    var neededPerms={
                        "AddReactions":"Without this permission, some things like the counting game will not function properly",
                        "ViewAuditLog":"Without this permission, I cannot run deleted message logs if you set it up",
                        "SendMessages":"Without this permission, there may be instances where I cannot respond when requested to",
                        "ManageMessages":"Without this permission, I cannot run the filter, or the move_message options, or persistent messages",
                        "EmbedLinks":"Without this permission, any function where I would be uploading an image will not work",
                        "AttachFiles":"Without this permission, any function where I upload a file (primarily images) does not work",
                        "ManageRoles":"Without this permission, I cannot help you automatically manage roles for sticky roles or auto roles",
                        "ManageWebhooks":"Without this permission, I cannot run level-ups, the censor function of the filter, one of the emojiboard modes, anonynous admin messaging, auto join and leave messages, tickets, or a couple other things.",
                    };
                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                        if(!guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])&&neededPerms.hasOwnProperty(perm)){
                            errorFields.push({
                                "name":`${perm}`,
                                "value":neededPerms[perm],
                                "inline":true
                            });
                        }
                    });
                    var embs=[{
                        "author":{
                            "name":`Greetings! I am Stewbot.`,
                            "icon_url":config.pfp
                        },
                        "description": "I am designed to assist moderators, entertain users, and provide many quality of life and utility functions. I'm looking forward to working with you! To get started, press any of the buttons below, or type `/` and start looking through my commands! You can also right click or hold down on any message, press Apps, and see what I can do there, too!\n\nWhat you see here is only the beginning, and there's so much more to discover!",
                        "color": 0x006400,
                        "fields": [
                            {
                                "name":`${cmds.filter.config.mention} ${cmds.filter.add.mention}`,
                                "value":"Configure the filter to keep your server clean",
                                "inline":true
                            },
                            {
                                "name":`${cmds.add_emojiboard.mention}`,
                                "value":"Setup an emojiboard for use in your server",
                                "inline":true
                            },
                            {
                                "name":`${cmds["auto-join-message"].mention} ${cmds["auto-leave-message"].mention}`,
                                "value":"Setup a customized message when a member joins or leaves the server",
                                "inline":true
                            },
                            {
                                "name":`${cmds.counting.config.mention}`,
                                "value":"Setup the counting game",
                                "inline":true
                            },
                            {
                                "name":`${cmds.embed_message.mention}`,
                                "value":"Need to display a message from another channel or server? I've got you covered.",
                                "inline":true
                            },
                            {
                                "name":`${cmds.general_config.mention} ${cmds.personal_config.mention}`,
                                "value":"Don't like some things that the bot does? Change the bot's automatic behaviours using these commands.",
                                "inline":true
                            },
                            {
                                "name":`${cmds["sticky-roles"].mention} ${cmds["auto-join-roles"].mention}`,
                                "value":"Setup roles that stay even when the user leaves and automatically apply roles when any user joins.",
                                "inline":true
                            }
                        ],
                        "footer": {
                          "text": "Liking what you see? Press my profile and then Add App to use me anywhere, even in DMs with other people!"
                        },
                        "thumbnail":{
                            "url":config.pfp
                        }
                      }];
                    if(errorFields.length>0){
                        embs.push({
                            "description": "I ran some diagnostics, there are some permissions I am missing. This isn't urgent, but without some of these permissions I will not be able to run some of my functions. Consider allowing Administrator permission, while not required it will make all of these errors irrelevant at once.",
                            "fields": errorFields,
                            "color":0xff0000,
                            "title": "Permissions Errors",
                            "footer": {
                              "text": "Just a couple notes"
                            }
                        });
                    }
                    
                    await msg.channel.send({content:"Greetings!", embeds:embs});
                    console.beta("New server welcomed")

                    guildStore.sentWelcome=true;
                    await guildStore.save();
                }
            };
        }
    };
}

async function checkPersistentDeletion(guildId, channelId, messageId){
    // If persistence is not active, or a new persistence message was posted, it was stewbot who deleted it.
    const guildStore = await guildByID(guildId);
    if(!guildId.persistence[channelId].active || guildId.persistence[channelId].lastPost!==messageId){
        return;
    }
    // If stewbot did not delete it, deactivate it.
    guildStore.persistence[channelId].active=false;
    await guildStore.save();

    channelId=client.channels.cache.get(channelId);
    if(channelId.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) channelId.send(`I have detected that a moderator deleted the persistent message set for this channel, and as such I have deactivated it. To reactivate it, a moderator can run ${cmds.set_persistent_message.mention}.`);
}
//#endregion Functions

//#region Listeners
//Actionable events
client.once("ready",async ()=>{
    killMaintenanceBot();
    
    // Once backup.js fully imports, start the backup thread
    startBackupThreadPromise.then( startBackupThread => {
        startBackupThread( ms("1h") , error => {
            notify(String(error));
        }, global.importedAtBoot ?? true)
    })

    let bootMOTD = ``;

    // Determine uptime
    const bootedAtTimestamp = `<t:${Math.round(Date.now()/1000)}:R>`
    const config = await ConfigDB.findOne({});
    const rebootIntentional = Date.now() - config.restartedAt < ms("30s");
    console.log(config.restartedAt - Date.now());
    if (rebootIntentional) {
        // The reboot was intentional
        uptime = Math.round(config.bootedAt/1000);
        bootMOTD += `Bot resumed after restart ${bootedAtTimestamp}`;
    } else {
        // The reboot was accidental, so reset our bootedAt time
        config.bootedAt = Date.now();
        uptime = Math.round(Date.now()/1000);
        bootMOTD += `Started at ${bootedAtTimestamp}`;
        config.save();
    }

    // Add boot time
    bootMOTD += ` | Booting took ${Date.now()-bootedAt}ms`;
    notify(bootMOTD);

    console.beta(`Logged into ${client.user.tag}`);
    
    // Status
    const status = "/tag_role - give your members a role when they apply your Guild Tag"
    // const status = "𝐒teward 𝐓o 𝐄xpedite 𝐖ork";
    client.user.setActivity(status,{type:ActivityType.Custom},1000*60*60*4);
    setInterval(()=>{
        client.user.setActivity(status,{type:ActivityType.Custom},1000*60*60*4);
    },60000*5);
    var now=new Date();
    setTimeout(daily,((now.getHours()>11?11+24-now.getHours():11-now.getHours())*(60000*60))+((60-now.getMinutes())*60000));

    // Check for new servers that got added / removed while we were offline
    const guilds = await client.guilds.fetch();
    guilds.forEach(async guild => {
        const knownGuild = await Guilds.findOne({ id: guild.id })
            .select("sentWelcome")
            .lean()
            .catch(e => null);

        if(!knownGuild) {
            notify("Added to **new server** (detected on boot scan)")
            await guildByObj(guild); // This will create the guild
            sendWelcome(guild);
        }
    });

    // Register time based stuff
    await resetHatScheduleLocks(); // has to be run at boot before scheduling timers
    scheduleTodaysUnbans();
    scheduleTodaysTemproles();
    scheduleTodaysHats();
    scheduleTimerEnds();
    scheduleTodaysSlowmode();
});


client.on("messageCreate",async msg => {
    if(msg.author.id===client.user.id) return;

    // Read-only stodge objects
    const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(msg);

    msg.guildId=msg.guildId||"0";

    if(msg.guild) {
        // Disable features in the server that the bot does not have permissions for.
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }
    
    // Dispatch to listening modules
    for (const command of Object.entries(messageListenerModules)) {
        const [ blocked, _ ] = isModuleBlocked(command, readGuild, readHomeGuild)
        if (!blocked) command[1].onmessage(msg, pseudoGlobals, readGuild, readGuildUser);
    }

    // The sudo handler uses so many globals, it can stay in index.js for now
    if(msg.content.startsWith("~sudo ")&&!process.env.beta||msg.content.startsWith("~betaSudo ")&&process.env.beta){
        const devadminChannel = await client.channels.fetch(config.commandChannel);
        await devadminChannel.guild.members.fetch(msg.author.id);

        if(devadminChannel?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
            const config = await ConfigDB.findOne({});
            const guild = await guildByObj(msg.guild);
            switch(msg.content.split(" ")[1].replaceAll(".","")){
                case "gemini":
                    config.useGlobalGemini = true;
                    msg.reply("Using Google Gemini globally")
                    break;
                case "ollama":
                    msg.reply("Using Ollama AI globally")
                    config.useGlobalGemini = false;
                    break;
                case "resetAI":
                    resetAIRequests();
                    break;
                case "setBanner":
                    const bannerName = msg.content.split(" ")[2];
                    const bannerPath = `./pfps/${bannerName}`;
                    const bannerBuffer = await fs.promises.readFile(bannerPath)
                    client.user.setBanner(bannerBuffer)
                    msg.reply("Done")
                    break;
                case "permStatus":
                    var missingPerms=[];
                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                        if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                            missingPerms.push(perm);
                        }
                    });
                    if(missingPerms.length===0) missingPerms.push(`No issues found`);
                    msg.reply(`As you command. My highest role is ${msg.guild.members.cache.get(client.user.id).roles.highest.name} at ${msg.guild.members.cache.get(client.user.id).roles.highest.rawPosition}.${missingPerms.map(m=>`\n- ${m}`).join("")}`);
                break;
                case "configStatus":
                    switch(msg.content.split(" ")[2]){
                        case "filter":
                            msg.reply(`As you command.\n- Active: ${guild.filter.active}\n- Censor: ${guild.filter.censor}\n- Log to a channel: ${guild.filter.log} <#${guild.filter.channel}>\n- Blocked words: ${guild.filter.blacklist.length}`);
                        break;
                        case "autoMessage":
                            msg.reply(`As you command.\n## Auto Join Messages\n- Active: ${guild.ajm.active}\n- Location: ${guild.ajm.location||guild.ajm.dm?"DM":"Channel"}\n- Channel: ${guild.ajm.channel}\n- Message: \n\`\`\`\n${guild.ajm.message}\n\`\`\`\n## Auto Leave Messages\n- Active: ${guild.alm.active}\n- Channel: ${guild.alm.channel}\n- Message: \n\`\`\`\n${guild.alm.message}\n\`\`\``);
                        break;
                    }
                break;
                case "countSet":
                    guild.counting.nextNum=+msg.content.split(" ")[2];
                    msg.reply(`The next number to enter is **${guild.counting.nextNum}**.`);
                break;
                case "runDaily":
                    await msg.reply(`Running the daily function...`);
                    daily(true);
                break;
                case "runWelcome":
                    guild.sentWelcome=false;
                    sendWelcome(msg.guild);
                break;
                case "resetHackSafe":
                    await GuildUsers.updateOne({ userId: msg.author.id, guildId: msg.guild.id }, {
                        $unset: { "safeTimestamp": 1 }
                    });
                    msg.reply("Removed your anti-hack safe time");
                break;
                case "echo":
                    msg.channel.send(msg.content.slice("~sudo echo ".length,msg.content.length));
                break;
                case "setWord":
                    config.wotd=msg.content.split(" ")[2].toLowerCase();
                    msg.reply(config.wotd);
                break;
                case "checkRSS":
                    Object.entries(commands).find(([name, module]) => name === 'rss')[1].daily(pseudoGlobals);
                    // checkRSS();
                break;
                case "updateBlocklists":
                    updateBlocklists();
                break;
                case "crash":
                    setTimeout(die => { undefined.instructed_to_crash = instructed_to_crash })
                    setTimeout(async die => { undefined.instructed_to_crash = instructed_to_crash })
                    undefined.instructed_to_crash = instructed_to_crash
                break;
            }
            config.save();
            guild.save()
        }
        else{
            msg.reply("I was unable to verify you.");
        }
        return;
    }
});

client.on("interactionCreate", async cmd=>{
    const asyncTasks = [ ]; // Any non-awaited functions go here to fully known when this command is done executing for metrics
    const intStartTime = Date.now();
    
    const commandScript = commands[cmd.commandName];
    if (!commandScript && (cmd.isCommand() || cmd.isAutocomplete())) return; // Ignore any potential cache issues 

    //// Manage deferring
    try{
        if(
            !cmd.isButton() &&
            !cmd.isModalSubmit() &&
            !cmd.isChannelSelectMenu() &&
            !cmd.isRoleSelectMenu() &&
            !cmd.isStringSelectMenu()
        ) {
            const isPrivate = cmd.options.getBoolean("private");
            const isPrivateDefined = isPrivate !== null;
            const ephemeral = 
                isPrivateDefined ? cmd.options.getBoolean("private") : 
                commandScript?.data.deferEphemeral || // Slash commands base off this property.
                [ "join-roleOption" ].includes(cmd.commandName); // Backup for buttons that need to be ephemeral. 
            
            await cmd.deferReply({
                ephemeral
            });
        }
    }catch(e){}

    //// Autocomplete
    if (cmd.isAutocomplete()) {
        const providedGlobals = { ...pseudoGlobals };
        requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            providedGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }

        asyncTasks.push(
            commands?.[cmd.commandName]?.autocomplete?.(cmd, providedGlobals)
        )
    }

    //// Slash commands
    if (cmd.isCommand() && commands.hasOwnProperty(cmd.commandName)) {
        const listeningModule = [ `${cmd.commandName} ${cmd.options.getSubcommand(false)}`.trim(), commandScript ]; // Here we artificially provide the full path since slash commands can have subcommands
        // TODO_DB: this could be made more efficient by passing in the readonly guilds as objects
        const [ blocked, errorMsg ] = isModuleBlocked(listeningModule, 
            (await guildByObj(cmd.guild)), 
            (await guildByID(config.homeServer)),
            cmd?.member?.permissions?.has?.('Administrator')
        )
        if (blocked) return cmd.followUp(errorMsg);
        
        // Checks passed, gather requested data
        const providedGlobals = { ...pseudoGlobals };
        requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            providedGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }

        // Run, and catch errors
        try {
            await commands[cmd.commandName].execute(cmd, providedGlobals);
        } catch(e) {
            // Catch blocked by automod
            if (e.code === 200000) {
                cmd.followUp(`Sorry, something in this reply was blocked by AutoMod.`)
            }

            try {
                cmd.followUp(
                    `Sorry, some error was encountered. It has already been reported, there is nothing you need to do.\n` +
                    `However, you can keep up with Stewbot's latest features and patches in the [Support Server](<https://discord.gg/k3yVkrrvez>).`
                )
            } catch {}
            throw e; // Throw it so that it hits the error notifiers
        }
    }

    //// Buttons, Modals, and Select Menu
    Object.values(buttonListenerModules).forEach(module => {
        // Only emit buttons to subscribed modules
        const moduleSubscriptions = module.subscribedButtons || [];
        let subbed = false;
        for (const sub of moduleSubscriptions) {
            if (
                (typeof sub === 'string' && sub === cmd.customId) || 
                (sub instanceof RegExp && sub.test(cmd.customId))
            ) {
                subbed = true;
                continue;
            }
        }

        if (subbed) asyncTasks.push(module.onbutton(cmd, pseudoGlobals))
    })

    // Wait for everything to complete
    await Promise.allSettled(asyncTasks);
    const intEndTime = Date.now();

    queueCommandMetric(cmd.commandName, intEndTime - intStartTime);
});

client.on("messageReactionAdd",async (react,user)=>{
    if(react.message.guildId===null) return;

    const guild = await guildByObj(react.message.guild);

    // Reaction filters
    if(guild.filter.active&&react.message.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
        if(await checkDirty(react.message.guild.id,`${react._emoji}`)){
            react.remove();
            if(guild.filter.log){
                var c=client.channels.cache.get(guild.filter.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({
                        content: `I removed a ${react._emoji.id===null?react._emoji.name:`<:${react._emoji.name}:${react._emoji.id}>`} reaction from https://discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id} added by <@${user.id}> due to being in the filter.`,
                        allowedMentions: []
                    });
                }
                else{
                    guild.filter.log=false;
                }
            }
            return;
        }
    }
    else if(guild.filter.active){
        guild.filter.active=false;
    }

    // Emojiboard reactions
    doEmojiboardReaction(react);
});

client.on("messageDelete",async msg=>{
    if(msg.guild?.id===undefined) return;

    const guildStore = await guildByObj(msg.guild);

    if(guildStore.persistence?.[msg.channel.id]?.active&&guildStore.persistence?.[msg.channel.id]?.lastPost===msg.id){
        setTimeout(()=>{checkPersistentDeletion(msg.guild.id,msg.channel.id,msg.id)},1500);
    }

    // Emojiboard deleted handlers
    const postToRedact = await Guilds.aggregate([
        // Find which emojiboard contains this posted msg ID
        {
            $project: {
                emojiboards: {
                    $objectToArray: "$emojiboards"
                }
            }
        },
        {
            $unwind: "$emojiboards"
        },
        {
            $match: {
                [`emojiboards.v.posted.${msg.id}`]: {
                    $exists: true
                }
            }
        },
        {
            $project: {
                emoji: "$emojiboards.k",
                board: "$emojiboards.v"
            }
        }
    ]) 
    postToRedact.forEach(async ({emoji, board}) => {
        if(emoji) {
            try {
                if (board.posted[msg.id].startsWith("webhook")&&board.channel?.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                    var c=await client.channels.cache.get(board.channel).messages.fetch(board.posted[msg.id].split("webhook")[1]);
                    c.delete();
                }
                else if(!board.posted[msg.id].startsWith("webhook")){
                    var c=await client.channels.cache.get(board.channel).messages.fetch(board.posted[msg.id]);
                    c.edit({content:`I'm sorry, but it looks like this post by **${msg.author?.globalName||msg.author?.username}** was deleted.`,embeds:[],files:[]});
                }
            } catch(e) {
                // Cache issues, nothing we can do
            }
        }
    })

    // Resend if the latest counting number was deleted
    if(guildStore.counting.active&&guildStore.counting.channel===msg.channel.id){
        // var num=msg.content?.match(/^(\d|,)+(?:\b)/i);
        var num = msg.content ? processForNumber(msg.content) : null;
        if(num!==null&&num!==undefined){
            if(+num===guildStore.counting.nextNum-1){
                msg.channel.send(String(num)).then(m=>m.react("✅"));
            }
        }
    }

    // Logs stuff
    if(guildStore.logs.mod_actions&&guildStore.logs.active){
        if(msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ViewAuditLog)){
            setTimeout(async ()=>{
                const fetchedLogs = await msg.guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageDelete,
                    limit: 1,
                });
                const firstEntry = fetchedLogs.entries.first();
                if(!firstEntry) return;
                firstEntry.timestamp=BigInt("0b"+BigInt(firstEntry.id).toString(2).slice(0,39))+BigInt(1420070400000);
                if(firstEntry.target.id===msg?.author?.id&&BigInt(Date.now())-firstEntry.timestamp<BigInt(60000)){
                    var c=msg.guild.channels.cache.get(guildStore.logs.channel);
                    if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({content:limitLength(`**Message from <@${firstEntry.target.id}> Deleted by <@${firstEntry.executor.id}> in <#${msg.channel.id}>**\n\n${msg.content.length>0?`\`\`\`\n${msg.content}\`\`\``:""}${msg.attachments?.size>0?`There were **${msg.attachments.size}** attachments on this message.`:""}`),allowedMentions:{parse:[]}});
                    }
                    else{
                        guildStore.logs.active=false;
                    }
                }
            },2000);
        }
        else{
            guildStore.logs.mod_actions=false;
        }
    }

    guildStore.save();
});

client.on("messageUpdate",async (msgO,msg)=>{
    // Currently there's no use for messageUpdate in DMs, only in servers. If this ever changes, remove the guildId check and add more further down
    if(msg.guild?.id===undefined||client.user.id===msg.author?.id) return;
    
    const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(msg);

    // Dispatch to listening modules
    for (const command of Object.entries(editListenerModules)) {
        const [ blocked, _ ] = isModuleBlocked(command, readGuild, readHomeGuild)
        if (!blocked) command[1].onedit(msgO, msg, readGuild, readGuildUser);
    }
});

client.on("guildMemberAdd",async member => {
    // Mark this user as in the server, if the user object exists already
    await GuildUsers.updateOne(
        { userId: member.user.id, guildId: member.guild.id },
        { $set: { inServer: true } },
        { upsert: false }
    );

    const guildStore = await guildByObj(member.guild);

    // Auto join messages
    if(guildStore.ajm.active){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
            // Swap to DMs if we don't have perms to message, but the join messages are active
            guildStore.ajm.dm=true;
        }

        if (guildStore.ajm.dm) {
            try {
                member.send({
                    embeds: [{
                        type: "rich",
                        title: member.guild.name,
                        description: guildStore.ajm.message.replaceAll("${@USER}", `<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : ''}`).replaceAll("\\n", "\n"),
                        color: 0x006400,
                        thumbnail: {
                            url: member.guild.iconURL(),
                            height: 0,
                            width: 0,
                        },
                        footer: { text: `This message was sent from ${member.guild.name}` },
                    }]
                }).catch(e => { });
            } catch (e) { }
        }
        else{
            var resp={
                content:guildStore.ajm.message.replaceAll("${@USER}",`<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : '' }`).replaceAll("\\n","\n"),
                username:member.guild.name,
                avatarURL:member.guild.iconURL()
            };
            var hook=await client.channels.cache.get(guildStore.ajm.channel).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                hook.send(resp);
            }
            else{
                client.channels.cache.get(guildStore.ajm.channel).createWebhook({
                    name: config.name,
                    avatar: config.pfp
                }).then(d=>{
                    d.send(resp);
                });
            }
        }
    }

    // Stick roles
    var addedStickyRoles=0;
    if(guildStore.stickyRoles){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            guildStore.stickyRoles=false;
        }
        else{
            const guildUser = await guildUserByObj(member.guild, member.id);
            guildUser.roles.forEach(role=>{
                try{
                    let myRole=member.guild.members.cache.get(client.user.id).roles.highest.position;
                    var role=member.guild.roles.cache.find(r=>r.id===role);
                    if (role && role.id !== member.guild.id) {
                        if(myRole>role.rawPosition){
                            member.roles.add(role);
                            addedStickyRoles++;
                        }
                    }
                }
                catch(e){}
            });
        }
    }
    if(addedStickyRoles===0&&guildStore.autoJoinRoles){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            guildStore.autoJoinRoles=[];
        }
        if(guildStore.autoJoinRoles.length>0){
            guildStore.autoJoinRoles.forEach(role=>{
                let myRole=member.guild.members.cache.get(client.user.id).roles.highest.position;
                var role=member.guild.roles.cache.find(r=>r.id===role);
                if(role!==undefined&&role!==null){
                    if(myRole>role.rawPosition){
                        member.roles.add(role);
                    }
                }
            });
        }
    }
    if(guildStore.logs.active&&guildStore.logs.joining_and_leaving){
        client.channels.cache.get(guildStore.logs.channel).send({content:`**<@${member.id}> (${member.user.username}) has joined the server.**`,allowedMentions:{parse:[]}});
    }

    guildStore.save();
});

client.on("guildMemberRemove",async member=>{
    if (member.user.id == client.user.id) return;

    // Save all this user's roles
    const guildUser = await guildUserByID(member.guild.id, member.id, {}, true);
    const guildStore = await guildByObj(member.guild);
    
    guildUser.roles = member.roles.cache.map(r => r.id);
    guildUser.inServer = false;
    
    // Logs
    if (guildStore.logs.active && guildStore.logs.joining_and_leaving) {
        var bans = await member.guild.bans.fetch();
        var c = client.channels.cache.get(guildStore.logs.channel);
        if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
            c.send({ content: `**<@${member.id}> (${member.user.username}) has ${bans.find(b => b.user.id === member.id) ? "been banned from" : "left"} the server.**${bans.find(b => b.user.id === member.id)?.reason !== undefined ? `\n${bans.find(b => b.user.id === member.id)?.reason}` : ""}`, allowedMentions: { parse: [] } });
        }
        else {
            guildStore.logs.active = false;
        }
    }

    // Auto Leave Messages
    if (guildStore.alm?.active) {
        if (!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
            guildStore.alm.active = false;
            return;
        }

        var resp = {
            content:guildStore.alm.message.replaceAll("${@USER}",`<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : '' }`),
            username:member.guild.name,
            avatarURL:member.guild.iconURL()
        };
        var hook=await client.channels.cache.get(guildStore.alm.channel).fetchWebhooks();
        hook=hook.find(h=>h.token);
        if(hook){
            hook.send(resp);
        }
        else{
            client.channels.cache.get(guildStore.alm.channel).createWebhook({
                name: config.name,
                avatar: config.pfp
            }).then(d=>{
                d.send(resp);
            });
        }
    }

    guildStore.save();
    guildUser.save();
});

//Strictly log-based events
client.on("channelDelete",async channel=>{
    const guildStore = await guildByObj(channel.guild);
    if(guildStore.logs.active&&guildStore.logs.channel_events){
        var c=channel.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Channel \`${channel.name}\` Deleted**`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("channelUpdate",async (channelO,channel)=>{
    const guildStore = await guildByObj(channel.guild);

    if (guildStore.logs.active && guildStore.logs.channel_events) {
        var diffs=[];
        var caredAboutDiffs=["name","nsfw","topic","parentId","rateLimitPerUser"];
        Object.keys(channelO).forEach(key=>{
            if(channelO[key]!==channel[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=channel.guild.channels.cache.get(guildStore.logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var rls={
                    "0":"None",
                    "5":"5s",
                    "10":"10s",
                    "15":"15s",
                    "30":"30s",
                    "60":"1m",
                    "120":"2m",
                    "300":"5m",
                    "600":"10m",
                    "900":"15m",
                    "1800":"30m",
                    "3600":"1h",
                    "7200":"2h",
                    "21600":"6h"
                };
                c.send({content:`**Channel Edited**${diffs.map(d=>`\n- ${d}`).join("")}`,embeds:[
                    {
                        "type": "rich",
                        "title": `${diffs.includes("name")?`#${channelO.name} -> `:""}#${channel.name}`,
                        "description": "",
                        "color": 0x006400,
                        "fields": [
                            {
                                "name": `Description`,
                                "value": `${diffs.includes("topic")?`${channelO.topic} -> `:""}${channel.topic}`,
                                "inline": true
                            },
                            {
                                "name": `Category Name`,
                                "value": `${diffs.includes("parentId]")?`${channelO.parentId===null?"None":client.channels.cache.get(channelO.parentId)?.name} -> `:""}${channel.parentId===null?"None":client.channels.cache.get(channel.parentId)?.name}`,
                                "inline": true
                            },
                            {
                                "name": `Slowmode`,
                                "value": `${diffs.includes("rateLimitPerUser")?`${rls[`${channelO.rateLimitPerUser}`]} -> `:""}${rls[`${channel.rateLimitPerUser}`]}`,
                                "inline": true
                            },
                            {
                                "name": `Age Restricted`,
                                "value": `${diffs.includes("nsfw")?`${channelO.nsfw} -> `:""}${channel.nsfw}`,
                                "inline": true
                            }
                        ],
                        "thumbnail":{
                            "url":channel.guild.iconURL(),
                            "width":0,
                            "height":0
                        },
                        "footer": {
                            "text": `Channel Edited`
                        },
                        "url": `https://discord.com/channels/${channel.guild.id}/${channel.id}`
                    }
                ]});
            }
            else{
                guildStore.logs.active=false;
                guildStore.save();
            }
        }
    }
});
client.on("emojiCreate",async emoji=>{
    const guildStore = await guildByObj(emoji.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        var c=emoji.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: created:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("emojiDelete",async emoji=>{
    const guildStore = await guildByObj(emoji.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        var c=emoji.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: deleted.**`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("emojiUpdate",async (emojiO,emoji)=>{
    const guildStore = await guildByObj(emoji.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        var c=emoji.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emojiO.name}\`: is now :\`${emoji.name}\`:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("stickerCreate",async sticker=>{
    const guildStore = await guildByObj(sticker.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        var c=sticker.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Sticker \`${sticker.name}\` created**\n- **Name**: ${sticker.name}\n- **Related Emoji**: ${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${sticker.description}`,stickers:[sticker]});
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("stickerDelete",async sticker=>{
    const guildStore = await guildByObj(sticker.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        var c=sticker.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Sticker \`${sticker.name}\` Deleted**`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("stickerUpdate",async (stickerO,sticker)=>{
    const guildStore = await guildByObj(sticker.guild);

    if(guildStore.logs.active&&guildStore.logs.emoji_events){
        let diffs=[];
        Object.keys(stickerO).forEach(key=>{
            if(stickerO[key]!==sticker.key){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=sticker.guild.channels.cache.get(guildStore.logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                c.send({
                    content:
                        `**Sticker Edited**\n`+
                        `- **Name**: ${ diffs.includes("name") 
                            ? `${stickerO.name} -> `
                            :""}${sticker.name}\n`+
                        `- **Related Emoji**: ${diffs.includes("tags")
                            ? `${/^\d{19}$/.test(stickerO.tags)
                                ?`<:${client.emojis.cache.get(stickerO.tags).name}:${stickerO.tags}>`
                                :stickerO.tags} -> `
                            :""}${/^\d{19}$/.test(sticker.tags)
                                ?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`
                                :sticker.tags}\n`+
                        `- **Description**: ${diffs.includes("description")?`${stickerO.description} -> `:""}${sticker.description}`,
                    stickers: [sticker]
                });
            }
            else{
                guildStore.logs.active=false;
                guildStore.save();
            }
        }
    }
});
client.on("inviteCreate",async invite=>{
    const guildStore = await guildByObj(invite.guild);

    if(guildStore.logs.active&&guildStore.logs.invite_events){
        var c=invite.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Created**\n- Code: ${invite.code}\n- Created by <@${invite.inviterId}>\n- Channel: <#${invite.channelId}>${invite._expiresTimestamp?`\n- Expires <t:${Math.round(invite._expiresTimestamp/1000)}:R>`:``}\n- Max uses: ${invite.maxUses>0?invite.maxUses:"Infinite"}`,allowedMentions:{parse:[]}});
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("inviteDelete",async invite=>{
    const guildStore = await guildByObj(invite.guild);

    if(guildStore.logs.active&&guildStore.logs.invite_events){
        var c=invite.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Deleted**`,allowedMentions:{parse:[]}});
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("roleCreate",async role=>{
    const guildStore = await guildByObj(role.guild);

    if(guildStore.logs.active&&guildStore.logs.role_events){
        var c=role.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Role <@&${role.id}> created**`,allowedMentions:{parse:[]}});
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("roleDelete",async role=>{
    const guildStore = await guildByObj(role.guild);

    if(guildStore.logs.active&&guildStore.logs.role_events){
        var c=role.guild.channels.cache.get(guildStore.logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Role \`${role.name}\` Deleted**`);
        }
        else{
            guildStore.logs.active=false;
            guildStore.save();
        }
    }
});
client.on("roleUpdate",async (roleO,role)=>{
    const guildStore = await guildByObj(role.guild);

    if(guildStore.logs.active&&guildStore.logs.role_events){
        var diffs=[];
        var caredAboutDiffs=["name","hoist","mentionable","color"];
        Object.keys(roleO).forEach(key=>{
            if(roleO[key]!==role[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=role.guild.channels.cache.get(guildStore.logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[
                    {
                      "name": `Hoisted`,
                      "value": `${diffs.includes("hoist")?`${roleO.hoist} -> `:""}${role.hoist}`,
                      "inline": true
                    },
                    {
                      "name": `Pingable`,
                      "value": `${diffs.includes("mentionable")?`${roleO.mentionable} -> `:""}${role.mentionable}`,
                      "inline": true
                    }
                ];
                if(diffs.includes("color")){
                    flds.push({
                        "name": `Old Color`,
                        "value": `#${roleO.color}`,
                        "inline": false
                    });
                }
                c.send({content:`**Role <@&${role.id}> Edited**`,embeds:[{
                    "type": "rich",
                    "title": `${diffs.includes("name")?`${roleO.name} -> `:""}${role.name}`,
                    "description": "",
                    "color": role.color,
                    "fields": flds,
                    "thumbnail": {
                        "url": role.guild.iconURL(),
                        "height": 0,
                        "width": 0
                    }
                  }],allowedMentions:{parse:[]}});
            }
            else {
                guildStore.logs.active=false;
                guildStore.save();
            }
        }
    }
});
client.on("guildMemberUpdate",async (memberO,member)=>{
    
    const guildStore = await guildByObj(member.guild);

    if(guildStore.logs.active&&guildStore.logs.user_change_events){
        var diffs=[];
        var caredAboutDiffs=["nickname","avatar"];
        Object.keys(memberO).forEach(key=>{
            if(memberO[key]!==member[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=client.channels.cache.get(guildStore.logs.channel);
            if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[];
                if(diffs.includes("avatar")){
                    flds.push({
                        "name": `Avatar`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                c.send({content:`**User <@${member.id}> Edited for this Server**`,embeds:[{
                    "type": "rich",
                    "title": `${diffs.includes("nickname")?`${memberO.nickname} -> `:""}${member.nickname}`,
                    "description": `${member.user.username}`,
                    "color": member.user.accentColor===undefined?0x006400:member.user.accentColor,
                    "fields": flds,
                    "thumbnail": {
                        "url": member.displayAvatarURL()?member.displayAvatarURL():member.user.displayAvatarURL(),
                        "height": 0,
                        "width": 0
                    },
                    "url":`https://discord.com/users/${member.id}`
                }],allowedMentions:{parse:[]}});
            }
            else{
                guildStore.logs.active=false;
                guildStore.save();
            }
        }
    }

});

// To log global changes, we use the user updated event in which discord sends the old member. 
//   We then wait for raw guild user update events, which send the server the user was updated in, but not the old user object.
const oldProfileCache = new LRUCache({ ttl: ms("30s") })
client.on(Events.UserUpdate, (oldUser, newUser) => {
    oldProfileCache.set(`${oldUser.id}`, structuredClone(oldUser));
});

async function checkTagUpdate(packet) {
    if (packet.t !== 'GUILD_MEMBER_UPDATE') return;

    // Monitor guild tags to apply a given role to all users who apply the tag. This is not yet supported by discord.js so we have to do it ourself
    const guildFromPacket = packet.d.guild_id;
    const clan = packet?.d?.user?.clan || packet?.d?.user?.primary_guild;
    const tagInUse = clan?.identity_guild_id;
    const isGuildsTag = guildFromPacket == tagInUse;

    const guild = await guildByID(guildFromPacket);
    if (guild.guildTagRole) {
        // If the guild is set to apply tags
        
        const discordGuild = await client.guilds.fetch(guildFromPacket).catch(e => null);
        if (discordGuild) {
            try {
                const member = await discordGuild.members.fetch(packet.d.user.id);
                const role = discordGuild.roles.cache.get(guild.guildTagRole);
                const memberHasRole = member.roles.cache.get(role.id);
                if (member && role) {
                    if (isGuildsTag && !memberHasRole) 
                        await member.roles.add(role, "Applied for adopting Guild Tag");
                    
                    if (!isGuildsTag && memberHasRole)
                        await member.roles.remove(role, "Removed for removing Guild Tag");
                }
            } catch (e) { console.log(e); }
        }
    }
}

async function logGuildMemberUpdate(packet) {
    // This function takes a `GUILD_MEMBER_UPDATE` packet,
    //   and posts about diffs between what the user is and what the user was
    //   *globally*. Only global diffs are posted about by this function.
    // Guild-user diffs are handled by the `guildMemberUpdate` function.
    // This function is here because discord.js does not pass `guildMemberUpdate` update
    // events when the event is global.
    if (packet.t !== 'GUILD_MEMBER_UPDATE') return;

    // Wait for 5 seconds to make sure we have the old profile from other events
    await new Promise(resolve => setTimeout(resolve, ms("5s")));

    const packetUser = packet.d?.user;
    const cachedUser = oldProfileCache.get(packetUser.id)
    const guildId = packet.d?.guild_id;
    if (!packetUser || !guildId) return;

    // Fetch logging channel
    const [logChannelId] = await Guilds.find({
        id: guildId,
        "logs.user_change_events": true
    }).distinct("logs.channel");
    if (!logChannelId) return;

    // Normalize old/new fields
    const oldData = {
        username: cachedUser?.username ?? "[Unknown]",
        global_name: cachedUser?.globalName ?? "[Unknown]",
        avatar: cachedUser?.avatar ?? null,
        banner: cachedUser?.banner ?? null,
    };

    const newData = {
        username: packetUser.username ?? "[Unknown]",
        global_name: packetUser.global_name ?? "[Unknown]",
        avatar: packetUser.avatar ?? null,
        banner: packetUser.banner ?? null,
    };

    const trackedFields = [
        { key: "username", label: "Username" },
        { key: "global_name", label: "Global Name" },
    ];

    const diffs = [];

    // CDN builders
    function cdnAssetURL(type, userId, hash) {
        if (!hash) return null;
        const ext = hash.startsWith("a_") ? "gif" : "png";
        return `https://cdn.discordapp.com/${type}/${userId}/${hash}.${ext}?size=256`;
    }
    const avatarURL = (id, hash) => cdnAssetURL("avatars", id, hash);
    const bannerURL = (id, hash) => cdnAssetURL("banners", id, hash);

    // Generic diff builder
    function diffField(field, label, inline = true, formatter = (a, b) => `\`${a}\` → \`${b}\``) {
        if (oldData[field] !== newData[field]) {
            diffs.push({
                name: label,
                value: formatter(oldData[field], newData[field]),
                inline
            });
        }
    }

    for (const { key, label } of trackedFields) {
        diffField(key, label);
    }

    // Special: Avatar diff
    if (oldData.avatar !== newData.avatar) {
        const oldUrl = avatarURL(packetUser.id, oldData.avatar);
        const newUrl = avatarURL(packetUser.id, newData.avatar);
        diffs.push({
            name: "Avatar",
            value: `${oldUrl ? `[Old](${oldUrl})` : "`[None\\Unknown]`"} → ${newUrl ? `[New](${newUrl})` : "`[None]`"}`,
            inline: false
        });
    }

    // Special: Banner diff
    if (oldData.banner !== newData.banner) {
        const oldUrl = bannerURL(packetUser.id, oldData.banner);
        const newUrl = bannerURL(packetUser.id, newData.banner);
        diffs.push({
            name: "Banner",
            value: `${oldUrl ? `[Old](${oldUrl})` : "`[None]`"} → ${newUrl ? `[New](${newUrl})` : "`[None]`"}`,
            inline: false
        });
    }

    if (diffs.length === 0) return;

    // Channel + permission check
    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
        await Guilds.updateOne({ id: guildId }, { "logs.user_change_events": false });
        return;
    }

    const thumb = avatarURL(packetUser.id, newData.avatar) || client.user.displayAvatarURL();

    await channel.send({
        content: `**User <@${packetUser.id}> updated their global profile**`,
        embeds: [{
            type: "rich",
            title: "Global Profile Update",
            description: `**${newData.username}** (${newData.global_name !== "[Unknown]" ? newData.global_name : "no global name"})`,
            color: cachedUser?.accentColor ?? 0x006400,
            fields: diffs,
            thumbnail: { url: thumb },
            url: `https://discord.com/users/${packetUser.id}`
        }],
        allowedMentions: { parse: [] }
    });

}

client.on(Events.Raw, async (packet) => {
    checkTagUpdate(packet);
    logGuildMemberUpdate(packet);
});


// Bot events for staff notifications
client.on("rateLimit",async d=>{
    notify("Ratelimited -\n\n"+d);
});
client.on("error",async e=>{
    notify("Client emitted error:\n\n"+e.stack);
});
client.on("guildCreate",async guild=>{
    notify(`Added to **a new server**!`);
    await sendWelcome(guild);
});
client.on("guildDelete",async guild=>{
    // Remove this guild from the store
    await Guilds.deleteOne({ id: guild.id });

    // Remove all guild users objects under this server
    await GuildUsers.deleteMany({
        guildId: guild.id
    })

    notify(`Removed from **a server**.`);
});
//#endregion Listeners

//Error handling
process.on('unhandledRejection', e=>notify(e.stack));
process.on('unhandledException', e=>notify(e.stack));
process.on('uncaughtException',  e=>notify(e.stack));
process.on('uncaughtRejection',  e=>notify(e.stack));

// Connect to the DB before logging in
console.beta("Connecting to database")
DBConnectPromise.then(_ => {
    console.beta("Logging in")
    client.login(process.env.beta ? process.env.betaToken : process.env.token);
});
