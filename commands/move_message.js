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

		help: {
			"helpCategory": "Administration",
			"helpDesc": "Move a user's message from one channel to another"
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
