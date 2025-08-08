// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { launchCommands } = require(`../launchCommands.js`);
const fs = require("fs/promises");
const { notify } = require("../utils");

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

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		// Code
        if(cmd.guild?.id===config.homeServer &&cmd.channel.id===config.commandChannel){
			// Update commands
			const result = await launchCommands();
            await cmd.followUp(`Launching commands...\n${result}`);

			// Update the live bot commands
			const commandsText = await fs.readFile(`data/commands.json`, "utf-8");
			var newCmds = JSON.parse( commandsText );
			Object.keys(newCmds).forEach(key=>{
				global.cmds[key] = newCmds[key];
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
