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

const mongoose = require("mongoose")

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

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const app = await client.application.fetch();

		// Send database ping
		const db = mongoose.connection.db;
		const start = performance.now();
		await db.command({ ping: 1 });
		const dbPingInMillis = (performance.now() - start).toFixed(2);
	

		cmd.followUp(
			`**Online**\n`+
			`- Discord latency: ${client.ws.ping} milliseconds\n`+
			`- Database latency: ${dbPingInMillis} milliseconds\n`+
			`- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n`+
			`- Uptime: ${((Math.round(Date.now() / 1000) - uptime) / (60 * 60)).toFixed(2)} hours\n`+
			`- Server Count: ${client.guilds.cache.size} Servers\n`+
			`- User Install Count: ${app.approximateUserInstallCount} Users`
		);
	},
};
