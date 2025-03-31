// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

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
		requiredGlobals: ["parseEmoji", "getEmojiFromMessage"],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Entertainment, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Remove an emojiboard",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Choose an emojiboard that you would no longer like to have Stewbot manage and post for.`
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.id){
			cmd.followUp("Something is wrong");
			return;
		}
		var emoji = getEmojiFromMessage(cmd.options.getString("emoji"));
		if(!emoji) {
			cmd.followUp("That emoji is not valid.");
			return;
		}
		if(!(emoji in storage[cmd.guildId].emojiboards)||storage[cmd.guildId].emojiboards[emoji]?.isMute){
			cmd.followUp("That emoji is not in use for an emojiboard.");
			return;
		}
		delete storage[cmd.guildId].emojiboards[emoji];
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji removed.");
	}
};
