// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate


const { notify } = require("../utils");

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("delete")
            .setDescription("Delete any number of messages")
            .addIntegerOption(option =>
                option.setName("amount").setDescription("The amount of the most recent messages to delete")
                    .setMinValue(1)
                    .setMaxValue(99)
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Administration, Categories.Server_Only],
            shortDesc: "Delete any number of messages",
            detailedDesc:
				`Delete the specified number of messages in bulk. Must be less than a hundred for each time this command is used.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);
        if (!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)) {
            cmd.followUp(`I do not have the necessary permissions to execute this command.`);
            return;
        }

        const privateBuffer = cmd.options.getBoolean("private") ? 0 : 1;
        const requestedNum = cmd.options.getInteger("amount");
        let numToDelete = requestedNum + privateBuffer;
        let dateLimited = 0; // 0 for not limited, -1 for error, 1 for limited.

        // Try flat out doing it (instead of fetching first, that could eat a ton of ram if there are a lot of messages)
        try {
            await cmd.channel.bulkDelete(numToDelete);
        }
        catch {
            // Fetch how many messages there were (verify under the given limit) there were in the past 14 days
            dateLimited = 1;
            const messages = await cmd.channel.messages.fetch({ limit: numToDelete });
            const twoWeeksAgo = Date.now() - 12096e5; // 14 days in ms
            numToDelete = messages.filter(msg => msg.createdTimestamp >= twoWeeksAgo).size;
            try {
                await cmd.channel.bulkDelete(numToDelete);
            }
            catch (e) {
                notify(`Error bulk deleting: ${e.stack}`);
                dateLimited = -1;
            }
        }

        let response = `I have cleared ${numToDelete} messages at <@${cmd.user.id}>'s direction.`;
        if (dateLimited) {
            response += `\nPlease note, I couldn't delete the full requested ${requestedNum} because some are older than two weeks.`;
        }
        if (dateLimited === -1) {
            response = `My apologies, an unknown error was encountered. This error has been reported, feel free to use ${cmds.report_problem.mention} to report additional details.`;
        }

        if (!cmd.options.getBoolean("private")) {
            setTimeout(() => {
                cmd.channel.send({ content: response, allowedMentions: { parse: [] } });
            }, 2000);
        }
    }
};
