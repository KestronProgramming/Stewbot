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
		command: new SlashCommandBuilder().setName("general_config").setDescription("Configure general behaviors")
			.addBooleanOption(option=>
				option.setName("embeds").setDescription("If a message link is posted, should I post a preview?")
			).addBooleanOption(option=>
				option.setName("disable_anti_hack").setDescription("Do you want to disable the anti hack/spam account protection for this server?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			"helpCategory": "General",
			"helpDesc": "Configure options for the whole server such as AI pings or embedding links"
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(cmd.options.getBoolean("embeds")!==null) storage[cmd.guildId].config.embedPreviews=cmd.options.getBoolean("embeds");
		if(cmd.options.getBoolean("disable_anti_hack")!==null) storage[cmd.guildId].disableAntiHack=cmd.options.getBoolean("disable_anti_hack");
		cmd.followUp("Configured your personal setup");
	}
};
