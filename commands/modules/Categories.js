const Categories = [
    "General",              // Generic commands almost every bot has
    "Bot",                  // A command designed specifically for managing the bot itself
    "Information",          // A command designed purely to provide information of some kind
    "Entertainment",        // A command that is related to a fun feature of some kind
    "Configuration",        // A command that changes settings of some kind
    "Administration",       // A command that needs moderator privileges
    "Safety",               // Anti-hack, anti-spam, etc
    "Context_Menu",         // A command accessed via the context menu
    "Server_Only",          // Commands that can only be run in servers
    "Module",               // Any plugin that sits the background and doesn't have a slash command (or only has a single command to configure it?).
]

/** 
 * Enum for command categories
 * @enum {string}
 * @readonly
 * @property {string} General - Generic commands almost every bot has
 * @property {string} Bot - A command designed specifically for managing the bot itself
 * @property {string} Information - A command designed purely to provide information of some kind
 * @property {string} Entertainment - A command that is related to a fun feature of some kind
 * @property {string} Configuration - A command that changes settings of some kind
 * @property {string} Administration - A command that needs moderator privileges
 * @property {string} Safety - Anti-hack, anti-spam, etc
 * @property {string} Context_Menu - A command accessed via the context menu
 * @property {string} Server_Only - Commands that can only be run in servers
 * @property {string} Module - Any plugin that sits the background and doesn't have a slash command (or only has a single command to configure it?).
 */
const CategoriesEnum = Object.fromEntries(Categories.map(cat => [cat, cat]))

// Export as an enum
module.exports = CategoriesEnum