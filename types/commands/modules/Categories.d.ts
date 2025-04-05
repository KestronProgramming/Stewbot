export = CategoriesEnum;
/**
 * *
 */
type CategoriesEnum = string;
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
declare const CategoriesEnum: {
    [k: string]: string;
};
