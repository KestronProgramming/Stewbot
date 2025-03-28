const Categories = [
    "General",              // Generic commands almost every bot has
    "Information",          // A command designed purely to provide information of some kind
    "Bot",                  // A command designed specifically for managing the bot itself
    "Administration",       // A command that needs moderator privileges
    "Configuration",        // A command that changes settings of some kind
    "Entertainment",        // A command that is related to a fun feature of some kind
    "Context_Menu",         // A command accessed via the context menu
    "Server_Only",          // Commands that can only be run in servers
    "Safety",               // Anti-hack, anti-spam, etc
    "Module",               // Any plugin that sits the background and doesn't have a slash command (or only has a single command to configure it?).
]

module.exports = Categories