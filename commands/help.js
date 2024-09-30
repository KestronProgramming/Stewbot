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
		command: new SlashCommandBuilder().setName("help").setDescription("View the help menu")
			.addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["helpPages", "config"],

		help: {
			helpCategory: "General",
			helpDesc: "This help menu",
			helpSortPriority: 0 // This needs to be fixed at the very first index of the help
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({
			content: `**General**`, embeds: [{
				"type": "rich",
				"title": `General`,
				"description": `Help Menu General Category`,
				"color": 0x006400,
				"fields": helpPages[0].commands.map(a => {
					return {
						"name": String(a.name).substring(0, 256),
						"value": a.desc,
						"inline": true
					};
				}),
				"thumbnail": {
					"url": config.pfp,
					"height": 0,
					"width": 0
				},
				"footer": {
					"text": `Help Menu for Stewbot`
				}
			}], 
			components: [new ActionRowBuilder().addComponents(...helpPages.map(a =>
					new ButtonBuilder().setCustomId(`switch-${a.name}`).setLabel(a.name).setStyle(ButtonStyle.Primary)
				))]
		});
	}
};
