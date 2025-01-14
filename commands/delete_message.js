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
		command: new ContextMenuCommandBuilder().setName("delete_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), //Leaving this in DMs to delete undesirable bot DMs

		// Optional fields

		extra: { "contexts": [0, 1], "integration_types": [0], "desc": "Delete a message using Stewbot; can be used to delete Stewbot DMs" },

		requiredGlobals: [],

		help: {
			helpCategories: [""],
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
			shortDesc: "Delete the message, useful for Stewbot DMs",
			detailedDesc: 
				`Deletes the specified message from the context menu. This command exists primarily to remove DMs with Stewbot.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);

		if (cmd.guild?.id) {
			if (!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)) {
				cmd.followUp(`I cannot delete this message.`);
				return;
			}
			cmd.targetMessage.delete();
			if (storage[cmd.guildId].logs.mod_actions && storage[cmd.guildId].logs.active) {
				var c = client.channels.cache.get(storage[cmd.guildId].logs.channel);
				if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					c.send({ content: `Message from <@${cmd.targetMessage.author.id}> deleted by **${cmd.user.username}**.\n\n${cmd.targetMessage.content}`, allowedMentions: { parse: [] } });
				}
				else {
					storage[cmd.guildId].logs.active = false;
				}
			}
			cmd.followUp({ "content": "Success", "ephemeral": true });
		}
		else if (cmd.targetMessage.author.id === client.user.id) {
			cmd.targetMessage.delete();
			cmd.followUp({ "content": "Success", "ephemeral": true });
		}
	}
};
