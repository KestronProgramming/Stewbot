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

		requiredGlobals: ["presets"],

		help: {
			helpCategory: "Entertainment",
			helpDesc: "Helps you to make and run a poll",
			// helpSortPriority: 1
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
