// Stewbot main file.
// This file dispatches events to the files they need to go to, 
//   connects to the database, and registers event handlers.
//
// Note:
// Other important logic handling database cleanup, 
//   general management, etc., is inside `./commands/core.js`


// === Load envs
const envs = require('./env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );
if (process.env.beta == 'false') delete process.env.beta; // ENVs are all strings, so make it falsy if it's "false"

// === Import everything
const cmds = global.cmds = require("./data/commands.json");
const config = global.config = require("./data/config.json");
console.log("Importing discord");
const client = require("./client.js");
const { Events, PermissionFlagsBits } = require("discord.js");
console.log("Importing commands");
const { getCommands } = require("./launchCommands.js"); // Note: current setup requires this to be before the commands.json import (the cmd.globals setting)
const commandsLoadedPromise = getCommands();
console.log("Importing backup.js");
console.log("Importing everything else");
const mongoose = require("mongoose");
const { guildByID, guildByObj } = require('./commands/modules/database');
const { notify, getReadOnlyDBs } = require("./utils");
const { checkForMongoRestore } = require("./backup.js");
const { isModuleBlocked } = require("./commands/block_module.js")
console.log("Importing InfluxDB");
const { initInflux, queueCommandMetric } = require('./commands/modules/metrics')
initInflux()



// === Register listeners
let commands = global.commands = { }
let dailyListenerModules  = { };
let buttonListenerModules = { };
const pseudoGlobals = { config }; // data that should be passed to each module
let commandListenerRegister = commandsLoadedPromise.then( commandsLoaded => {
    // This code registers all requested listeners
    // This method allows any event type to be easily added to a command file
    // The functions `onbutton` and `autocomplete` are both still available for convenience.

    // Save commands
    commands = global.commands = Object.freeze(commandsLoaded);

    // Utility for registering listeners
    function getSubscribedCommands(commands, subscription) {
        return Object.fromEntries(
            (Object.entries(commands)
                    .filter(([name, command]) => command[subscription]) // Get all subscribed modules
            ).sort((a, b) => (a[1].data?.priority ?? 100) - (b[1].data?.priority ?? 100))
        )
    }

    // Load some custom listener functions
    dailyListenerModules = getSubscribedCommands(commands, "daily");
    buttonListenerModules = getSubscribedCommands(commands, "onbutton");

    // Some handlers have extra args injected into them for optimization / ease of use.
    let argInjectors = {
        // MessageCreate is a high-traffic handler, we inject database lookups here so that each handler
        //   doesn't need waste power preforming duplicate lookups.
        [Events.MessageCreate]: async (...args) => {
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(args[0]);
            return [ ...args, pseudoGlobals, readGuild, readGuildUser, readHomeGuild ]
        },

        [Events.MessageUpdate]: async (...args) => {
            const [ readGuildUser, readGuild, readHomeGuild ] = await getReadOnlyDBs(args[0]);
            return [ ...args, readGuild, readGuildUser, readHomeGuild ]
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

        client.on(String(listenerName), async (...args) => {
            
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


// === Schedule `daily` execution
const daily = global.daily = function(dontLoop=false){
    if(!dontLoop) setInterval(()=> { daily(true) },60000*60*24);
    
    // Dispatch daily calls to all listening modules
    Object.values(dailyListenerModules).forEach(module => module.daily(pseudoGlobals))
}
client.once(Events.ClientReady, async () => {        
    var now=new Date();
    setTimeout(
        daily,
        // Schedule dailies to start at 11 AM (host device tz, UTC in this case) the next day
        // TODO: make this UTC
        ((now.getHours() > 11 ? 11 + 24 - now.getHours() : 11 - now.getHours()) * (60000 * 60)) + ((60 - now.getMinutes()) * 60000)
    );
});

// === Dispatch command execute / autocomplete / buttons where they need to go.
client.on(Events.InteractionCreate, async cmd=>{
    const asyncTasks = [ ]; // Any non-awaited functions go here to fully known when this command is done executing for metrics
    const intStartTime = Date.now();
    
    // @ts-ignore
    const commandScript = commands[cmd.commandName];
    if (!commandScript && (cmd.isCommand() || cmd.isAutocomplete())) return; // Ignore any potential cache issues 

    //// Manage deferring
    if(cmd.isChatInputCommand() || cmd.isMessageContextMenuCommand()) { 
        // Always obey the `private` property, if not defined default to the `deferEphemeral` property. 
        const private = cmd.isChatInputCommand() ? cmd.options.getBoolean("private") : null;
        await cmd.deferReply({
            ephemeral:
                private ?? commandScript?.data.deferEphemeral ?? false
        });
    }

    //// Autocomplete
    if (cmd.isAutocomplete()) {
        const providedGlobals = { ...pseudoGlobals };
        const requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            providedGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }

        asyncTasks.push(
            commands?.[cmd.commandName]?.autocomplete?.(cmd, providedGlobals)
        )
    }

    //// Slash commands
    if (
        (cmd.isChatInputCommand() || cmd.isMessageContextMenuCommand()) &&
        commands.hasOwnProperty(cmd.commandName)
    ) {
        // Here we artificially provide the full path since slash commands can have subcommands
        // @ts-ignore
        const listeningModule = [ `${cmd.commandName} ${
            cmd.isChatInputCommand()
                ? cmd.options.getSubcommand(false)
                : ""
        }`.trim(), commandScript ];
        
        // TODO_DB: this could be made more efficient by passing in the readonly guilds as objects
        const [ blocked, errorMsg ] = isModuleBlocked(listeningModule, 
            (await guildByObj(cmd.guild)), 
            (await guildByID(config.homeServer)),
            // @ts-ignore
            cmd.member?.permissions?.has?.(PermissionFlagsBits.Administrator)
        )
        if (blocked) return cmd.followUp(errorMsg);
        
        // Checks passed, gather requested data
        const providedGlobals = { ...pseudoGlobals };
        const requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
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
    // All of these get send to onButton. 
    if (cmd.isButton() || cmd.isModalSubmit() || cmd.isStringSelectMenu()) {
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
    }

    // Wait for everything to complete
    await Promise.allSettled(asyncTasks);
    const intEndTime = Date.now();

    if (cmd.isChatInputCommand()) queueCommandMetric(cmd.commandName || "unspecified", intEndTime - intStartTime);
});

// Don't crash on any type of error
// @ts-ignore
process.on('unhandledRejection', e => notify(e.stack));
process.on('uncaughtException', e => notify(e.stack));

async function start() {
    // Register all handlers to the client
    await commandListenerRegister;

    // Check if we're restoring from a backup checkpoint
    await checkForMongoRestore()

    // Connect to the db
    console.log("Connecting to database")
    await mongoose.connect(`${process.env.databaseURI}/${process.env.beta ? "stewbeta" : "stewbot"}`)
    
    // Login
    console.log("Logging in")
    await client.login(process.env.beta ? process.env.betaToken : process.env.token);
}
start();
