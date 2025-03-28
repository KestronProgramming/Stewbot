// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("links").setDescription("Get a list of links relevant for the bot")
			.addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: ["General","Bot","Information"],			shortDesc: "Get a list of links relevant for the bot",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This command provides a list of different links that you may find useful for learning more about the bot.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp(
			`Here is a list of links in relation with this bot you may find useful.\n` +
			`- [Stewbot's Website](<https://stewbot.kestron.software/>)\n` +
			`- [Stewbot's Invite Link](<${config.install}>)\n` +
			`- [Support Server](<https://discord.gg/k3yVkrrvez>)\n` +
			`- [Stewbot's Source Code on Github](<https://github.com/KestronProgramming/Stewbot>)\n` +
			`- [Donate](<https://stewbot.kestron.software/donate>)`
		);
	}
};
