// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

// 
// TEMPLATE.js is an exhaustive template showcasing every feature available to modules.
//  Any module/command can be derived from these.
// 


module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('donate').setDescription("Help support the bot's development").addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),
		
		// Optional fields below this point

		extra: {"contexts": [0,1,2], "integration_types": [0,1]},
		requiredGlobals: [],

		help: {
			helpCategories: ["General","Bot"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
				- Safety -> Anti-hack, anti-spam, etc
				- Module -> Automatic bot action not triggered or configured by a slash command
			*/
			shortDesc: "Help support the bot's development",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot is a passion project, born out of our desire for the ultimate Discord bot. We never charge for any usage of the bot. We never have advertisements. We never store, or sell your info. We make the source code that the bot runs on public and open source. We provide free features that other bots charge for.\n
                \n
                If this is something that speaks to you, that you want to support and to help fund, you can donate here.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`Thank you so much for considering donating to Stewbot!`,embeds:[{
			"title": "Donate to Stewbot",
			"description": "Stewbot is a passion project, born out of our desire for the ultimate Discord bot. We never charge for any usage of the bot. We never have advertisements. We never store, or sell your info. We make the source code that the bot runs on public and open source. We provide free features that other bots charge for.\n\nIf this is something that speaks to you, that you want to support and to help fund, you can donate here.\nThank you so much, we truly appreciate it.",
			"color": 0x006400,
			"thumbnail": {
			  "url": "https://stewbot.kestron.software/stewbot.jpg"
			},
			"footer": {
			  "text": "Stewbot",
			  "icon_url": "https://stewbot.kestron.software/stewbot.jpg"
			}
		}],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Donate with Paypal").setStyle(ButtonStyle.Link).setURL("https://www.paypal.com/donate?business=kestron@kestron.software&no_recurring=0&item_name=KestronProgramming&item_number=Stewbot"))]});
	},

	async onmessage(msg, context) {
		applyContext(context);
		// `context` currently does not respect requested globals
	},

	async autocomplete(cmd) {

	},

	async daily(context) {
		applyContext(context);
		
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [],
	async onbutton(cmd, context) {
		applyContext(context);

		
	}
};
