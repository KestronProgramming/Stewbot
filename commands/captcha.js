// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("captcha").setDescription("Use this command if I've timed you out for spam"),
		
		// Optional fields
		
		extra: {"contexts":[1],"integration_types":[0,1]},

		requiredGlobals: ["presets"],

		help: {
			helpCategories: [],//Do not show in any automatic help pages
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "This command is used in the event of an automatic spam timeout",
			detailedDesc: 
				`If I detect a hacked or spam account, I will require the user to run this command before being untimeouted. Simply press the buttons to enter the displayed code and press enter.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		var captcha="";
		for(var ca=0;ca<5;ca++){
			captcha+=Math.floor(Math.random()*10);
		}
		cmd.followUp({content:`Please enter the following: \`${captcha}\`\n\nEntered: \`\``,components:presets.captcha});
	}
};
