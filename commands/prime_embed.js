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

		deferEphemeral: true,
		
		help:{
			helpCategories: ["Information","General","Entertainment","Context Menu"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Get a message ready to be embedded with /embed_message",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`After using this command on a message, you can type PRIMED into ${cmds.embed_message.mention} to have the bot embed it. This can be used for DMs, or servers the bot doesn't share with you if you install it to use anywhere. (Press the bot's PFP, then select "Add App", and then "Use it Everywhere"). This is a context menu command, which can be accessed by holding down on a message on mobile, or right clicking on desktop, and then selecting "Apps".`
		}
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
