// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("prime_embed").setType(ApplicationCommandType.Message),

		// Optional fields

		extra: {
			"contexts": [0, 1, 2], "integration_types": [0, 1],
			"desc": "Get a message ready to be embedded using /embed_message"
		},

		requiredGlobals: ["getPrimedEmbed"],
	},

	async execute(cmd, context) {
		applyContext(context);

		storage[cmd.user.id].primedEmbed = {
			"content": cmd.targetMessage.content,
			"timestamp": cmd.targetMessage.createdTimestamp,
			"author": {
				"icon": cmd.targetMessage.author.displayAvatarURL(),
				"name": cmd.targetMessage.author.globalName || cmd.targetMessage.author.username,
				"id": cmd.targetMessage.author.id
			},
			"server": {
				"channelName": cmd.targetMessage.channel?.name ? cmd.targetMessage.channel.name : (cmd.targetMessage.author.globalName || cmd.targetMessage.author.username),
				"name": cmd.targetMessage.guild?.name ? cmd.targetMessage.guild.name : "",
				"channelId": cmd.targetMessage.channel?.id,
				"id": cmd.targetMessage.guild?.id ? cmd.targetMessage.guild.id : "@me",
				"icon": cmd.targetMessage.guild ? cmd.targetMessage.guild.iconURL() : cmd.targetMessage.author.displayAvatarURL()
			},
			"id": cmd.targetMessage.id,
			"attachmentURLs": []
		};
		cmd.targetMessage.attachments.forEach(a => {
			storage[cmd.user.id].primedEmbed.attachmentURLs.push(a.url);
		});
		cmd.followUp({ content: `I have prepared the message to be embedded. Use ${cmds.embed_message.mention} and type **PRIMED** to embed this message.`, embeds: [getPrimedEmbed(cmd.user.id)], files: storage[cmd.user.id].primedEmbed.attachmentURLs });


	}
};
