// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('wotd').setDescription('Play a word of the day game reminiscent of Wordle').addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),
		
		// Optional fields
		
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: [],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`# WOTD Game${"\n` ` ` ` ` ` ` ` ` `".repeat(6)}\nQ W E R T Y U I O P\nA S D F G H J K L\nZ X C V B N M`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
	}
};
