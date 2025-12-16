// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, EmbedBuilder}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");

function textAsEmbed(text) {
	return {
		embeds: [
			new EmbedBuilder()
				.setDescription(text)
		]
	}
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("links").setDescription("Get a list of links relevant for the bot")
			.addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Bot, Categories.Information],
			shortDesc: "Get a list of links relevant for the bot",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This command provides a list of different links that you may find useful for learning more about the bot.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp(textAsEmbed(
			`Here is a list of links in relation with this bot you may find useful.\n` +
			`- [Stewbot's Install Link](<${config.install}>)\n` +
			`- [Support Server](<${config.invite}>)\n` +
			`- [Stewbot's Source Code on Github](<https://github.com/KestronProgramming/Stewbot>)\n` +
			`- [Stewbot's Website](<https://stewbot.kestron.com/>)\n` +
			`- [Donate](<https://stewbot.kestron.com/donate>)`
		));
	}
};
