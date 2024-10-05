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
		command: new SlashCommandBuilder().setName("translate").setDescription("Translate a string of text")
			.addStringOption(option=>
				option.setName("what").setDescription("What to translate").setRequired(true)
			).addStringOption(option=>
				option.setName("language_from").setDescription("The language the original text is in (Default: autodetect)")
			).addStringOption(option=>
				option.setName("language_to").setDescription("The language you want the text translated into (Default: en)")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["translate", "escapeBackticks"],

		help: {
			helpCategory: "Informational",
			helpDesc: "Translates a word or phrase",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		translate(cmd.options.getString("what"), 
			Object.assign({
				to: cmd.options.getString("language_to") || cmd.locale.slice(0, 2)
			},
			cmd.options.getString("language_from") ? cmd.options.getString("languageFrom") : {})
		).then(t => {
			if (checkDirty(cmd.guild?.id, t.text) || checkDirty(cmd.guild?.id, cmd.options.getString("what"))) {
				cmd.followUp({ content: `I have been asked not to translate that by this server`, ephemeral: true });
				return;
			}
			cmd.followUp(`Attempted to translate${t.text !== cmd.options.getString("what") ? `:\n\`\`\`\n${escapeBackticks(t.text)}\n\`\`\`\n-# If this is incorrect, try using ${cmds.translate.mention} again and specify more.` : `, but I was unable to. Try using ${cmds.translate.mention} again and specify more.`}`);
		});
	}
};
