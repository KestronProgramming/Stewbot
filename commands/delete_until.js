// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Component } = require("discord.js");
function applyContext(context = {}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { randomUUID } = require('crypto');
const NodeCache = require("node-cache");
const bulkMessageCache = new NodeCache({ stdTTL: 60 * 5 }); // A list of button IDs to the messages they should delete.


module.exports = {
	data: {
		// Slash command data
		command: 
			new ContextMenuCommandBuilder()
				.setContexts(
					IT.Guild,          // Server command
					// IT.BotDM,          // Bot's DMs
					// IT.PrivateChannel, // User commands
				)
				.setIntegrationTypes(
					AT.GuildInstall,   // Install to servers
					// AT.UserInstall     // Install to users
				)
				.setName("delete_until")
				.setType(ApplicationCommandType.Message)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

		// Optional fields

		extra: { "desc": "Bulk delete up to a certain point." },

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Administration],
			shortDesc: "Bulk delete up to a certain point",
			detailedDesc: 
					`Delete all messages in the current thread until the selected message. This counts how many messages there are until the message you selected, and deletes all of those.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
			cmd.followUp(`I do not have the necessary permissions to execute this command.`);
			return;
		}

		// We can only delete 100 messages, so fetch the last 100 from this channel and we'll see where in this the target is
		const messages = await cmd.channel.messages.fetch({ limit: 100 });
		const messagesArray = Array.from(messages);
		const targetIndex = messagesArray.findIndex(msgData => msgData[0] === cmd.targetMessage.id);
		const messagesToDelete = messagesArray
			.slice(0, targetIndex+1 || 100)
			.map(msgData => msgData[0]);

		// Store the messages for the button press to read
		const bulkMessageKey = randomUUID();
		bulkMessageCache.set(bulkMessageKey, messagesToDelete);

		const confirm = new ButtonBuilder()
			.setCustomId(`bdelete-${bulkMessageKey}`)
			.setLabel('Yes')
			.setStyle(ButtonStyle.Danger);

		const msg = targetIndex === -1
			? `I can only delete 100 messages at a time. Should I delete the first 100?`
			: `Should I delete the last ${targetIndex + 1} messages? `

		return cmd.followUp({ 
			content: msg,
			components: [ new ActionRowBuilder().addComponents(confirm) ],
			ephemeral: true
		});
	},

	subscribedButtons: [/bdelete-.+/],

	/** @param {import('discord.js').ButtonInteraction} cmd */
	async onbutton(cmd, context) {
		applyContext(context);

		const bulkMessageKey = cmd.customId.split('-').splice(1).join("-");
		const messagesToDelete = bulkMessageCache.get(bulkMessageKey);

		if (messagesToDelete === "complete") {
			return cmd.reply({ content: `The messages have already been deleted.`, ephemeral: true });
		}

		if (!messagesToDelete) {
			return cmd.reply({ content: `It has been too long since you ran this command, try again.`, ephemeral: true });
		}

		await cmd.channel.bulkDelete(messagesToDelete, true);
		bulkMessageCache.del(bulkMessageKey);

		bulkMessageCache.set(bulkMessageKey, "complete")
		await cmd.deferUpdate()
		// return cmd.reply(`Successfully deleted ${messagesToDelete.length} messages.`);
	}
};
