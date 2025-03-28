// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("chronograph").setDescription("Start a stopwatch"),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["presets"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`**Chronograph**\n<t:${Math.round(Date.now()/1000)}:R>`, components:presets.chrono});
	}
};
