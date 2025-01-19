// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

const fs = require("node:fs")

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('wotd').setDescription('Play a word of the day game reminiscent of Wordle').addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),
		
		// Optional fields
		
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Entertainment"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Play a word of the game reminiscent of Wordle",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Play a game reminiscent of Wordle but with our own word of the day and from within Discord. A new word is chosen every day at 12 UTC.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`# WOTD Game${"\n` ` ` ` ` ` ` ` ` `".repeat(6)}\nQ W E R T Y U I O P\nA S D F G H J K L\nZ X C V B N M`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
	},

	async daily(context) {
		applyContext(context);

		// Until the button handler that also uses this file is ported here, just read it in this scope
		const wotdList = fs.readFileSync(`./data/wordlist.txt`,"utf-8").split("\n");

		storage.wotd=wotdList[Math.floor(Math.random()*wotdList.length)];
		notify(1, `WOTD is now ||${storage.wotd}||, use \`~sudo setWord jerry\` to change it.`)
	}
};
