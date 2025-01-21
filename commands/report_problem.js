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
		command: new SlashCommandBuilder().setName("report_problem").setDescription("Report an error with the bot to be reviewed")
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

		requiredGlobals: [],

		help: {
			helpCategories: ["Bot"],
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
			shortDesc: "Report an error with the bot to be reviewed",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`If some kind of issue appears with the bot of any kind and in any form, plesase run this command to report it to developers.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		notify(1,`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${escapeBackticks(cmd.options.getString("details"))}\`\`\``);
        cmd.followUp({content:"I have reported the issue. Thank you.",ephemeral:true});
	}
};
