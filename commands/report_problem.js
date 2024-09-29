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
		command: new SlashCommandBuilder().setName("report_problem").setDescription("Report an error to be looked at")
			.addStringOption(option=>
				option.setName("type").setDescription("What kind of problem are you reporting?").addChoices(
					{"name":"Profanity","value":"profanity"},
					{"name":"Controversial","value":"controversy"},
					{"name":"Bug or Error","value":"bug"},
					{"name":"Suggestion","value":"suggestion"},
					{"name":"Exploit","value":"exploit"},
					{"name":"Other","value":"other"}
				).setRequired(true)
			).addStringOption(option=>
				option.setName("details").setDescription("Can you please provide us some details?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["escapeBackticks"],

		help: {
			helpCategory: "General",
			helpDesc: "If anything goes wrong with the bot, an error, profanity, exploit, or even just a suggestion, use this command",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		notify(1,`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${escapeBackticks(cmd.options.getString("details"))}\`\`\``);
        cmd.followUp({content:"I have reported the issue. Thank you.",ephemeral:true});
	}
};
