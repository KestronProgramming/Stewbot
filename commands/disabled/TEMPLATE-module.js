// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
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

		// A priority calling system for handlers like MessageCreate, only use when required. Smaller = loaded sooner, default = 100
		// priority: 100,

		// Not all modules will have help commands, but they can in theory to showcase bot features.
		help: {
			helpCategories: [ Categories.Module ],
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

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {GuildUserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context) {
		applyContext(context);
		// `context` currently does not respect requested globals
	},

	async daily(context) {
		applyContext(context);
		
	}
};
