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
		command: new SlashCommandBuilder().setName("links").setDescription("Get a list of links relevant for the bot")
			.addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			"helpCategory":"General",
			"helpDesc":"Every single link you may need for the bot"
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp(
			`Here is a list of links in relation with this bot you may find useful.\n` +
			`- [Stewbot's Website](<https://stewbot.kestron.software/>)\n` +
			`- [Stewbot's Invite Link](<https://discord.com/oauth2/authorize?client_id=966167746243076136>)\n` +
			`- [Support Server](<https://discord.gg/k3yVkrrvez>)\n` +
			`- [Stewbot's Source Code on Github](<https://github.com/KestronProgramming/Stewbot>)\n` +
			`- [The Developer](<https://discord.com/users/949401296404905995>)\n` +
			`- [The Developer's Website](<https://kestron.software/>)`
		);
	}
};
