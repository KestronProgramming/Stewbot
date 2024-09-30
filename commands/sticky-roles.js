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
		command: new SlashCommandBuilder().setName("sticky-roles").setDescription("Add roles back to a user who left and rejoined")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Should I add roles back to users who left and rejoined?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: { 
			"helpCategory": "Administration", 
			"helpDesc": "Automatically reapply roles if a user leaves and then rejoins" 
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			storage[cmd.guildId].stickyRoles=false;
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run sticky roles.`);
			return;
		}
		storage[cmd.guildId].stickyRoles=cmd.options.getBoolean("active");
		cmd.followUp("Sticky roles configured. Please be aware I can only manage roles lower than my highest role in the server roles list.");
        
	}
};
