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

		requiredGlobals: ["helpPages", "config", "limitLength"],

		help: {
			helpCategories: ["General","Bot","Information"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "View this help menu",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Open this help menu and descriptions`
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
				"fields": helpPages[0].commands.slice(0, 25).map(a => {
					return {
						"name": limitLength(a.name, 256),
						"value": limitLength(a.desc, 1024),
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
