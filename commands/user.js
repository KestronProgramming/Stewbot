// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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

function getDiscordJoinTimestamp(userId) {
    const discordEpoch = 1420070400000; // Discord's epoch in milliseconds
    const binarySnowflake = BigInt(userId).toString(2).padStart(64, "0"); // Convert to 64-bit binary
    const timestamp = parseInt(binarySnowflake.slice(0, 42), 2) + discordEpoch;
    return Math.floor(timestamp / 1000);
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("user").setDescription("Display a user's profile")
			.addBooleanOption(option=>
				option.setName("large-pfp").setDescription("Display the PFP in large mode?")
			).addUserOption(option=>
				option.setName("who").setDescription("Who do you want to display?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Information, Categories.Administration, Categories.Entertainment],
			shortDesc: "Display a user's profile",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Choose a user and expand their profile information into the embed. If specified, you can also enlarge the profile picture which makes it easier to save which can be useful for various purposes.`
		},
		
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		var who = cmd.guild.members.cache.get(cmd.options.getUser("who") ? cmd.options.getUser("who").id : cmd.user.id);
		if (!who) {
			cmd.followUp(`I can't seem to locate them.`);
			return;
		}

		cmd.followUp({
			content: `User card for <@${who.id}>`, embeds: [{
				"type": "rich",
				"title": `${who.nickname ? who.nickname : who.user.globalName}`,
				"description": who.roles.cache.map(r => r.name !== "@everyone" ? `<@&${r.id}>` : "").join(", "),
				"color": 0x006400,
				"fields": [
					{
						"name": `Joined Server`,
						"value": `<t:${Math.floor(who.joinedTimestamp / 1000)}:f>, <t:${Math.floor(who.joinedTimestamp / 1000)}:R>`,
						"inline": true
					},
					{
					"name": `Joined Discord`,
					"value": `<t:${getDiscordJoinTimestamp(who.id)}:f>, <t:${getDiscordJoinTimestamp(who.id)}:R>`,
					"inline": true
					}
				],
				"timestamp": new Date(),
				"image": {
					"url": cmd.options.getBoolean("large-pfp") ? `${who.displayAvatarURL()}?size=1024` : null,
					"height": 0,
					"width": 0
				},
				"thumbnail": {
					"url": who.displayAvatarURL(),
					"height": 0,
					"width": 0
				},
				"author": {
					"name": who.user.globalName,
					"url": `https://discord.com/users/${who.id}`,
					"icon_url": who.user.displayAvatarURL()
				},
				"footer": {
					"text": who.user.username,
					"icon_url": who.user.displayAvatarURL()
				},
				"url": `https://discord.com/users/${who.id}`
			}], 
			allowedMentions: { parse: [] }
		});

	}
};
