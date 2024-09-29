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
		command: new SlashCommandBuilder().setName("remove_emojiboard").setDescription("Remove an emojiboard")
			.addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to remove the emojiboard for").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		requiredGlobals: ["parseEmoji", "getEmojiFromMessage"],

		help: null
	},

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
		if(!(emoji in storage[cmd.guildId].emojiboards)) {
			cmd.followUp("That emoji is not in use for an emojiboard.");
			return;
		}
		delete storage[cmd.guildId].emojiboards[emoji];
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji removed.");
	}
};
