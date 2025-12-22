// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const { limitLength } = require("../utils.js");
const config = require("../data/config.json");
const fs = require("fs");
const Fuse = require("fuse.js");
const fuseOptions = {
    includeScore: true,
    keys: ["item"]
};


// Help pages will be stored here
let helpCommands = [];

/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @param {Array} array - The array to be divided into chunks.
 * @param {number} size - The size of each chunk.
 * @returns {Array<Array>} A new array containing the chunks as subarrays.
 */
function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Generates a help menu with pagination, filtering, and category selection.
 *
 * @param {number} page - The current page number (0-based index).
 * @param {string[]|string} categories - The categories to filter commands by. Can be a single category or an array of categories.
 * @param {'And'|'Or'|'Not'} filterMode - The filtering mode to apply:
 *   - 'And': Commands must belong to all specified categories.
 *   - 'Or': Commands must belong to at least one of the specified categories.
 *   - 'Not': Commands must not belong to any of the specified categories.
 * @param {string} forWho - A unique identifier for the user or context requesting the help menu.
 * @returns {Object} An object containing the help menu content, embeds, and interactive components:
 *   - `content` {string}: The textual content of the help menu.
 *   - `embeds` {EmbedBuilder[]}: An array of embed objects for rich content.
 *   - `components` {ActionRowBuilder[]} An array of action rows containing interactive buttons.
 */
function makeHelp(page, categories, filterMode, forWho) {
    const helpCategories = Object.keys(Categories);

    if (!Array.isArray(categories)) categories = [categories];
    if (categories.length === 0) categories = ["None"];

    page = +page;
    if (categories.includes("All")) {
        categories = structuredClone(helpCategories);
    }
    else if (categories.includes("None")) {
        categories = [];
    }
    const buttonRows = [];
    const filteredCommands = helpCommands.filter(command => {
        switch (filterMode) {
            case "And":
                return categories.every(category => command.helpCategories.includes(category));
            case "Or":
                return categories.some(category => command.helpCategories.includes(category));
            case "Not":
                return categories.every(category => !command.helpCategories.includes(category));
            default:
                return true;
        }
    });

    const totalPages = Math.max(chunkArray(filteredCommands, 9).length, 1);
    var pagesArray = [
        new ButtonBuilder().setCustomId(`help-page-0-${forWho}-salt1`)
            .setLabel(`First`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`help-page-${page - 1}-${forWho}-salt2`)
            .setLabel(`Previous`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page - 1 < 0),
        new ButtonBuilder().setCustomId(`help-page-${page}-${forWho}-salt3`)
            .setLabel(`Page ${page + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder().setCustomId(`help-page-${page + 1}-${forWho}-salt4`)
            .setLabel(`Next`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page + 1 >= totalPages),
        new ButtonBuilder().setCustomId(`help-page-${totalPages - 1}-${forWho}-salt5`)
            .setLabel(`Last`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1 && totalPages > 1)
    ];
    buttonRows.push(new ActionRowBuilder().addComponents(...pagesArray));
    buttonRows.push(...chunkArray(helpCategories, 5).map(chunk =>
        new ActionRowBuilder().addComponents(
            chunk.map(category =>
                new ButtonBuilder()
                    .setCustomId(`help-category-${category}-${forWho}`)
                    .setLabel(category)
                    .setStyle(categories.includes(category) ? ButtonStyle.Success : ButtonStyle.Secondary)
            )
        )
    ));
    buttonRows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`help-mode-And-${forWho}`)
        .setLabel("AND Mode")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(filterMode === "And"), new ButtonBuilder().setCustomId(`help-mode-Or-${forWho}`)
        .setLabel("OR Mode")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(filterMode === "Or"), new ButtonBuilder().setCustomId(`help-mode-Not-${forWho}`)
        .setLabel("NOT Mode")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(filterMode === "Not")));

    const fields = filteredCommands
        .slice(page * 9, (page + 1) * 9)
        .map(a => ({
            name: limitLength(a.mention, 256),
            value: limitLength(a.shortDesc, 1024),
            inline: true
        }));

    const helpEmbed = new EmbedBuilder()
        .setTitle(`Help Menu`)
        .setColor(0x006400)
        .setThumbnail(config.pfp)
        .setFooter({
            text: `Help Menu for Stewbot. To view a detailed description of a command, run /help and tell it which command you are looking for.`
        })
        .setFields(fields);

    return {
        content: `## Help Menu\nPage: ${page + 1}/${totalPages} | Mode: ${filterMode} | Categories: ${categories.length === 0 ? `None` : categories.length === helpCategories.length ? `All` : categories.join(", ")}`,
        embeds: [helpEmbed.toJSON()],
        components: buttonRows.map(row => row.toJSON())
    };
}

function sortByMatch(items, text) {
    // @ts-ignore - Fuse ts checking is broken
    const fuse = new Fuse(items.map(item => ({ item })), fuseOptions);
    const scoredResults = fuse.search(text)
        .filter(result => result.score <= 2) // Roughly similar-ish
        .sort((a, b) => a.score - b.score);
    return scoredResults.map(entry => entry.item.item);
}

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("help")
            .setDescription("View the help menu")
            .addStringOption(option =>
                option.setName("module").setDescription("Enter a command here to get a more detailed description of it")
                    .setAutocomplete(true)
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),

        // Optional fields
        aiToolOptions: {
            toolable: [],
            sendDirect: true,
            requiresApproval: false
        },

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: ["commands"],

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Information],
            shortDesc: "View this help menu", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Open this help menu and descriptions.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);
        if (cmd.options.getString("module") === null) {
            cmd.followUp(makeHelp(0, ["All"], "Or", cmd.user.id));
        }
        else {
            var inp = cmd.options.getString("module").toLowerCase();
            var expandedHelp = helpCommands.filter(a => a.name === inp);
            if (expandedHelp.length === 0) {
                cmd.followUp(`I'm sorry, I didn't find that command. Perhaps you spelled it wrong?`);
                return;
            }

            // Only add fields with content
            let description = expandedHelp[0].detailedDesc;
            let fields = [];
            if (expandedHelp[0].shortDesc) {
                fields.push({
                    "name": "Short Description",
                    "value": expandedHelp[0].shortDesc,
                    "inline": true
                });
            }

            if (expandedHelp[0].helpCategories?.length > 0) {
                fields.push({
                    "name": "Tags",
                    "value": expandedHelp[0].helpCategories.join(", "),
                    "inline": true
                });
            }

            // Link back to the source code
            let fileName = inp.split(" ")[0];
            let sourceCodeLink = `https://github.com/KestronProgramming/Stewbot/blob/main/commands/${fileName}.js`;
            fields.push({
                "name": "\u200B",
                "value": `[View module source code](${sourceCodeLink})`,
                "inline": false
            });


            // Add something if no data is specified
            if (fields.length === 0 && !description) {
                description = "No additional information is available for this command.";
            }

            const helpEmbed = new EmbedBuilder()
                .setTitle(`${expandedHelp[0].mention}`)
                .setDescription(description)
                .setColor(0x006400)
                .setThumbnail(config.pfp)
                .setFields(fields);

            cmd.followUp({
                content: `## Help Menu for ${expandedHelp[0].mention}`,
                embeds: [helpEmbed]
            });
        }
    },

    async autocomplete(cmd, context) {
        applyContext(context);
        const userInput = cmd.options.getFocused() || "";
        var possibleCommands = helpCommands.map(a => a.name);
        // Get the top matching results
        if (userInput) {
            possibleCommands = sortByMatch(possibleCommands, userInput);
        }

        // Limit to discord max
        possibleCommands = possibleCommands.slice(0, 25);

        // Format for discord
        let autocompletes = [];
        for (let cmdName of possibleCommands) {
            autocompletes.push({
                name: cmdName,
                value: cmdName
            });
        }

        cmd.respond(autocompletes);
    },

    // Only button subscriptions matched will be sent to the handler
    subscribedButtons: [/help-.*/],

    async onbutton(cmd, context) {
        applyContext(context);

        if (!("customId" in cmd)) return;

        if (cmd.customId?.startsWith("help-")) {
            const opts = cmd.customId.split("-");
            const buttonType = opts[1];
            const forWho = opts[3];

            if (forWho !== cmd.user.id) {
                cmd.reply({
                    content: `This isn't your help command! Use ${cmds.help.mention} to start your own help command.`,
                    ephemeral: true
                });
            }
            else {
                switch (buttonType) {

                    case "page":
                        if (!cmd.message?.content) return;
                        const pageToGoTo = Number(opts[2]);
                        cmd.update(
                            makeHelp(
                                pageToGoTo,
                                cmd.message.content
                                    .split("Categories: ")[1]
                                    .split(", "),
                                // @ts-ignore
                                cmd.message.content
                                    .split("Mode: ")[1]
                                    .split(" |")[0],
                                cmd.user.id
                            )
                        );
                        break;
                    case "category":
                        const category = opts[2];
                        if (!cmd.message?.content) return;
                        var cats = cmd.message.content.split("Categories: ")[1]?.split(", ");
                        if (cats.length === 0) cats = ["None"];
                        if (cats.includes("All")) {
                            cats = [category];
                        }
                        else if (cats.includes(category)) {
                            cats.splice(cats.indexOf(category), 1);
                        }
                        else {
                            if (cats.includes("None")) cats = [];
                            cats.push(category);
                        }
                        cmd.update(
                            makeHelp(
                                0,
                                cats,
                                // @ts-ignore
                                cmd.message.content
                                    .split("Mode: ")[1]
                                    .split(" |")[0],
                                cmd.user.id
                            )
                        );
                        break;
                    case "mode":
                        if (!cmd.message?.content) return;
                        const newMode = opts[2];
                        cmd.update(
                            makeHelp(
                                0,
                                cmd.message.content
                                    .split("Categories: ")[1]
                                    .split(", "),
                                // @ts-ignore
                                newMode,
                                cmd.user.id
                            )
                        );
                        break;
                }
            }
        }
    },

    // Build dynamic help pages when the bot is ready
    async [Events.ClientReady]() {
        // Once commands are loaded
        Object.keys(commands).forEach(commandName => {
            var cmd = commands[commandName];
            if (cmd.data?.help?.shortDesc !== undefined && cmd.data?.help?.shortDesc !== `Stewbot's Admins Only` && cmd.data?.help?.helpCategories.length > 0) {
                const commandMention = cmds[cmd.data?.command?.name]?.mention || `\`${commandName}\` Module`; // non-command modules don't have a mention
                helpCommands.push(Object.assign({
                    name: cmd.data?.command?.name || commandName,
                    mention: commandMention
                }, cmd.data?.help));
            }
            else if (cmd.data?.help?.shortDesc !== `Stewbot's Admins Only`) {
                Object.keys(cmd.data?.help || []).forEach(subcommand => {
                    var subcommandHelp = cmd.data?.help[subcommand];
                    const subcommandMention = cmds[cmd.data?.command?.name]?.[subcommand]?.mention || `\`${commandName}\` Module`; // No case for this rn but might have one in the future
                    if (subcommandHelp.helpCategories?.length > 0) {
                        helpCommands.push(Object.assign({
                            name: `${commandName} ${subcommand}`,
                            mention: subcommandMention
                        }, subcommandHelp));
                    }
                });
            }
        });

        // Dump the help pages so we can import on websites and stuff
        fs.promises.writeFile("./data/helpPages.json", JSON.stringify(helpCommands, null, 4));
    }
};
