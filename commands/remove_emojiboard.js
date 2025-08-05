// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { getEmojiFromMessage, parseEmoji } = require('../util');

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("remove_emojiboard").setDescription("Remove an emojiboard")
			.addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to remove the emojiboard for").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Entertainment, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Remove an emojiboard",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Choose an emojiboard that you would no longer like to have Stewbot manage and post for.`
		}
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		if (!cmd.guild) cmd.followUp("This command must be run in a server")
		applyContext(context);

		var emoji = getEmojiFromMessage(cmd.options.getString("emoji"));
		if(!emoji) {
			cmd.followUp("That emoji is not valid.");
			return;
		}
		
		const guild = await guildByObj(cmd.guild);

		if(!guild.emojiboards.has(emoji) || guild.emojiboards.get(emoji).isMute){
			cmd.followUp("That emoji is not in use for an emojiboard.");
			return;
		}

		guild.emojiboards.delete(emoji);
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji removed.");

		guild.save();
	}
};
