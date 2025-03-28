// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
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
			helpCategories: ["General","Information","Administration","Entertainment"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Display a user's profile",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Choose a user and expand their profile information into the embed. If specified, you can also enlarge the profile picture which makes it easier to save which can be useful for various purposes.`
		},
		
	},

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
