// #region CommandBoilerplate
const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate
const { notify } = require("../utils.js");
const { Quotes } = require("./modules/database.js");

/** @type {import("../command-module.js").CommandModule} */
module.exports = {
    data: {
        sudo: true,

        command: new SlashCommandBuilder()
            .setName("sudo_add_quote")
            .setDescription("Directly Add a Quote to the DB")
            .addStringOption(option =>
                option.setName("what")
                    .setDescription("What should the content of the quote be? (CHECK FOR TYPOS)")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("who")
                    .setDescription("Who is the quote attributed to? (CHECK TYPOS, NO CONTROVERSIAL FIGURES)")
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],
        help: {
            helpCategories: [""], //Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
        }
    },

    async execute(cmd, context) {
        applyContext(context);
        const newQuote = new Quotes({
            what: cmd.options.getString("what"),
            who: cmd.options.getString("who")
        });
        await newQuote.save();
        const components = [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(newQuote.what)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
                        .setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# \\- ${newQuote.who}`)
                )
        ];

        cmd.followUp({
            components: components,
            flags: MessageFlags.IsComponentsV2
        });
    }
};
