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
			helpCategories: [Categories.Configuration, Categories.Entertainment, Categories.Server_Only],
			shortDesc: "Configure an emojiboard for this server",
			detailedDesc: 
				`Change settings for a previously added emojiboard in this server`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
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
		
		if (cmd.options.getBoolean("active") !== null) guild.emojiboards.get(emoji).active = cmd.options.getBoolean("active");
		if (cmd.options.getChannel("channel") !== null) guild.emojiboards.get(emoji).channel = cmd.options.getChannel("channel").id;
		if (cmd.options.getInteger("threshold") !== null) guild.emojiboards.get(emoji).threshold = cmd.options.getInteger("threshold");
		if (cmd.options.getString("message_type") !== null) guild.emojiboards.get(emoji).messType = cmd.options.getString("message_type");
		
		await guild.save();
		await cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji edited.");
	}
};
