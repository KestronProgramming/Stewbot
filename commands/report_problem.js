// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
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
			helpCategories: [Categories.Bot],
			shortDesc: "Report an error with the bot to be reviewed",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`If some kind of issue appears with the bot of any kind and in any form, plesase run this command to report it to developers.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		notify(`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${escapeBackticks(cmd.options.getString("details"))}\`\`\``);
        cmd.followUp({content:"I have reported the issue. Thank you.",ephemeral:true});
	}
};
