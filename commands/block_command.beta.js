// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate
const Fuse = require('fuse.js');
const fuseOptions = {
    includeScore: true,
    keys: ['item']
};

let cmdPathCache = null; // TODO: change when cmds change... a cleaner method of doing this would be nice probably...?
function getCommandPaths(cmds) {
    // This will be called a lot by autocomplete, so caching it for now. Might find a better way to do this later on.
    if (cmdPathCache) return cmdPathCache;
    const commandPaths = [];
    for (let commandKey in cmds) {
        commandPaths.push("/"+commandKey);
        // Collect subcommands
        for (let subcommandName in cmds?.[commandKey]) {
            // Some properties here are not subcommands so we verify by checking if it has a .mention property
            let subcommand = cmds?.[commandKey]?.[subcommandName];
            if (subcommand?.mention) {
                const subcommandPath = "/" + commandKey + " " + subcommandName
                commandPaths.push(subcommandPath)
            }
        }
    }
    cmdPathCache = commandPaths;
    return commandPaths;
}

function getCommandFromPath(cmdPath) {
    var [commandName, subcommandName] = cmdPath.split(" ");
    var command = cmds[commandName.substring(1)];
    if (subcommandName) {
        command = command[subcommandName];
    }
    return command;
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder()
					.setName('block_command')
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

		requiredGlobals: [],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },		
	},

	async execute(cmd, context) {
		applyContext(context);
        const allCommands = getCommandPaths(cmds);
        const commandToBlock = cmd.options.getString("command")
        const unblock = cmd.options.getBoolean("unblock")

        if (!allCommands.includes(commandToBlock)) {
            return cmd.followUp("That doesn't appear to be a valid command. Please check the formatting or use the autocompletes.")
        }

        if (commandToBlock == "/block_command") {
            return cmd.followUp("To avoid ripping a wormhole through the fabric of time and reality, I cannot comply with that request.")
        }

        // Create block list if it doesn't exist
        storage[cmd.guild.id].blockedCommands = storage[cmd.guild.id].blockedCommands || []

        const index = storage[cmd.guild.id].blockedCommands.indexOf(commandToBlock);
        const isBlocked = index !== -1;
        if (!unblock) {
            if (isBlocked) {
                return cmd.followUp(`${getCommandFromPath(commandToBlock).mention} is already blocked.`)
            } else {
                // Add to block list
                storage[cmd.guild.id].blockedCommands.push(commandToBlock);
                return cmd.followUp(`${getCommandFromPath(commandToBlock).mention} has been blocked in this server.`)
            }
        } else {
            // Remove from block list
            if (isBlocked) {
                storage[cmd.guild.id].blockedCommands.splice(index, 1);
                return cmd.followUp(`${getCommandFromPath(commandToBlock).mention} has been unblocked for this server.`)
            } else {
                return cmd.followUp(`${getCommandFromPath(commandToBlock).mention} does not seem to be blocked in this server.`)
            }
        }

        debugger
		// This code is called oh the slash command
	},

	async autocomplete(cmd) {
		let   allCommands = getCommandPaths(cmds);
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

        cmd.respond(autocompletes);
	}
};

