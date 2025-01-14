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
		command: new SlashCommandBuilder().setName("edit_emojiboard").setDescription("Configure an emojiboard for this server").addStringOption(option=>
				option.setName("emoji").setDescription("The emojiboard to edit").setRequired(true)
			).addBooleanOption(option=>
				option.setName("active").setDescription("Should I post messages to the configured channel?")
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post messages to (Required for first config)").addChannelTypes(ChannelType.GuildText)
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

		help: {
			helpCategories: ["Configuration","Entertainment","Server Only"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Configure an emojiboard for this server",
			detailedDesc: 
				`Change settings for a previously added emojiboard in this server`
		},
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
		if(!(emoji in storage[cmd.guildId].emojiboards)||storage[cmd.guildId].emojiboards[emoji]?.isMute){
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
