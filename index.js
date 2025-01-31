//#region Imports
const envs = require('./env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );
if (process.env.beta == 'false') delete process.env.beta; // ENVs are all strings, so make it falsy if it's "false"

let mongoDB = process.env.beta && true;

global.config = require("./data/config.json");
console.beta = (...args) => process.env.beta && console.log(...args)
console.beta("Importing discord")
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
console.beta("Importing commands")
const { getCommands } = require("./Scripts/launchCommands.js"); // Note: current setup requires this to be before the commands.json import
const cmds=require("./data/commands.json"); global.cmds = cmds;
console.beta("Importing backup.js")
const startBackupThread = require("./backup.js");
console.beta("Importing everything else")
const { getEmojiFromMessage, parseEmoji } = require('./util');
const fs = require("fs");
const crypto = require('crypto');
const mongoose = require("mongoose");

const { updateBlocklists } = require("./commands/badware_scanner.js")
const { finTempSlow } = require("./commands/slowmode.js")
const { finTempRole } = require("./commands/temp_role.js")
const { finHatPull } = require("./commands/hat_pull.js")
const { finTempBan } = require("./commands/hat_pull.js")
const { finTimer } = require("./commands/timer.js")
const { getStarMsg } = require("./commands/add_emojiboard.js")
const { processForNumber } = require("./commands/counting.js")
const { killMaintenanceBot } = require("./commands/restart.js")
const { resetAIRequests } = require("./commands/chat.js")
//#endregion Imports

//#region Setup
// Preliminary setup (TODO: move to a setup.sh?)
if (!fs.existsSync("tempMove")) fs.mkdirSync('tempMove');
if (!fs.existsSync("tempMemes")) fs.mkdirSync('tempMemes');
if (!fs.existsSync("./data/usage.json")) fs.writeFileSync('./data/usage.json', '{}');
const usage=require("./data/usage.json");

// Load commands modules
function getSubscribedCommands(commands, subscription) {
    return Object.fromEntries(
        (Object.entries(commands)
                .filter(([name, command]) => command[subscription]) // Get all subscribed modules
        ).sort((a, b) => (a[1].data?.priority ?? 100) - (b[1].data?.priority ?? 100))
    )
}
console.beta("Loading commands")
const commands = getCommands();
const messageListenerModules = getSubscribedCommands(commands, "onmessage");
const dailyListenerModules = getSubscribedCommands(commands, "daily");
const buttonListenerModules = getSubscribedCommands(commands, "onbutton");

// Utility functions needed for processing some data blocks 
function hash(obj) {
    const input = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return crypto.createHash('md5').update(input).digest('hex');
}

// Database stuff
const storageLocations = ["./storage.json", "./storage2.json"];
let storageCycleIndex = 0;
function readLatestDatabase() {
    // TODO, multinode: this function will probably handle determining if the drive version or the local version is later, and copy those locally.
    // It should ideally also sort each drive location by write time, and pull them in the same way sortedLocations does here.
    //  although, it would be better to actually add a timestamp to the storage.json and read that... since upload time for the drive files is not hte same as the time the file was created, necessarily.
    //  or maybe it's close enough since under normal cases, it would only be 30 seconds off.


    // We'll overwrite these right away once we read the correct one
    const corruptedFiles = []

    // Get a list, in order of which ones we should read first
    const sortedLocations = storageLocations
        .filter(file => fs.existsSync(file)) // For file that exists,
        .map(file => ({
            file,
            mtime: fs.statSync(file).mtime   // get the last modified time
        }))
        .sort((a, b) => b.mtime - a.mtime)  // sort this array by the most frequent
        .map(({ file }) => file);
    
    for (let location of sortedLocations) {
        try {
            const data = require(location);
            console.beta(`Read database from ${location}`)

            // This shouldn't be needed, unless it was a boot-loop error that kept corrupting its own files. Plan for the worst.
            corruptedFiles.forEach(file => {
                fs.writeFileSync(file, JSON.stringify(data));
            })
            
            return data;
        } catch (e) {
            corruptedFiles.push(location)
            notify(`Storage location ${location} could not be loaded (*${e.message}*), trying the next one.`, true)
        }
    }

    // This case should never be hit - in theory we could try to load from the latest google drive. 
    notify(`No storage locations could be loaded. Tried: ${sortedLocations.join(", ")}.`);
    process.exit();
}
global.storage = readLatestDatabase(); // Storage needs to be global for our submodules
let lastStorageHash = hash(storage);
setInterval(() => {
    writeLocation = storageLocations[storageCycleIndex % storageLocations.length];
    const storageString = process.env.beta ? JSON.stringify(storage, null, 4) : JSON.stringify(storage);
    const thisWriteHash = hash(storageString);
    if (lastStorageHash !== thisWriteHash) {
        fs.writeFileSync(writeLocation, storageString);
        lastStorageHash = thisWriteHash;
        storageCycleIndex++; 
        console.beta(`Just wrote DB to ${writeLocation}`)
        
        // Doing this here could be lossy but doesn't matter since we have good uptime
        fs.writeFileSync("./data/usage.json", JSON.stringify(usage));
    }
}, 10 * 1000);

// Other data
var uptime=0;
const defaultGuild=require("./data/defaultGuild.json");
const defaultGuildUser=require("./data/defaultGuildUser.json");
const defaultUser=require("./data/defaultUser.json");

// Build dynamic help pages
var helpCommands=[];
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
        Object.keys(cmd.data?.help).forEach(subcommand=>{
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
fs.writeFileSync("./data/helpPages.json", JSON.stringify(helpCommands, null, 4))

var ints=Object.keys(GatewayIntentBits).map(a=>GatewayIntentBits[a]);
ints.splice(ints.indexOf(GatewayIntentBits.GuildPresences),1);
ints.splice(ints.indexOf("GuildPresences"),1);
const client=new Client({
    intents:ints,
    partials:Object.keys(Partials).map(a=>Partials[a])
});
global.client = client;

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
    what.content=checkDirty(config.homeServer,what.content,true)[1];
    
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
global.escapeBackticks = function(text){ // This function is useful anywhere to properly escape backticks to prevent format escaping
    return text.replace(/(?<!\\)(?:\\\\)*`/g, "\\`");
}

// Local functions
function noPerms(where,what){
    if(where===false||where===undefined) return false;
    switch(what){
        case "ManageMessages":
            storage[where].filter.active=false;
        break;
        case "ManageRoles":
            storage[where].stickyRoles=false;
        break;
        case "ManageWebhooks":
            storage[where].filter.censor=false;
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
    )

    // exit if the emojiboard for this emoji is not setup
    if (!(emoji in storage[react.message.guildId].emojiboards)) return;

    const emojiboard = storage[react.message.guildId].emojiboards[emoji];

    if(!emojiboard.active) return;

    if(!emojiboard.isMute){
        // exit if this message has already been posted
        if(react.message.id in emojiboard.posted) return;

        // Exit if the message is already an emojiboard post
        if(react.message.channel.id===emojiboard.channel) return;
    }

    const messageData    = await react.message.channel.messages.fetch(react.message.id);
    const foundReactions = messageData.reactions.cache.get(react.emoji.id || react.emoji.name);
    const selfReactions  = react.message.reactions.cache.filter(r => r.users.cache.has(react.message.author.id) && r.emoji.name === react.emoji.name)

    // exit if we haven't reached the threshold
    if((emojiboard.threshold+selfReactions.size)>foundReactions?.count){
        return;
    }

    if(emojiboard.isMute){
        var member=messageData.guild.members.cache.get(messageData.author.id);
        if(member===null||member===undefined){
            member=await messageData.guild.members.fetch(messageData.author.id);
        }
        if(member===null||member===undefined){
            return;
        }
        if(!member.bannable||!messageData.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ModerateMembers)||member.bot||member.permissions.has(PermissionFlagsBits.Administrator)){
            return;
        }
        try{
            member.timeout(emojiboard.length,`I was configured with /groupmute_config to do so.`).catch(e=>{});
        }
        catch(e){}
        return;//If it's a groupmute, don't bother with emojiboard stuff.
    }

    var replyBlip="";
    if(messageData.type===19){
        try {
            var refMessage=await messageData.fetchReference();
            replyBlip=`_[Reply to **${refMessage.author.username}**: ${refMessage.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${refMessage.content.length>22?"...":""}](<https://discord.com/channels/${refMessage.guild.id}/${refMessage.channel.id}/${refMessage.id}>)_`;
        }catch(e){}
    }

    const resp = { files:[] };
    var i = 0;
    react.message.attachments.forEach((attached) => {
            let url=attached.url.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||emojiboard.messType==="0"){
                    resp.files.push(attached.url);
            }
            i++;
    });

    if(emojiboard.messType==="0"){
            resp.content=react.message.content;
            resp.username=react.message.author.globalName||react.message.author.username;
            resp.avatarURL=react.message.author.displayAvatarURL();
            var c=client.channels.cache.get(emojiboard.channel);
            if(!c.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                    emojiboard.messType="2";
                    return;
            }
            var hook=await c.fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                    hook.send(resp).then(h=>{
                            emojiboard.posted[react.message.id]=`webhook${h.id}`;
                    });
            }
            else{
                    client.channels.cache.get(emojiboard.channel).createWebhook({
                            name:config.name,
                            avatar: config.pfp,
                    }).then(d=>{
                            d.send(resp).then(h=>{
                                    emojiboard.posted[react.message.id]=`webhook${h.id}`;
                            });
                    });
            }
    }
    else{
            const emojiURL = (
                    react.emoji.requiresColons ?
                    (
                            react.emoji.animated ?
                            `https://cdn.discordapp.com/emojis/${react.emoji.id}.gif` :
                            `https://cdn.discordapp.com/emojis/${react.emoji.id}.png`
                    ) :
                    undefined
            )

            resp.embeds=[new EmbedBuilder()
                    .setColor(0x006400)
                    .setTitle("(Jump to message)")
                    .setURL(`https://www.discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id}`)
                    .setAuthor({
                            name: react.message.author.globalName||react.message.author.username,
                            iconURL:react.message.author.displayAvatarURL(),
                            url:`https://discord.com/users/${react.message.author.id}`
                    })
                    .setDescription(`${replyBlip?`${replyBlip}\n`:""}${react.message.content?react.message.content:"⠀"}`)
                    .setTimestamp(new Date(react.message.createdTimestamp))
                    .setFooter({
                            text: `${!emojiURL ? react.emoji.name + ' ' : ''}${react.message.channel.name}`,
                            iconURL: emojiURL
                    })
                    .setImage(react.message.attachments.first()?react.message.attachments.first().url:null)
            ];
            if(emojiboard.messType==="1"){
                    resp.content=getStarMsg(react.message);
            }
            var c=client.channels.cache.get(emojiboard.channel)
            if(!c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
                    emojiboard.active=false;
                    return;
            }
            c.send(resp).then(d=>{
                    emojiboard.posted[react.message.id]=d.id;
            });
    }

    storage[react.message.guild.id].emojiboards[emoji] = emojiboard;
    try{
        if(!storage[react.message.guild.id].emojiboards[emoji].hasOwnProperty("posters")){
            storage[react.message.guild.id].emojiboards[emoji].posters={};
        }
        if(!storage[react.message.guild.id].emojiboards[emoji].posters.hasOwnProperty(react.message.author.id)){
            storage[react.message.guild.id].emojiboards[emoji].posters[react.message.author.id]=0;
        }
        storage[react.message.guild.id].emojiboards[emoji].posters[react.message.author.id]++;
        storage[react.message.guild.id].users[react.message.author.id].stars++;
    }catch(e){}
    
}
function daily(dontLoop=false){
    if(!dontLoop) setInterval(()=> { daily(true) },60000*60*24);
    // Dispatch daily calls to all listening modules
    Object.values(dailyListenerModules).forEach(module => module.daily(pseudoGlobals))
}
async function sendWelcome(guild) {
    guild = await client.guilds.fetch(guild.id);
    guild.channels.cache.forEach(chan=>{
        if(chan.permissionsFor(client.user.id).has(PermissionFlagsBits.ViewChannel)){
            chan?.messages?.fetch({limit:3}).then(messages=>messages.forEach(msg=>{
                if(!storage[guild.id].sentWelcome&&(msg.content?.toLowerCase().includes("stewbot")||msg.content?.includes(client.user.id)||msg.author.id===client.user.id)){
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
                    msg.channel.send({content:"Greetings!",embeds:embs});
                    storage[msg.guild.id].sentWelcome=true;
                }
            }));
        }
    });
}
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
function checkPersistentDeletion(guild, channel, message){
    // If persistence is not active, or a new persistence message was posted, it was stewbot who deleted it.
    if(!storage[guild].persistence[channel].active || storage[guild].persistence[channel].lastPost!==message){
        return;
    }
    // If stewbot did not delete it, deactive it.
    storage[guild].persistence[channel].active=false;
    channel=client.channels.cache.get(channel);
    if(channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) channel.send(`I have detected that a moderator deleted the persistent message set for this channel, and as such I have deactivated it. To reactivate it, a moderator can run ${cmds.set_persistent_message.mention}.`);
}
//#endregion Functions

//#region Listeners
//Actionable events
client.once("ready",async ()=>{
    killMaintenanceBot();
    
    // Schedule cloud backups every hour
    startBackupThread("./storage.json", 60*60*1000, error => {
        notify(String(error));
    }, true)

    uptime=Math.round(Date.now()/1000);
    notify(`Started <t:${uptime}:R>`);
    console.beta(`Logged into ${client.user.tag}`);
    
    // Status
    client.user.setActivity("𝐒teward 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
    setInterval(()=>{
        client.user.setActivity("𝐒teward 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
    },60000*5);
    var now=new Date();
    setTimeout(daily,((now.getHours()>11?11+24-now.getHours():11-now.getHours())*(60000*60))+((60-now.getMinutes())*60000));

    // Check for new servers that got added / removed while we were offline
    const guilds = await client.guilds.fetch();
    guilds.forEach(guild => {
        const serverInStorage = storage[guild.id]
        if(!serverInStorage){
            notify("Added to **new server** (detected on boot scan)")
            storage[guild.id] = structuredClone(defaultGuild);
            sendWelcome(guild);
        }
    })

    // Check for guilds in storage that are no longer in discord
    const validGuildIds = new Set(Array.from(guilds.keys()));
    const serverCount = Object.entries(storage).filter(([id, data]) => data?.isGuild).length;
    let serversDeleted = 0;
    Object.entries(storage)
        .filter(([id, data]) => data?.isGuild && !validGuildIds.has(id))
        .forEach(([id, data]) => {
            notify("Removed from **a server** (detected on boot scan)")
            serversDeleted++;
            delete storage[id];
        });
    const newServerCount = Object.entries(storage).filter(([id, data]) => data?.isGuild).length;
    notify(`Deleted ${serversDeleted}/${serverCount} servers from storage. There are ${newServerCount} servers left.`)

    // Register time based stuff 
    Object.keys(storage).forEach(key=>{
        try {
            if(storage[key]?.hasOwnProperty("timer")){
                if(storage[key].timer.time-Date.now()>0){
                    setTimeout(()=>{finTimer(key)},storage[key].timer.time-Date.now());
                }
                else{
                    finTimer(key);
                }
            }
            if(storage[key]?.hasOwnProperty("hat_pull")){
                if(storage[key].hat_pull.ends-Date.now()<=60000*60*24){
                    storage[key].hat_pull.registered=true;
                    if(storage[key].hat_pull.ends-Date.now()>0){
                        setTimeout(()=>{finHatPull(key)},storage[key].hat_pull.ends-Date.now());
                    }
                    else{
                        finHatPull(key);
                    }
                }
            }
            if(storage[key]?.hasOwnProperty("tempSlow")){
                Object.keys(storage[key].tempSlow).forEach(slow=>{
                    if(storage[key].tempSlow[slow].ends-Date.now()>0){
                        setTimeout(()=>{finTempSlow(key,slow)},storage[key].tempSlow[slow].ends-Date.now());
                    }
                    else{
                        finTempSlow(key,slow);
                    }
                });
            }
            if(storage[key]?.hasOwnProperty("tempBans")){
                Object.keys(storage[key].tempBans).forEach(ban=>{
                    if(storage[key].tempBans[ban].ends-Date.now()>0){
                        setTimeout(()=>{finTempBan(key,ban)},storage[key].tempBans[ban].ends-Date.now());
                        storage[key].tempBans[ban].registered=true;
                    }
                    else{
                        finTempBan(key,ban);
                    }
                });
            }
            if(storage[key]?.hasOwnProperty("users")){
                Object.keys(storage[key].users).forEach(user=>{
                    if(storage[key].users[user].hasOwnProperty("tempRoles")){
                        Object.keys(storage[key].users[user].tempRoles).forEach(role=>{
                            if(storage[key].users[user].tempRoles[role]-Date.now()>0){
                                setTimeout(()=>{finTempRole(key,user,role)},storage[key].users[user].tempRoles[role]-Date.now());
                            }
                            else{
                                finTempRole(key,user,role);
                            }
                        });
                    }
                });
            }
        } catch (e) {
            notify("Error in dailies:\n" + e.stack);
        }
    });
});

client.on("messageCreate",async msg => {
    if(msg.author.id===client.user.id) return;

    // Create guild objects if they don't exist should stay up top
    msg.guildId=msg.guildId||"0";

    if(msg.guildId!=="0"){
        if(!storage.hasOwnProperty(msg.guildId)){
            storage[msg.guildId]=structuredClone(defaultGuild);
        }
        if(!storage[msg.guildId].users.hasOwnProperty(msg.author.id)){
            storage[msg.guildId].users[msg.author.id]=structuredClone(defaultGuildUser);
        }
    }
    if(!storage.hasOwnProperty(msg.author.id)){
        storage[msg.author.id]=structuredClone(defaultUser);
    }

    if(msg.guild){
        // Disable features in the server that the bot does not have permissions for.
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }

    
    // Dispatch to listening modules
    Object.entries(messageListenerModules).forEach(([name, module]) => {
        // Check if this command is blocked with /block_module
        const commandPath = `${module.data?.command?.name || name}`; // ||name handles non-command modules
        // If this is a guild, check for blocklist
        if (msg.guild?.id) {
            let guildBlocklist = storage[msg.guild.id].blockedCommands || []
            guildBlocklist = guildBlocklist.map(blockCommand => blockCommand.replace(/^\//, '')) // Backwards compatability with block_command which had a leading /
            if (guildBlocklist.includes(commandPath)) {
                return; // Ignore this module
            }
        }
        // Check global blacklist from home server
        const globalBlocklist = storage[config.homeServer]?.blockedCommands || []
        if (globalBlocklist.includes(commandPath)) {
            return;
        }

        module.onmessage(msg, pseudoGlobals);
    })

    // The sudo handler uses so many globals, it can stay in index.js for now
    if(msg.content.startsWith("~sudo ")&&!process.env.beta||msg.content.startsWith("~betaSudo ")&&process.env.beta){
        const devadminChannel = await client.channels.fetch(config.commandChannel);
        await devadminChannel.guild.members.fetch(msg.author.id);

        if(devadminChannel?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
            switch(msg.content.split(" ")[1].replaceAll(".","")){
                case "resetAI":
                    resetAIRequests();
                    break;
                case "setBanner":
                    const bannerName = msg.content.split(" ")[2];
                    const bannerPath = `./pfps/${bannerName}`;
                    const bannerBuffer = fs.readFileSync(bannerPath)
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
                            msg.reply(`As you command.\n- Active: ${storage[msg.guild.id].filter.active}\n- Censor: ${storage[msg.guild.id].filter.censor}\n- Log to a channel: ${storage[msg.guild.id].filter.log} <#${storage[msg.guild.id].filter.channel}>\n- Blocked words: ${storage[msg.guild.id].filter.blacklist.length}`);
                        break;
                        case "autoMessage":
                            if(!storage[msg.guild.id].hasOwnProperty("alm")) storage[msg.guild.id].alm=structuredClone(defaultGuild.alm);
                            msg.reply(`As you command.\n## Auto Join Messages\n- Active: ${storage[msg.guild.id].ajm.active}\n- Location: ${storage[msg.guild.id].ajm.location||storage[msg.guild.id].ajm.dm?"DM":"Channel"}\n- Channel: ${storage[msg.guild.id].ajm.channel}\n- Message: \n\`\`\`\n${storage[msg.guild.id].ajm.message}\n\`\`\`\n## Auto Leave Messages\n- Active: ${storage[msg.guild.id].alm.active}\n- Channel: ${storage[msg.guild.id].alm.channel}\n- Message: \n\`\`\`\n${storage[msg.guild.id].alm.message}\n\`\`\``);
                        break;
                    }
                break;
                case "countSet":
                    storage[msg.guild.id].counting.nextNum=+msg.content.split(" ")[2];
                    msg.reply(`The next number to enter is **${storage[msg.guild.id].counting.nextNum}**.`);
                break;
                case "runDaily":
                    await msg.reply(`Running the daily function...`);
                    daily(true);
                break;
                case "runWelcome":
                    storage[msg.guild.id].sentWelcome=false;
                    sendWelcome(msg.guild);
                break;
                case "resetHackSafe":
                    delete storage[msg.guild.id].users[msg.author.id].safeTimestamp;
                    msg.reply("Removed your anti-hack safe time");
                break
                case "echo":
                    msg.channel.send(msg.content.slice("~sudo echo ".length,msg.content.length));
                break;
                case "setWord":
                    storage.wotd=msg.content.split(" ")[2].toLowerCase();
                    msg.reply(storage.wotd);
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
                case "fixStorage":
                    client.guilds.cache.forEach(guild=>{
                        if(!storage.hasOwnProperty(guild)){
                            storage[guild]=structuredClone(defaultGuild);
                        }
                        else{
                            Object.keys(defaultGuild).forEach(key=>{
                                if(!storage[guild].hasOwnProperty(key)){
                                    storage[guild][key]=structuredClone(defaultGuild[key]);
                                }
                            });
                        }
                    });
                    msg.reply(`Attempted to fix`);
                break;
            }
        }
        else{
            msg.reply("I was unable to verify you.");
        }
        return;
    }
});

client.on("interactionCreate",async cmd=>{
    const commandScript = commands[cmd.commandName];
    if (!commandScript && (cmd.isCommand() || cmd.isAutocomplete())) return; // Ignore any potential cache issues 

    // Manage deferring
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

    try{
        // NOTE: this is probably what is adding that null object to our DB
        if(cmd.guildId!==0){
            if(!storage.hasOwnProperty(cmd.guildId)){
                storage[cmd.guildId]=structuredClone(defaultGuild);
            }
            if(!storage[cmd.guildId].users.hasOwnProperty(cmd.user.id)){
                storage[cmd.guildId].users[cmd.user.id]=structuredClone(defaultGuildUser);
            }
        }
    }
    catch(e){
        cmd.guild={"id":"0"};
    }
    if(!storage.hasOwnProperty(cmd.user.id)){
        storage[cmd.user.id]=structuredClone(defaultUser);
    }


    // Autocomplete
    if (cmd.isAutocomplete()) {
        const providedGlobals = { ...pseudoGlobals };
        requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            providedGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }

        commands?.[cmd.commandName]?.autocomplete?.(cmd, providedGlobals);
        return;
    }

    // Slash commands
    if (cmd.isCommand() && commands.hasOwnProperty(cmd.commandName)) {
        // If this is a guild, check for blocklist
        const commandPathWithSubcommand = `${cmd.commandName} ${cmd.options._subcommand ? cmd.options.getSubcommand() : "<none>"}`; //meh but it works
        const commandPath = `${cmd.commandName}`;
        if (cmd.guild?.id) {
            let guildBlocklist = storage[cmd.guild.id].blockedCommands || []
            guildBlocklist = guildBlocklist.map(blockedCommand => blockedCommand.replace(/^\//, '')) // Backwards compatability with block_command which had a leading /

            if (guildBlocklist.includes(commandPath) || guildBlocklist.includes(commandPathWithSubcommand)) {
                let response = "This command has been blocked by this server.";
                if (cmd.member.permissions.has('Administrator')) {
                    response += `\nYou can use ${cmds.block_module.mention} to unblock it.`
                }
                return cmd.followUp(response);
            }
        }
        
        // Check global blacklist from home server
        const globalBlocklist = storage[config.homeServer]?.blockedCommands || []
        if (globalBlocklist.includes(commandPath) || globalBlocklist.includes(commandPathWithSubcommand)) {
            return cmd.followUp("This command has temporarily been blocked by Stewbot admins.");
        }
        
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
                return cmd.followUp(`Sorry, something in this reply was blocked by AutoMod.`)
            }

            try {
                cmd.followUp(
                    `Sorry, some error was encountered. It has already been reported, there is nothing you need to do.\n` +
                    `However, you can keep up with Stewbot's latest features and patches in the [Support Server](<https://discord.gg/>).`
                )
            } catch {}
            throw e; // Throw it so that it hits the error notifiers
        }

        // Command frequency stats 
        if(!(usage[commandPathWithSubcommand] ?? false)) usage[commandPathWithSubcommand] = 0;
        usage[commandPathWithSubcommand]++;
        return;
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

        if (subbed) module.onbutton(cmd, pseudoGlobals)
    })
});

client.on("messageReactionAdd",async (react,user)=>{
    if(react.message.guildId===null) return;

    // Create storage objects if needed
    if(react.message.guildId!=="0"){
        if(!storage.hasOwnProperty(react.message.guildId)){
            storage[react.message.guildId]=structuredClone(defaultGuild);
            
        }
        if(!storage[react.message.guildId].users.hasOwnProperty(user.id)){
            storage[react.message.guildId].users[user.id]=structuredClone(defaultGuildUser);
            
        }
    }
    if(!storage.hasOwnProperty(user.id)){
        storage[user.id]=structuredClone(defaultUser);
    }

    // Reaction filters
    if(storage[react.message.guild?.id]?.filter.active&&react.message.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
        if(checkDirty(react.message.guild.id,`${react._emoji}`)){
            react.remove();
            if(storage[react.message.guild.id].filter.log){
                var c=client.channels.cache.get(storage[react.message.guild.id].filter.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({
                        content: `I removed a ${react._emoji.id===null?react._emoji.name:`<:${react._emoji.name}:${react._emoji.id}>`} reaction from https://discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id} added by <@${user.id}> due to being in the filter.`,
                        allowedMentions: []
                    });
                }
                else{
                    storage[react.message.guild.id].filter.log=false;
                }
            }
            return;
        }
    }
    else if(storage[react.message.guild?.id]?.filter.active){
        storage[react.message.guild.id].filter.active=false;
    }

    // Emojiboard reactions
    doEmojiboardReaction(react);
});

client.on("messageDelete",async msg=>{
    if(msg.guild?.id===undefined) return;

    // Create needed storage objects
    if(!storage.hasOwnProperty(msg.guild.id)){
        storage[msg.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[msg.guild.id]?.persistence?.[msg.channel.id]?.active&&storage[msg.guild.id]?.persistence?.[msg.channel.id]?.lastPost===msg.id){
        setTimeout(()=>{checkPersistentDeletion(msg.guild.id,msg.channel.id,msg.id)},1500);
    }

    // Emojiboard deleted handlers
    if(Object.keys(storage[msg.guild.id].emojiboards).length>0){
        Object.keys(storage[msg.guild.id].emojiboards).forEach(async emoji=>{
            emoji=storage[msg.guild.id].emojiboards[emoji];
            if(emoji.isMute) return;
            if(emoji.posted.hasOwnProperty(msg.id)){
                try {
                    if(emoji.posted[msg.id].startsWith("webhook")&&emoji.channel?.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                        var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id].split("webhook")[1]);
                        c.delete();
                    }
                    else if(!emoji.posted[msg.id].startsWith("webhook")){
                        var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id]);
                        c.edit({content:`I'm sorry, but it looks like this post by **${msg.author?.globalName||msg.author?.username}** was deleted.`,embeds:[],files:[]});
                    }
                } catch(e) {
                    // Cache issues, nothing we can do
                }
            }
        });
    }

    // Resend if the latest counting number was deleted
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        // var num=msg.content?.match(/^(\d|,)+(?:\b)/i);
        var num = msg.content ? processForNumber(msg.content) : null;
        if(num!==null&&num!==undefined){
            if(+num===storage[msg.guild.id].counting.nextNum-1){
                msg.channel.send(String(num)).then(m=>m.react("✅"));
            }
        }
    }

    // Logs stuff
    if(storage[msg.guild.id]?.logs.mod_actions&&storage[msg.guild.id]?.logs.active){
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
                    var c=msg.guild.channels.cache.get(storage[msg.guild.id].logs.channel);
                    if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({content:limitLength(`**Message from <@${firstEntry.target.id}> Deleted by <@${firstEntry.executor.id}> in <#${msg.channel.id}>**\n\n${msg.content.length>0?`\`\`\`\n${msg.content}\`\`\``:""}${msg.attachments?.size>0?`There were **${msg.attachments.size}** attachments on this message.`:""}`),allowedMentions:{parse:[]}});
                    }
                    else{
                        storage[msg.guild.id].logs.active=false;
                    }
                }
            },2000);
        }
        else{
            storage[msg.guild.id].logs.mod_actions=false;
        }
    }
});

client.on("messageUpdate",async (msgO,msg)=>{
    if(msg.guild?.id===undefined||client.user.id===msg.author?.id) return;//Currently there's no use for messageUpdate in DMs, only in servers. If this ever changes, remove the guildId check and add more further down
    
    // Manage storage
    if(!storage.hasOwnProperty(msg.author.id)){
        storage[msg.author.id]=structuredClone(defaultUser);   
    }
    if(!storage.hasOwnProperty(msg.guildId)){
        storage[msg.guildId]=structuredClone(defaultGuild);
    }
    if(!storage[msg.guildId].users.hasOwnProperty(msg.author.id)){
        storage[msg.guildId].users[msg.author.id]=structuredClone(defaultGuildUser);
    }

    // Filter edit handler
    if(storage[msg.guild.id]?.filter.active){
        let [filtered, filteredContent, foundWords] = checkDirty(msg.guildId, msg.content, true)

        if(filtered) {
            storage[msg.guild.id].users[msg.author.id].infractions++;
            if(storage[msg.guildId].filter.censor){
                msg.channel.send({content:`A post by <@${msg.author.id}> sent at <t:${Math.round(msg.createdTimestamp/1000)}:f> <t:${Math.round(msg.createdTimestamp/1000)}:R> has been deleted due to retroactively editing a blocked word into the message.`,allowedMentions:{parse:[]}});
            }
            msg.delete();
            if(storage[msg.author.id].config.dmOffenses&&!msg.author.bot){
                msg.author.send(limitLength(`Your message in **${msg.guild.name}** was deleted due to editing in the following word${foundWords.length>1?"s":""} that are in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.content.replaceAll("`","\\`")+"```":""}`)).catch(e=>{});
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                client.channels.cache.get(storage[msg.guildId].filter.channel).send(limitLength(`I have deleted a message from **${msg.author.username}** in <#${msg.channel.id}> for editing in the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.content.replaceAll("`","\\`")}\`\`\``));
            }
            
            return;
        }
    }

    // Emojiboard edit handlers??
    if(Object.keys(storage[msg.guild.id].emojiboards).length>0){
        Object.keys(storage[msg.guild.id].emojiboards).forEach(async emote=>{
            var emoji=storage[msg.guild.id].emojiboards[emote];
            if(emoji.isMute) return;
            if(emoji.posted.hasOwnProperty(msg.id)&&!emoji.posted[msg.id]?.startsWith("webhook")){
                var resp={files:[]};
                var replyBlip="";
                if(msg.type===19){
                    var rMsg=await msg.fetchReference();
                    replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_`;
                }
                msg.attachments.forEach((attached,i) => {
                    let url=attached.url.toLowerCase();
                    if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||emoji.messType==="0"){
                        resp.files.push(attached.url);
                    }
                });
                if(emote.includes(":")){
                    footer.iconURL=``;
                }
                resp.embeds=[new EmbedBuilder()
                    .setColor(0x006400)
                    .setTitle("(Jump to message)")
                    .setURL(`https://www.discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`)
                    .setAuthor({
                        name: `${msg.author?.globalName||msg.author?.username}`,
                        iconURL:msg.author?.displayAvatarURL(),
                        url:`https://discord.com/users/${msg.author?.id}`
                    })
                    .setDescription(`${replyBlip?`${replyBlip}\n`:""}${msg.content?msg.content:"⠀"}`)
                    .setTimestamp(new Date(msg.createdTimestamp))
                    .setFooter({
                        name:msg.channel.name
                    })
                    .setImage(msg.attachments.first()?msg.attachments.first().url:null)
                ];
                if(emoji.messType==="1"){
                    resp.content=getStarMsg(msg);
                }
                var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id]);
                c.edit(resp);
            }
        }); 
    }

    // Counting edit handlers...?? - TODO this needs to be ported to the new counting format
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        var num=msgO.content?.match(/^(\d|,)+(?:\b)/i);
        if(num!==null&&num!==undefined){
            if(+num[0]===storage[msg.guild.id].counting.nextNum-1){
                msg.channel.send(num[0]).then(m=>m.react("✅"));
            }
        }
    }
});

client.on("guildMemberAdd",async member=>{
    // Storage creators for new members... - TODO: can we handle this better? This is probably the most space in stewbot's database
    if(!storage.hasOwnProperty(member.guild.id)){
        storage[member.guild.id]=structuredClone(defaultGuild);
    }
    if(!storage[member.guild.id].users.hasOwnProperty(member.id)){
        storage[member.guild.id].users[member.id]=structuredClone(defaultGuildUser);
    }
    if(!storage.hasOwnProperty(member.id)){
        storage[member.id]=structuredClone(defaultUser);
    }

    storage[member.guild.id].users[member.id].inServer=true;

    // Auto join messages
    if(storage[member.guild.id].ajm.active){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
            storage[member.guild.id].ajm.dm=true;
        }
        if(storage[member.guild.id].ajm.message==="") storage[member.guild.id].ajm.message=defaultGuild.ajm.message;
        if(storage[member.guild.id].ajm.dm){
            try{
                
                member.send({embeds:[{
                    type: "rich",
                    title: member.guild.name,
                    description: storage[member.guild.id].ajm.message.replaceAll("${@USER}", `<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : '' }`),
                    color: 0x006400,
                    thumbnail: {
                        url: member.guild.iconURL(),
                        height: 0,
                        width: 0,
                    },
                    footer: {text:`This message was sent from ${member.guild.name}`},
                }]}).catch(e=>{});
            }catch(e){}
        }
        else{
            var resp={
                content:storage[member.guild.id].ajm.message.replaceAll("${@USER}",`<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : '' }`),
                username:member.guild.name,
                avatarURL:member.guild.iconURL()
            };
            var hook=await client.channels.cache.get(storage[member.guild.id].ajm.channel).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                hook.send(resp);
            }
            else{
                client.channels.cache.get(storage[member.guild.id].ajm.channel).createWebhook({
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
    if(storage[member.guild.id].stickyRoles){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            storage[member.guild.id].stickyRoles=false;
        }
        else{
            storage[member.guild.id].users[member.id].roles.forEach(role=>{
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
    if(addedStickyRoles===0&&storage[member.guild.id].autoJoinRoles){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            storage[member.guild.id].autoJoinRoles=[];
        }
        if(storage[member.guild.id].autoJoinRoles.length>0){
            storage[member.guild.id].autoJoinRoles.forEach(role=>{
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
    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.joining_and_leaving){
        client.channels.cache.get(storage[member.guild.id].logs.channel).send({content:`**<@${member.id}> (${member.user.username}) has joined the server.**`,allowedMentions:{parse:[]}});
    }
});

client.on("guildMemberRemove",async member=>{
    // Manage storage
    if(!storage.hasOwnProperty(member.guild.id)){
        storage[member.guild.id]=structuredClone(defaultGuild);
    }
    if(!storage[member.guild.id].users.hasOwnProperty(member.id)){
        storage[member.guild.id].users[member.id]=structuredClone(defaultGuildUser);
    }
    if(!storage.hasOwnProperty(member.id)){
        storage[member.id]=structuredClone(defaultUser);
    }

    // TODO - this can mess up logs if a user left while stewbot was offline... hmm... there's gotta be a better place we can put it
    storage[member.guild.id].users[member.id].roles=member.roles.cache.map(r=>r.id);
    storage[member.guild.id].users[member.id].inServer=false;
    
    // Logs
    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.joining_and_leaving){
        var bans=await member.guild.bans.fetch();
        var c=client.channels.cache.get(storage[member.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**<@${member.id}> (${member.user.username}) has ${bans.find(b=>b.user.id===member.id)?"been banned from":"left"} the server.**${bans.find(b=>b.user.id===member.id)?.reason!==undefined?`\n${bans.find(b=>b.user.id===member.id)?.reason}`:""}`,allowedMentions:{parse:[]}});
        }
        else{
            storage[member.guild.id].logs.active=false;
        }
    }

    // Auto Leave Messages
    if(storage[member.guild.id].alm?.active){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
            storage[member.guild.id].alm.active=false;
            return;
        }
        if(storage[member.guild.id].alm.message==="") storage[member.guild.id].alm.message=defaultGuild.alm.message;
        var resp={
            content:storage[member.guild.id].alm.message.replaceAll("${@USER}",`<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : '' }`),
            username:member.guild.name,
            avatarURL:member.guild.iconURL()
        };
        var hook=await client.channels.cache.get(storage[member.guild.id].alm.channel).fetchWebhooks();
        hook=hook.find(h=>h.token);
        if(hook){
            hook.send(resp);
        }
        else{
            client.channels.cache.get(storage[member.guild.id].alm.channel).createWebhook({
                name: config.name,
                avatar: config.pfp
            }).then(d=>{
                d.send(resp);
            });
        }
    }
});

//Strictly log-based events
client.on("channelDelete",async channel=>{
    if(!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        var c=channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Channel \`${channel.name}\` Deleted**`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("channelUpdate",async (channelO,channel)=>{
    if (!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        var diffs=[];
        var caredAboutDiffs=["name","nsfw","topic","parentId","rateLimitPerUser"];
        Object.keys(channelO).forEach(key=>{
            if(channelO[key]!==channel[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel);
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
                storage[channel.guild.id].logs.active=false;
            }
        }
    }
});
client.on("emojiCreate",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: created:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("emojiDelete",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: deleted.**`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("emojiUpdate",async (emojiO,emoji)=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emojiO.name}\`: is now :\`${emoji.name}\`:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            storage[emoji.guild.id].logs.active=false;
        }
    }
});
client.on("stickerCreate",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Sticker \`${sticker.name}\` created**\n- **Name**: ${sticker.name}\n- **Related Emoji**: ${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${sticker.description}`,stickers:[sticker]});
        }
        else{
            storage[sticker.guild.id].logs.active=false;
        }
    }
});
client.on("stickerDelete",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Sticker \`${sticker.name}\` Deleted**`);
        }
        else{
            storage[sticker.guild.id].logs.active=false;
        }
    }
});
client.on("stickerUpdate",async (stickerO,sticker)=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        let diffs=[];
        Object.keys(stickerO).forEach(key=>{
            if(stickerO[key]!==sticker.key){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                c.send({content:`**Sticker Edited**\n- **Name**: ${diffs.includes("name")?`${stickerO.name} -> `:""}${sticker.name}\n- **Related Emoji**: ${diffs.includes("tags")?`${/^\d{19}$/.test(stickerO.tags)?`<:${client.emojis.cache.get(stickerO.tags).name}:${stickerO.tags}>`:stickerO.tags} -> `:""}${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${diffs.includes("description")?`${stickerO.description} -> `:""}${sticker.description}`,stickers:[sticker]});
            }
            else{
                storage[sticker.guild.id].logs.active=false;
            }
        }
    }
});
client.on("inviteCreate",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        var c=invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Created**\n- Code: ${invite.code}\n- Created by <@${invite.inviterId}>\n- Channel: <#${invite.channelId}>${invite._expiresTimestamp?`\n- Expires <t:${Math.round(invite._expiresTimestamp/1000)}:R>`:``}\n- Max uses: ${invite.maxUses>0?invite.maxUses:"Infinite"}`,allowedMentions:{parse:[]}});
        }
        else{
            storage[invite.guild.id].logs.active=false;
        }
    }
});
client.on("inviteDelete",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        var c=invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Deleted**`,allowedMentions:{parse:[]}});
        }
        else{
            storage[invite.guild.id].logs.active=false;
        }
    }
});
client.on("roleCreate",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Role <@&${role.id}> created**`,allowedMentions:{parse:[]}});
        }
        else{
            storage[role.guild.id].logs.active=false;
        }
    }
});
client.on("roleDelete",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Role \`${role.name}\` Deleted**`);
        }
        else{
            storage[role.guild.id].logs.active=false;
        }
    }
});
client.on("roleUpdate",async (roleO,role)=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var diffs=[];
        var caredAboutDiffs=["name","hoist","mentionable","color"];
        Object.keys(roleO).forEach(key=>{
            if(roleO[key]!==role[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
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
            else{
                storage[role.guild.id].logs.active=false;
            }
        }
    }
});
client.on("userUpdate",async (userO, user)=>{
    var diffs=[];
    var caredAboutDiffs=["username","globalName","avatar","banner"];
    Object.keys(userO).forEach(key=>{
        if(userO[key]!==user[key]&&caredAboutDiffs.includes(key)){
            diffs.push(key);
        }
    });
    Object.keys(storage).forEach(entry=>{
        if(storage[entry]?.users?.[user.id]?.inServer&&storage[entry].logs.active&&storage[entry].logs.user_change_events){
            var c=client.channels.cache.get(storage[entry].logs.channel);
            if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[];
                if(diffs.includes("avatar")){
                    flds.push({
                        "name": `Avatar`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                if(diffs.includes("banner")){
                    flds.push({
                        "name": `Banner`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                if (diffs.length == 0) return;
                c.send({content:`**User <@${user.id}> Edited Globally**`,embeds:[{
                        "type": "rich",
                        "title": `${diffs.includes("globalName")?`${userO.globalName} -> `:""}${user.globalName}`,
                        "description": `${diffs.includes("username")?`${userO.username} -> `:""}${user.username}`,
                        "color": user.accentColor===undefined?0x006400:user.accentColor,
                        "fields": flds,
                        "thumbnail": {
                            "url": user.displayAvatarURL(),
                            "height": 0,
                            "width": 0
                        },
                        "url":`https://discord.com/users/${user.id}`
                    }],allowedMentions:{parse:[]}});
            }
            else{
                storage[entry].logs.active=false;
            }
        }
    });
});
client.on("guildMemberUpdate",async (memberO,member)=>{
    if(storage[member.guild.id]?.logs.active&&storage[member.guild.id]?.logs.user_change_events){
        var diffs=[];
        var caredAboutDiffs=["nickname","avatar"];
        Object.keys(memberO).forEach(key=>{
            if(memberO[key]!==member[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=client.channels.cache.get(storage[member.guild.id].logs.channel);
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
                storage[member.guild.id].logs.active=false;
            }
        }
    }
});

// Bot events for staff notifications
client.on("rateLimit",async d=>{
    notify("Ratelimited -\n\n"+d);
});
client.on("error",async e=>{
    notify("Client emitted error:\n\n"+e.stack);
});
client.on("guildCreate",async guild=>{
    storage[guild.id]=structuredClone(defaultGuild);
    notify(`Added to **a new server**!`);
    await sendWelcome(guild);
});
client.on("guildDelete",async guild=>{
    delete storage[guild.id];
    notify(`Removed from **a server**.`);
});
//#endregion Listeners

//Error handling
process.on('unhandledRejection', e=>notify(e.stack));
process.on('unhandledException', e=>notify(e.stack));
process.on('uncaughtException', e=>notify(e.stack));
process.on('uncaughtRejection', e=>notify(e.stack));

//Begin
if (mongoDB) {
    // If using Mongo, we'll async wait for it to connect before logging in
    (async () => {
        // The database module sets up everything as needed
        console.beta("Connecting to database")
        await import('./Scripts/database.mjs');
        
        console.beta("Logging in")
        client.login(process.env.token);
    })();
}
else client.login(process.env.token);
