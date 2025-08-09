// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, GuildUsers, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const { notify } = require("../utils")

module.exports = {
	data: {
		command: null,

		help: {
			helpCategories: [ Categories.Module ],
			shortDesc: "Core bot event handling, database management, etc.",
			detailedDesc:
				`Important bot functions and tasks go here.
                This module preforms critical bot functionality and management, rather than public facing tools.`,
		},
	},


	
	// Staff notifs

	async [Events.Error] (error) {
		notify("Client emitted error:\n\n"+error.stack);
	},

	async ["rateLimit"] (data) {
		notify("Ratelimited -\n\n" + data);
	},

	async [Events.GuildCreate] (guild) {
		notify(`Added to **a new server**!`);
	},



	// Bot functions / management

	async [Events.GuildDelete](guild) {
		// Remove this guild from the store
		await Guilds.deleteOne({ id: guild.id });

		// Remove all guild users objects under this server
		await GuildUsers.deleteMany({
			guildId: guild.id
		})

		notify(`Removed from **a server**.`);
    },

	async [Events.GuildMemberRemove] (member) {
		if (member.user.id == client.user.id) return;

		// Mark as not in the server
		GuildUsers.updateOne({
			userId: member.user.id,
			guildId: member.guild.id,
		}, {
			$set: { "inServer": false }
		})
	},

	async [Events.GuildMemberAdd] (member) {
		// Mark this user as in the server, if the user object exists already
		await GuildUsers.updateOne(
			{ userId: member.user.id, guildId: member.guild.id },
			{ $set: { inServer: true } },
			{ upsert: false }
		);
	},
};
