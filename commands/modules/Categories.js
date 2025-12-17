/**
 * Command categories for the bot
 * @enum {string}
 * @readonly
 */
const Categories = {
    /** Generic commands almost every bot has */
    General: "General",

    /** A command designed specifically for managing the bot itself */
    Bot: "Bot",

    /** A command designed purely to provide information of some kind */
    Information: "Information",

    /** A command that is related to a fun feature of some kind */
    Entertainment: "Entertainment",

    /** A command that changes settings of some kind */
    Configuration: "Configuration",

    /** A command that needs moderator privileges */
    Administration: "Administration",

    /** Anti-hack, anti-spam, etc */
    Safety: "Safety",

    /** A command accessed via the context menu */
    Context_Menu: "Context_Menu",

    /** Commands that can only be run in servers */
    Server_Only: "Server_Only",

    /** Any plugin that sits the background and doesn't have a slash command */
    Module: "Module"
};

// Freeze the object to make it truly const
Object.freeze(Categories);

module.exports = Categories;
