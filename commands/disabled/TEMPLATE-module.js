// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

// 
// TEMPLATE-module.js is a minimal template for modules that do not have attached commands.
// 	These can be message handlers like ~sudo, etc
// 

module.exports = {
	data: {
		command: null,

		// A priority calling system for handlers like onmessage, only use when required. Smaller = loaded sooner, default = 100
		// priority: 100,

		// Not all modules will have help commands, but they can in theory to showcase bot features.
		help: {
			helpCategories: ["Module"],
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
				- Safety -> Anti-hack, anti-spam, etc
				- Module -> Automatic bot action not triggered or configured by a slash command
			*/
			shortDesc: "Jerry Jerry Jerry Jerry Yeah!!!",
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Jerry the Rope!\n
				Jerry brings hope.\n
				Jerry's never tied up\n
				Jerry helps you in your 'trub\n
				Yeah! Jerry!`,

			// If this module can't be blocked, specify a reason
			// block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",

		},
	},

	async onmessage(msg, context) {
		applyContext(context);
		// `context` currently does not respect requested globals
	},

	async daily(context) {
		applyContext(context);
		
	}
};
