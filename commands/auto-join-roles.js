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
		command: new SlashCommandBuilder().setName("auto-join-roles").setDescription("Automatically add roles to a user when they join the server")
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["presets"],

		deferEphemeral: true,

		help: {
			helpCategories: ["Administration","Configuration","Server Only"],
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
			shortDesc: "Automatically add roles to a user when they join the server",
			detailedDesc: 
				`Configures a set of roles added to every user whenever they join the server. If you have sticky roles enabled, and the user has been in the server before, sticky roles will override any auto join roles.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto join roles.`);
			return;
		}
		cmd.followUp({"content":`Select all of the roles you'd like the user to have upon joining`,'ephemeral':true,"components":presets.autoJoinRoles});

	}
};
