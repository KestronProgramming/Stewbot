const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
const { chmodSync } = require("fs");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('birthday-config').setDescription('Configure how birthdays are handled in this server').addSubcommand(command=>
            command.setName("channel_config").setDescription("Setup a channel for notifications on people's birthdays").addChannelOption(option=>
                    option.setName("channel").setDescription("The channel to post birthday notifications into").addChannelTypes(ChannelType.GuildText).setRequired(true)
                ).addStringOption(option=>
                    option.setName("message").setDescription("The message to post (Use ${PING} or ${USERNAME} to put the user's name)")
                ).addRoleOption(option=>
                    option.setName("role").setDescription("A role to be applied only for the duration of this user's birthday")
                ),addBooleanOption(option=>
                    option.setName("fun_holidays").setDescription("Add some fun lesser-known holidays corresponding with that day")
                ).addBooleanOption(option=>
                    option.setName("this_day_in_history").setDescription("Add a \"This Day In History\" fun fact?")
                ).addBooleanOption(option=>
                    option.setName("florida-man").setDescription("Add a \"Florida Man\" news headline game?")
                ).addBooleanOption(option=>
                    option.setName("disable").setDescription("Disable birthday notifications")
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
                )
            ).addSubcommand(command=>
                command.setName("role-config").setDescription("Set roles for users under or over a specific age")
            ),
		extra: {"contexts": [0], "integration_types": [0]},
        /*
            Contexts
             - 0: Server command
             - 1: Bot's DMs
             - 2: User command

            Integration Types:
             - 0: Installed to servers
             - 1: Installed to users
        */

		
		requiredGlobals: ["defaultUser"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.user.id].hasOwnProperty("birthday")){
            storage[cmd.user.id].birthday=structuredClone(defaultUser.birthday);
        }
        switch(cmd.options.getSubcommand()){
            case "channel_config":
                /*
                    Configure a message and channel to post "Happy Birthday" messages into. Allow for "Florida Man" and "This day in history" additions - other fun things of the sort if we can think of some
                */
            break;
            case "role_config":
                /*
                    Allow a role to be added to all users over or under X age, these roles ignore whether year was set to publicize but do not show the specific year. (Can age restrict certain channels with more flexibility than "Be 18")
                */
            break;
        }
	}
};
