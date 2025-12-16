// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { guildByObj } = require("./modules/database.js")
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
function applyContext(context = {}) {
	for (const key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("general_config").setDescription("Configure general behaviours")
			.addBooleanOption(option=>
				option.setName("keywords").setDescription("Allow the bot to respond to certain keywords with an attempt at a humorous response?")
			).addBooleanOption(option =>
				option.setName("ai_pings").setDescription("Have the bot post an AI message when pinging it?")
			).addBooleanOption(option =>
				option.setName("embeds").setDescription("If a message link is posted, should I post a preview?")
			).addBooleanOption(option =>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

		// Optional fields

		extra: { "contexts": [0], "integration_types": [0] },

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Bot, Categories.Administration, Categories.Configuration, Categories.Server_Only], shortDesc: "Configure general behaviours for the bot",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure automatic actions the bot will take server wide, including whether Stewbot will automatically post embeds when it sees a message link, or if you want to disable Stewbot's automatic hacked/spam account protection.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const updates = {}

		if (cmd.options.getBoolean("ai_pings") !== null){
			updates["config.ai"] = cmd.options.getBoolean("ai_pings");
		}
		if (cmd.options.getBoolean("embeds") !== null){
			updates["config.embedPreviews"] = cmd.options.getBoolean("embeds");
		}
		if(cmd.options.getBoolean("keywords")!==null){
			updates["config.keywords"]=cmd.options.getBoolean("keywords");
		}

		await guildByObj(cmd.guild, updates);

		cmd.followUp("Configured your server setup");
	}
};
