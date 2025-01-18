// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("auto_roles").setDescription("Setup a message with auto roles").addStringOption(option=>
				option.setName("message").setDescription("The message to be sent with the role options").setRequired(true)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["presets"],

		deferEphemeral: true,

		help: {
			helpCategories: ["General","Administration","Configuration","Server Only"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Setup a message with auto roles",
			detailedDesc: 
				`In the channel this command is used in, Stewbot will post a configurable message with buttons to add and remove the selected roles from themselves. Start by using the command with the message, and then Stewbot will prompt for the roles.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto roles.`);
			return;
		}
		cmd.followUp({"content":`${checkDirty(config.homeServer,cmd.options.getString("message"),true)[1]}`,"ephemeral":true,"components":[presets.rolesCreation]});
	}
};
