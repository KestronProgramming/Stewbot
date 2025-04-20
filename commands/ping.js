// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
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

const mongoose = require("mongoose")
const ms = require("ms");

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder()
					.setName('ping')
					.setDescription('Check uptime stats')
					.addBooleanOption(option=>
						option
							.setName("private")
							.setDescription("Make the response ephemeral?")
							.setRequired(false)
					),
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},
		
		// Optional fields
		requiredGlobals: ["uptime"],

		help: {
			helpCategories: [Categories.General, Categories.Bot, Categories.Information],
			shortDesc: "Check uptime stats",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`The standard command to check if the bot is online, how long it's been online for, and in how many places it's installed.`
		}
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const [app, dbPingInMillis] = await Promise.all([
			client.application.fetch(),
			
			(async () => {
				const db = mongoose.connection.db;
				const start = performance.now();
				await db.command({ ping: 1 });
				return +(performance.now() - start).toFixed(2);
			})()
		]);
	
		cmd.followUp(
			`**Online**\n`+
			`- Discord latency: ${ms(client.ws.ping, { long: true })}\n`+
			`- Database latency: ${ms(dbPingInMillis, { long: true })}\n`+
			`- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n`+
			`- Uptime: ${ms(Date.now() - (uptime*1000), { long: true })}\n`+
			`- Server Count: ${client.guilds.cache.size} Servers\n`+
			`- User Install Count: ${app.approximateUserInstallCount} Users`
		);
	},
};
