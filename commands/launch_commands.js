// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const config = require("../data/config.json");

module.exports = {
	data: {
		// Slash command data
		command: null,
		
		// Optional fields
		
		// extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: [""],//Don't show in any automatic help pages
			shortDesc: "Stewbot's Admins Only",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		// Code
        if(cmd.guild?.id===config.homeServer &&cmd.channel.id===config.commandChannel){
            await cmd.followUp(`Launching commands...\n${require(`../Scripts/launchCommands.js`).launchCommands()}`);
			var newCmds=JSON.parse(require("fs").readFileSync(`data/commands.json`,"utf-8"));
			Object.keys(newCmds).forEach(key=>{
				cmds[key]=newCmds[key];
			});
        }
        else if(cmd.guild?.id===config.homeServer){
            cmd.followUp(`Not here.`);
        }
        else{
            notify(`Launch commands was used outside of Kestron Central by <@${cmd.user.id}>.`);
			cmd.followUp(`No.`);
        }
	}
};
