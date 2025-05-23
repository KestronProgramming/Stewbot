// #region CommandBoilerplate
const Categories = require("../modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("../modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
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

module.exports = {
	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("delete_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), //Leaving this in DMs to delete undesirable bot DMs

		// Optional fields

		extra: { "contexts": [0, 1], "integration_types": [0], "desc": "Delete a message using Stewbot; can be used to delete Stewbot DMs" },

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Bot, Categories.Administration],
			shortDesc: "Delete the message, useful for Stewbot DMs",
			detailedDesc: 
				`Deletes the specified message from the context menu. This command exists primarily to remove DMs with Stewbot.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		if (cmd.guild?.id) {
			if (!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)) {
				cmd.followUp(`I cannot delete this message.`);
				return;
			}
			cmd.targetMessage.delete();
			
			const guild = await guildByObj(cmd.guild);

			if (guild.logs.mod_actions && guild.logs.active) {
				var c = client.channels.cache.get(guild.logs.channel);
				if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					c.send({
                        content: 
							`Message from <@${cmd.targetMessage.author.id}> deleted by **${cmd.user.username}**.\n`+
							`\n`+
							`${cmd.targetMessage.content}`,
                        allowedMentions: { parse: [] },
                    });
				}
				else {
					guild.logs.active = false;
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
