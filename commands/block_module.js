// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate
const fs = require("node:fs")
const Fuse = require('fuse.js');
const fuseOptions = {
    includeScore: true,
    keys: ['item']
};

let cmdPathCache = null; // TODO: change when cmds change... a cleaner method of doing this would be nice probably...?
function getCommandPaths(cmds, includeAllModules) {
    // This will be called a lot by autocomplete, so caching it for now. Might find a better way to do this later on.
    if (cmdPathCache) return cmdPathCache;
    const commandPaths = [];
    for (let commandKey in cmds) {
        commandPaths.push(commandKey);
        // Collect subcommands
        for (let subcommandName in cmds?.[commandKey]) {
            // Some properties here are not subcommands so we verify by checking if it has a .mention property
            let subcommand = cmds?.[commandKey]?.[subcommandName];
            if (subcommand?.mention) {
                const subcommandPath = commandKey + " " + subcommandName
                commandPaths.push(subcommandPath)
            }
        }
    }

    // TODO: cleanup so that all of these load this way in the future, probably...
    // Load any other modules we haven't loaded yet, for example modules without a command attached
    if (includeAllModules) {
        const allModules = fs.readdirSync("./commands").filter(file => file.endsWith(".js")).map(file => file.slice(0, -3));
        for (const module of allModules) {
            if (!commandPaths.includes(module)) {
                commandPaths.push(module);
            }
        }
    }

    cmdPathCache = commandPaths;
    return commandPaths;
}

function getCommandFromPath(cmdPath) {
    var [commandName, subcommandName] = cmdPath.split(" ");
    var command = cmds[commandName];
    if (subcommandName) {
        command = command[subcommandName];
    }
    return command;
}

function getCommandBlockMessageFromPath(cmdPath) { // Subcommands make this hard to use the other function for
    var [commandName, subcommandName] = cmdPath.split(" ");
    var command = commands[commandName];
    let help = command?.data?.help;
    if (subcommandName) {
        help = help?.[subcommandName];
    }
    return help?.block_module_message;
}

function isModuleBlocked(listener, guild, globalGuild, isAdmin) {
    // returns: [ blocked, error ]
    // isadmin signifies whether this user has perms to unblock the server command block
    const [ name, module ] = listener;

    // Check if this command is blocked with /block_module
    const commandPath = `${module.data?.command?.name || name}`; //  handles non-command modules
        
    // If this is a guild, check for blocklist
    if (guild) {
        let guildBlocklist = guild.blockedCommands;
        guildBlocklist = guildBlocklist.map(blockCommand => blockCommand.replace(/^\//, '')) // Backwards compatibility with block_command which had a leading /
        if (guildBlocklist.includes(name) || guildBlocklist.includes(commandPath)) {
            let err = "This command has been blocked by this server.";
            if (isAdmin) err += `\nYou can use ${cmds.block_module.mention} to unblock it.`;
            return [ true, err ];
        }
    }

    // If given a guild blacklist
    if (globalGuild) {
        // Check global blacklist from home server - TODO more aggressive caching on this one
        const globalBlocklist = globalGuild.blockedCommands;
        if (globalBlocklist.includes(name) || globalBlocklist.includes(commandPath)) {
            return [ true, "This command has temporarily been blocked by Stewbot admins." ];
        }
    }

    return [ false ]
}

module.exports = {
    isModuleBlocked,
    // ExitHandlerStackCode,

	data: {
		// Slash command data
		command: new SlashCommandBuilder()
					.setName('block_module')
					.setDescription('Block bot commands and features from being used in this server')
                    .addStringOption(option=>
                        option.setName("command").setDescription("The command to block").setRequired(true)
                        .setAutocomplete(true)
                    ).addBooleanOption(option=>
                        option.setName("unblock").setDescription("Unblock this command instead?").setRequired(false)
                    ).addBooleanOption(option=>
                        option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                    )
                    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
                    //  ^ From my limited testing, "Administrator" is the only perm that lets you enable/disable bot commands

		requiredGlobals: ["commands"],

		help: {
			helpCategories: [Categories.Bot, Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Block bot commands and features from being used in this server",
			detailedDesc: 
				`Enter a command that you want to disable users from ever using in this server. If you set unblock to true, this command will unblock a command so that users may use it again.`,
            
            block_module_message: "I will be unable to unblock this command if you block it, therefore I cannot block this command."
        },		
	},

    // The event dispatcher calls these before dispatching events
    // block_module uses these to block disabled events.
    eventInterceptors: {
        [Events.MessageCreate]: (handler, ...args) => {
            const [ msg, context, guildStore, guildUserStore ] = args;
            const [ blocked, _ ] = isModuleBlocked(
                [handler.name, handler], 
                guildStore
            ) // TODO: pass global guild...

            return blocked;
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        const guild = await guildByObj(cmd.guild);

        const allCommands = getCommandPaths(cmds, true);
        const commandToBlock = cmd.options.getString("command")
        const unblock = cmd.options.getBoolean("unblock")

        if (!allCommands.includes(commandToBlock)) {
            return cmd.followUp("That doesn't appear to be a valid command. Please check the spelling or use the autocompletes.")
        }
        
        const blockModuleError = getCommandBlockMessageFromPath(commandToBlock);
        if (blockModuleError) {
            return cmd.followUp(blockModuleError);
        }

        const index = guild.blockedCommands.indexOf(commandToBlock);
        const isBlocked = index !== -1;
        const commandMention = getCommandFromPath(commandToBlock)?.mention || '`'+commandToBlock+'`';
        if (!unblock) {
            if (isBlocked) {
                return cmd.followUp(`${commandMention} is already blocked.`)
            } else {
                // Add to block list
                guild.blockedCommands.push(commandToBlock);
                cmd.followUp(`${commandMention} has been blocked in this server.`)
            }
        } else {
            // Remove from block list
            if (isBlocked) {
                guild.blockedCommands.splice(index, 1);
                cmd.followUp(`${commandMention} has been unblocked for this server.`)
            } else {
                return cmd.followUp(`${commandMention} does not seem to be blocked in this server.`)
            }
        }
        guild.save();
	},

	async autocomplete(cmd) {
		let   allCommands = getCommandPaths(cmds, true);
        const userInput = cmd.options.getFocused() || "";

        // Get the top matching results
        if (userInput) {
            const fuse = new Fuse(allCommands.map(item => ({ item })), fuseOptions);            
            const scoredResults = fuse.search(userInput)
                .filter(result => result.score <= 3.5) // Very roughly similar-ish
                .sort((a, b) => a.score - b.score);
            allCommands = scoredResults.map(entry => entry.item.item);
        }

        // Limit to discord max commands
        allCommands = allCommands.slice(0, 25)

        // Format for discord
        autocompletes = []
        for (let commandPath of allCommands) {
            autocompletes.push({
                name: commandPath,
                value: commandPath
            })
        }

        await cmd.respond(autocompletes);
	}
};

