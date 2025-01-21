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
		command: new SlashCommandBuilder().setName("general_config").setDescription("Configure general behaviours")
			.addBooleanOption(option=>
				option.setName("ai_pings").setDescription("Have the bot post an AI message when pinging it?")
			).addBooleanOption(option=>
				option.setName("embeds").setDescription("If a message link is posted, should I post a preview?")
			).addBooleanOption(option=>
				option.setName("disable_anti_hack").setDescription("Do you want to disable the anti hack/spam account protection for this server?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {helpCategories: ["General","Bot","Administration","Configuration","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Configure general behaviours for the bot",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure automatic actions the bot will take server wide, including whether Stewbot will automatically post embeds when it sees a message link, or if you want to disable Stewbot's automatic hacked/spam account protection.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(cmd.options.getBoolean("ai_pings")!==null) storage[cmd.guildId].config.ai=cmd.options.getBoolean("ai_pings");
		if(cmd.options.getBoolean("embeds")!==null) storage[cmd.guildId].config.embedPreviews=cmd.options.getBoolean("embeds");
		if(cmd.options.getBoolean("disable_anti_hack")!==null) storage[cmd.guildId].disableAntiHack=cmd.options.getBoolean("disable_anti_hack");
		
		cmd.followUp("Configured your server setup");
	}
};
