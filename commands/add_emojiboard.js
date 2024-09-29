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
		return ["parseEmoji"]
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
		storage[cmd.guildId].emojiboards[emoji] = {
			channel: cmd.options.getChannel("channel").id,
			active: true,
			threshold: cmd.options.getInteger("threshold") || 3,
			messType: cmd.options.getString("message_type"),
			posted: {},
			posters:{}
		};
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji added.");
    }
};
