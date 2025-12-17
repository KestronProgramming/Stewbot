// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
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
        command: new SlashCommandBuilder().setName("donate")
            .setDescription("Help support the bot's development")
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),

        // Optional fields below this point

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Bot],
            shortDesc: "Help support the bot's development", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot is a passion project, born out of our desire for the ultimate Discord bot. We never charge for any usage of the bot. We never have advertisements. We never store, or sell your info. We make the source code that the bot runs on public and open source. We provide free features that other bots charge for.\n
                \n
                If this is something that speaks to you, that you want to support and to help fund, you can donate here.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        cmd.followUp({ content: `Thank you so much for considering donating to Stewbot!`, embeds: [{
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
        }], components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("Donate with Paypal")
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://www.paypal.com/donate?business=kestron@kestron.software&no_recurring=0&item_name=KestronProgramming&item_number=Stewbot")
                )
                .toJSON()
        ] });
    }
};
