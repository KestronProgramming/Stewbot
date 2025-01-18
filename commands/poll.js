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
		command: new SlashCommandBuilder().setName("poll").setDescription("Make a poll with automatically tracked options").addStringOption(option=>
				option.setName("prompt").setDescription("The prompt (We'll set options in a minute)").setRequired(true)
			),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		deferEphemeral: true,

		requiredGlobals: ["presets"],

		help: {
			helpCategories: ["Entertainment","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Make a poll with automatically tracked options",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Posts a poll with an automatically updated pie chart representing the response density.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(checkDirty(cmd.guild?.id,cmd.options.getString("prompt"))){
			cmd.followUp({content:"This server doesn't want me to process that prompt.","ephemeral":true});
			return;
		}
		cmd.followUp({"content":`**${checkDirty(config.homeServer,cmd.options.getString("prompt"),true)[1]}**`,"ephemeral":true,"components":[presets.pollCreation]});
	}
};
