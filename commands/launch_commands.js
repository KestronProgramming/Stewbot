// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: null,
		
		// Optional fields
		
		// extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: [],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
		
		// Code
        if(cmd.guild?.id==="983074750165299250"&&cmd.channel.id==="986097382267715604"){
            cmd.followUp(`Launching commands...\n${require(`../launchCommands.js`).launchCommands()}`);
        }
        else if(cmd.guild?.id===`983074750165299250`){
            cmd.followUp(`Not here.`);
        }
        else{
            notify(1,`Launch commands was used outside of Kestron Central by <@${cmd.user.id}>.`);
        }
	}
};
