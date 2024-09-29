// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: null,

	detailedHelp() {
		return false;
	},

	requestGlobals() {
		return ["parseEmoji", "getEmojiFromMessage"]
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
		if(cmd.options.getBoolean("active")!==null) storage[cmd.guildId].emojiboards[emoji].active=cmd.options.getBoolean("active");
		if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].emojiboards[emoji].channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getInteger("threshold")!==null) storage[cmd.guildId].emojiboards[emoji].threshold=cmd.options.getInteger("threshold");
		if(cmd.options.getString("message_type")!==null) storage[cmd.guildId].emojiboards[emoji].messType=cmd.options.getString("message_type");
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji edited.");
	}
};
