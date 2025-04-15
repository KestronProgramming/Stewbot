// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('birthday-config').setDescription('Configure how birthdays are handled in this server').addSubcommand(command=>
            command.setName("channel_config").setDescription("Setup a channel for notifications on people's birthdays").addChannelOption(option=>
                    option.setName("channel").setDescription("The channel to post birthday notifications into").addChannelTypes(ChannelType.GuildText).setRequired(true)
                ).addBooleanOption(option=>
                    option.setName("active").setDescription("Should I be running the birthday notifications?").setRequired(true)
                ).addStringOption(option=>
                    option.setName("message_with_year").setDescription("The message to post if year is public (Use ${PING} or ${USERNAME} to put the user's name)")
                ).addStringOption(option=>
                    option.setName("message_without_year").setDescription("The message to post if year is private (Use ${PING} or ${USERNAME} to put the user's name)")
                ).addRoleOption(option=>
                    option.setName("role").setDescription("A role to be applied only for the duration of this user's birthday")
                ).addBooleanOption(option=>
                    option.setName("disable-roles").setDescription("Disable the role applied for this user's birthday?")
                ).addBooleanOption(option=>
                    option.setName("fun_holidays").setDescription("Add some fun lesser-known holidays corresponding with that day")
                ).addBooleanOption(option=>
                    option.setName("this_day_in_history").setDescription("Add a \"This Day In History\" fun fact?")
                ).addBooleanOption(option=>
                    option.setName("florida-man").setDescription("Add a \"Florida Man\" news headline game?")
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
                )
            ).addSubcommand(command=>
                command.setName("role-config").setDescription("Set roles for users under or over a specific age").addRoleOption(option=>
                    option.setName("role").setDescription("The role to configure").setRequired(true)
                ).addIntegerOption(option=>
                    option.setName("must_be_over").setDescription("Only apply this role to users who are over X age (13 for no limit)").setMinValue(13).setMaxValue(120)//We refuse to process users who try to set their year for 13 or younger
                ).addIntegerOption(option=>
                    option.setName("must_be_under").setDescription("Only apply this role to users who are under X age (120 for no limit)").setMinValue(14).setMaxValue(120)//There's no point in processing an under age at 13, nobody will ever hit it, so we make the min 14.
                ).addBooleanOption(option=>
                    option.setName("clear").setDescription("Remove this role from birthday checks")
                )
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
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

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.guild.id].hasOwnProperty("birthday")){
            storage[cmd.user.id].birthday=structuredClone(defaultUser.birthday);
        }
        switch(cmd.options.getSubcommand()){
            case "channel_config":
                /*
                addStringOption(option=>
                    option.setName("message").setDescription("The message to post (Use ${PING} or ${USERNAME} to put the user's name)")
                ).addRoleOption(option=>
                    option.setName("role").setDescription("A role to be applied only for the duration of this user's birthday")
                ).addBooleanOption(option=>
                    option.setName("disable-roles").setDescription("Disable the role applied for this user's birthday?")
                ).addBooleanOption(option=>
                    option.setName("fun_holidays").setDescription("Add some fun lesser-known holidays corresponding with that day")
                ).addBooleanOption(option=>
                    option.setName("this_day_in_history").setDescription("Add a \"This Day In History\" fun fact?")
                ).addBooleanOption(option=>
                    option.setName("florida-man").setDescription("Add a \"Florida Man\" news headline game?")
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
                )
                */
                storage[cmd.guild.id].channel.id=cmd.options.getChannel("channel").id;
                storage[cmd.guild.id].channel.active=cmd.options.getBoolean("active");
                if(cmd.options.getString("message_with_year")!==null) storage[cmd.guild.id].channel.message=cmd.options.getString("message");
                if(cmd.options.getString("message_without_year")!==null) storage[cmd.guild.id].channel.message=cmd.options.getString("message");
            break;
            case "role_config":
                /*
                    Allow a role to be added to all users over or under X age. These do require the year to be publicized still. (Can age restrict certain channels with more flexibility than "Be 18")
                */
                
            break;
        }
	}
};
