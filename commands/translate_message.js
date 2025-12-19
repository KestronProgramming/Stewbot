// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { guildByObj } = require("./modules/database.js");
const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const translate = require("@vitalets/google-translate-api").translate; // Import requires, even though it's greyed out
const { escapeBackticks } = require("../utils.js");
const { censor } = require("./filter");

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new ContextMenuCommandBuilder().setName("translate_message")
            .setType(ApplicationCommandType.Message),

        // Optional fields

        extra: {
            "contexts": [0, 1, 2], "integration_types": [0, 1],
            "desc": "Attempt to autodetect the language of a message and translate it"
        },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.Information, Categories.Context_Menu],
            shortDesc: "Attempt to autodetect the language of the message and translate it", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Tries to autodetect the language of a message, and translate it into English. This is a context menu command, accessed by holding down on a message on mobile or right clicking on desktop, and pressing "Apps".`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const guild = cmd.guild ? await guildByObj(cmd.guild) : null;
        const content = cmd.targetMessage.content ?? "";
        if (!content.trim()) {
            await cmd.followUp({ content: "There is no message content to translate.", ephemeral: true });
            return;
        }

        const t = await translate(content, { to: cmd.locale.slice(0, 2) });
        t.text = await censor(t.text);
        if (cmd.guildId && guild?.filter?.active) t.text = await censor(t.text, guild, true);
        await cmd.followUp(
            `Attempted to translate${t.text !== content
                ? `:\n` +
					`\`\`\`\n` +
					`${escapeBackticks(t.text)}\n` +
					`\`\`\`\n` +
					`-# If this is incorrect, try using ${cmds.translate.mention}.`
                : `, but I was unable to. Try using ${cmds.translate.mention}.`}`);
    }
};
