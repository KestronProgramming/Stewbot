// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, GuildUsers, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { notify } = require("../utils")
const ms = require("ms");
const { startBackupThreadPromise, checkForMongoRestore } = require("../backup.js");

module.exports = {
	data: {
		command: null,

		help: {
			helpCategories: [ Categories.Module ],
			shortDesc: "Periodically backup the bot's database.",
			detailedDesc:
				`To avoid data loss on server issues, stewbot periodically backs up his database to a private cloud folder.`,
		},
	},

    async [Events.ClientReady] () {
        // Once backup.js fully imports, start the backup thread
        startBackupThreadPromise.then(startBackupThread => {
            startBackupThread(ms("1h"), error => {
                notify(String(error));
            })
        })
    }
}
