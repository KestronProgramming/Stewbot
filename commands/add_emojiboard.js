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
		command: new SlashCommandBuilder().setName("add_emojiboard").setDescription("Create a new emojiboard")
			.addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to react with to trigger the emojiboard").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post the emojiboard in").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addIntegerOption(option=>
				option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)").setMinValue(1)
			).addStringOption(option=>
				option.setName("message_type").setDescription("What should the bot's starboard posts look like?").addChoices(
					{"name":"Make it look like the user posted","value":"0"},
					{"name":"Post an embed with the message and a greeting","value":"1"},
					{"name":"Post an embed with the message","value":"2"}
				)
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
