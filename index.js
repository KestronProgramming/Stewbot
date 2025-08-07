// Stewbot main file.
// This file imports everything, dispatches events to the files they need to go to, and handles overall bot logic.

const bootedAt = Date.now();

//#region Startup
// Load envs and prepare for benchmarked boot.
const envs = require('./env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );
if (process.env.beta == 'false') delete process.env.beta; // ENVs are all strings, so make it falsy if it's "false"

console.beta = (...args) => process.env.beta && console.log(...args);

const cmds = global.cmds = require("./data/commands.json");
const config = global.config = require("./data/config.json");
console.beta("Importing discord");
const { Client, Events, GatewayIntentBits, Partials, PermissionFlagsBits, Message } = require("discord.js");
console.beta("Importing commands");
const { getCommands } = require("./Scripts/launchCommands.js"); // Note: current setup requires this to be before the commands.json import (the cmd.globals setting)
const commandsLoadedPromise = getCommands();
console.beta("Importing backup.js");
const { startBackupThreadPromise, checkForMongoRestore } = require("./backup.js");
console.beta("Importing everything else");
const fs = require("fs");
const mongoose = require("mongoose");
const ms = require("ms");
const { messageDataCache, guildByID, guildByObj, userByID, userByObj, Guilds, Users, GuildUsers, ConfigDB, guildUserByID, guildUserByObj } = require('./commands/modules/database');
const { notify } = require("./utils");
console.beta("Importing InfluxDB");
const { initInflux, queueCommandMetric } = require('./commands/modules/metrics')
initInflux()

// Typedefs for DB
/**
 * @typedef {import("./commands/modules/database").GuildDoc} GuildDoc
 * @typedef {import("./commands/modules/database").RawGuildDoc} RawGuildDoc
 * @typedef {import("./commands/modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./commands/modules/database").RawGuildUserDoc} RawGuildUserDoc
 * @typedef {import("./commands/modules/database").UserDoc} UserDoc
 * @typedef {import("./commands/modules/database").RawUserDoc} RawUserDoc
 */

const DBConnectPromise = new Promise((resolve, reject) => {
    // Start the to the DB connection now, so it runs in the background and is ready later
    checkForMongoRestore().finally(_ => {
        mongoose.connect(`${process.env.databaseURI}/${process.env.beta ? "stewbeta" : "stewbot"}`)
        resolve();
    })
})

const { updateBlocklists } = require("./commands/badware_scanner.js")
const { scheduleTodaysSlowmode } = require("./commands/slowmode.js")
const { scheduleTodaysTemproles } = require("./commands/temp_role.js")
const { resetHatScheduleLocks, scheduleTodaysHats } = require("./commands/hat_pull.js")
const { scheduleTodaysUnbans } = require("./commands/ban.js")
const { scheduleTimerEnds } = require("./commands/timer.js")
const { killMaintenanceBot } = require("./commands/restart.js")
const { isModuleBlocked } = require("./commands/block_module.js")
const { setUptime } = require("./commands/ping.js")

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

let commands = { }
let dailyListenerModules  = { };
let buttonListenerModules = { };

// Register listeners
commandsLoadedPromise.then( commandsLoaded => {
    // This code registers all requested listeners
    // This method allows any event type to be easily added to a command file

    // The functions `onbutton` and `autocomplete` are both still available for convenience.

    // Save commands
    commands = Object.freeze(commandsLoaded);

    // Load some custom listener functions
    dailyListenerModules = getSubscribedCommands(commands, "daily");
    buttonListenerModules = getSubscribedCommands(commands, "onbutton");

    // Some handlers have extra args injected into them for optimization / ease of use.
    let argInjectors = {
        // MessageCreate is a high-traffic handler, we inject database lookups here so that each handler
        //   doesn't need waste power preforming duplicate lookups.
        [Events.MessageCreate]: async (...args) => {
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(args[0]);
            return [ ...args, pseudoGlobals, readGuild, readGuildUser ]
        },

        [Events.MessageUpdate]: async (...args) => {
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(args[0]);
            return [ ...args, readGuild, readGuildUser ]
        },

        [Events.MessageDelete]: async (...args) => {
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(args[0]);
            return [ ...args, readGuild, readGuildUser ]
        },

        [Events.MessageReactionAdd]: async (...args) => {
            let [ react, user ] = args;

            // Resolve partials so we always have full data
            await Promise.all([
                react.partial ? react.fetch() : null,
                react.message?.partial ? react.message.fetch().catch(e => null) : null
            ]);

            const [readGuildUser, readGuild, readHomeGuild] = await getReadOnlyDBs({
                guildId: args[0].message.guild?.id,
                userId: args[1].id
            });
            return [ ...args, readGuild, readGuildUser ]
        },

        [Events.GuildMemberAdd]: async (...args) => {
            let [ member ] = args;
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs({
                guildId: args[0].guild?.id,
                userId: args[0].id
            });
            return [...args, readGuild]
        },

        [Events.GuildMemberRemove]: async (...args) => {
            let [ member ] = args;
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs({
                guildId: args[0].guild?.id,
                userId: args[0].id
            });
            return [...args, readGuild]
        }
    }

    let commandsArray = Object.values(commands)
        .sort((a, b) => {
            if (a.priority === undefined) return 1;
            if (b.priority === undefined) return -1;
            return a.priority - b.priority;
        });  // Lower priority = executed first.

    // Interceptors are used to stop other modules from handling events, particularly by block_module
    let interceptors = commandsArray
        .map(command => command.eventInterceptors)
        .filter(Boolean);

    // Tune global handling - most of this is for backwards code compatibility.
    interceptors.push({
        // Ignore bots on MessageCreate
        [Events.MessageCreate]: (handler, ...args) => (args[0].author.id === client.user?.id)
    })

    for (const listenerName of Object.values(Events)) { // For every type of discord event

        const listeningCommands = Object.freeze(
            commandsArray.filter(command => command[listenerName]) // Get listening functions
        )
        if (!listeningCommands.length) continue;

        client.on(listenerName, async (...args) => {
            
            // Modify args if needed for this type
            const argInjector = argInjectors[listenerName];
            if (argInjector) args = await argInjector(...args);

            for (const command of listeningCommands) {
                let handler = command[listenerName];

                // Run interceptors (block_module)
                for (const interceptor of interceptors) {
                    if (interceptor[listenerName] && interceptor[listenerName](command, ...args)) return;
                };
                
                let promise = handler(...args);
                
                // If a specific execution order is requested, wait for it to finish.
                if ("priority" in command) await promise;
            }
        })
    }
});


// Log in with all intents expect guild presence
const client = global.client = new Client({
    intents: Object.values(GatewayIntentBits)
        .filter(i => typeof(i) == 'number')
        .filter(i => i !== GatewayIntentBits.GuildPresences),
    partials: Object.keys(Partials).map(a => Partials[a])
});

// Build dynamic help pages
let helpCommands=[];
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
const pseudoGlobals = { config };
//#endregion Setup

//#region Functions

/** 
 * Database lookup for high-traffic events (messageCreate, messageUpdate, etc) - TODO_DB: (look into) guild profile changes?
 * @returns {Promise<[RawGuildUserDoc|undefined, RawGuildDoc|undefined, RawGuildDoc|undefined]>} Array of read only DBs.
 * @param int Either an object with 'guildId' and 'userId' props, or a message object.  
 * */
async function getReadOnlyDBs(int, createGuildUser=true) {
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
    else if (typeof(int) == "object") {
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
                (createGuildUser ? { inServer: true } : { }), // set inServer since we're fetching them
                { new: true, setDefaultsOnInsert: false, upsert: true }
            ).lean({ virtuals: true }).then(data => {
                messageDataCache.set(guildUserKey, data);
                return data;
            }),
            
            // Get guild
            messageDataCache.get(guildKey) || Guilds.findOneAndUpdate(
                { id: guildId },
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
                                "name":`${cmds.emojiboard.add.mention}`,
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

//#endregion Functions

//#region Listeners
//Actionable events
client.once(Events.ClientReady,async ()=>{
    killMaintenanceBot();
    
    // Once backup.js fully imports, start the backup thread
    startBackupThreadPromise.then( startBackupThread => {
        startBackupThread( ms("1h") , error => {
            notify(String(error));
        })
    })

    let bootMOTD = ``;

    // Determine uptime
    const bootedAtTimestamp = `<t:${Math.round(Date.now()/1000)}:R>`

    const config = await ConfigDB.findOne();

    if (config) {
        const rebootIntentional = Date.now() - config.restartedAt < ms("30s");
        if (rebootIntentional) {
            // The reboot was intentional
            setUptime(Math.round(config.restartedAt/1000));
            bootMOTD += `Bot resumed after restart ${bootedAtTimestamp}`;
        } else {
            // The reboot was accidental, so reset our bootedAt time
            config.bootedAt = Date.now();
            setUptime(Math.round(Date.now()/1000));
            bootMOTD += `Started at ${bootedAtTimestamp}`;
            config.save();
        }
    }

    // Add boot time
    bootMOTD += ` | Booting took ${Date.now()-bootedAt}ms`;
    notify(bootMOTD);

    console.beta(`Logged into ${client.user.tag}`);
    
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

client.on(Events.MessageCreate ,async msg => {
    if (msg.author.id === client.user.id) return;

    msg.guildId=msg.guildId||"0";

    if(msg.guild) {
        // Disable features in the server that the bot does not have permissions for.
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }
    
    // The sudo handler uses so many globals, it can stay in index.js for now
    if(msg.content.startsWith("~sudo ")&&!process.env.beta||msg.content.startsWith("~betaSudo ")&&process.env.beta){
        const devadminChannel = await client.channels.fetch(config.commandChannel);
        await devadminChannel.guild.members.fetch(msg.author.id);

        if(devadminChannel?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
            const config = await ConfigDB.findOne();
            const guild = await guildByObj(msg.guild);
            switch(msg.content.split(" ")[1].replaceAll(".","")){
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
            config?.save();
            guild.save()
        }
        else{
            msg.reply("I was unable to verify you.");
        }
        return;
    }
});

client.on(Events.InteractionCreate, async cmd=>{
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

client.on(Events.GuildMemberAdd, async member => {
    // Mark this user as in the server, if the user object exists already
    await GuildUsers.updateOne(
        { userId: member.user.id, guildId: member.guild.id },
        { $set: { inServer: true } },
        { upsert: false }
    );
});

client.on(Events.GuildMemberRemove, async member => {
    if (member.user.id == client.user.id) return;

    // Mark as not in the server
    GuildUsers.updateOne({
        userId: member.user.id,
        guildId: member.guild.id,
    }, {
        $set: { "inServer": false }
    })
});


// Bot events for staff notifications
client.on("rateLimit",async d=>{
    notify("Ratelimited -\n\n"+d);
});
client.on(Events.Error,async e=>{
    notify("Client emitted error:\n\n"+e.stack);
});
client.on(Events.GuildCreate,async guild=>{
    notify(`Added to **a new server**!`);
    await sendWelcome(guild);
});
client.on(Events.GuildDelete,async guild=>{
});
//#endregion Listeners

// Note:
// Other important logic handling database cleanup, general management, etc., is inside `./commands/core.js`

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
