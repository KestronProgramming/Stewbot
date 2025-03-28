// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

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
			helpCategories: ["General","Bot","Information"],			shortDesc: "Check uptime stats",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`The standard command to check if the bot is online, how long it's been online for, and in how many places it's installed.`
		}
	},

	async execute(cmd, context) {
		applyContext(context);
		
		fetch("https://discord.com/api/v10/applications/@me",{
			headers: {
				Authorization: `Bot ${process.env.token}`,
				'Content-Type': 'application/json; charset=UTF-8',
				'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
			}
		}).then(d=>d.json()).then(d=>{
			cmd.followUp(`**Online**\n- Latency: ${client.ws.ping} milliseconds\n- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n- Uptime: ${((Math.round(Date.now()/1000)-uptime)/(60*60)).toFixed(2)} hours\n- Server Count: ${client.guilds.cache.size} Servers\n- User Install Count: ${d.approximate_user_install_count} Users`);
		});
	},
};
