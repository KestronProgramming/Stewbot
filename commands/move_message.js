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
		command: new ContextMenuCommandBuilder().setName("move_message").setType(ApplicationCommandType.Message),

		// Optional fields

		extra: {
			"contexts": [0], "integration_types": [0],
			"desc": "Move a message from one channel into another"
		},

		requiredGlobals: ["presets"],

		deferEphemeral: true,

		help: {
			helpCategories: ["Administration","Server Only","Context Menu"],
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
			shortDesc: "Move a message from one channel into another",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This command will have Stewbot take a message and move it to a different channel. This command is accessed from the context menu, which on mobile is accessed by holding down on a message or on desktop by right clicking, and then pressing "Apps".`
		},
	},

	async execute(cmd, context) {
		applyContext(context);

		if (!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
			cmd.followUp("I do not have the MANAGE_WEBHOOKS permission, so I cannot move this message.").
				return;
		}
		if (cmd.member.permissions.has(PermissionFlagsBits.ManageMessages) || cmd.user.id === cmd.targetMessage.author.id) {
			cmd.followUp({ "content": `Where do you want to move message \`${cmd.targetMessage.id}\` by **${cmd.targetMessage.author.username}**?`, "ephemeral": true, "components": [presets.moveMessage] });
		}
		else {
			cmd.followUp(`To use this command, you need to either be the one to have sent the message, or be a moderator with the MANAGE MESSAGES permission.`);
		}
	}
};
