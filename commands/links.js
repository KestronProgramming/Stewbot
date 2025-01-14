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
			shortDesc: "Get a list of links relevant for the bot",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This command provides a list of different links that you may find useful for learning more about the bot.`
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
