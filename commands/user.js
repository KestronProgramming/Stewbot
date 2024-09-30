// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

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
			"helpCategory": "Informational",
			"helpDesc": "Get a user's profile information"
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
						"name": `Joined Discord`,
						"value": `<t:${Math.floor(who.joinedTimestamp / 1000)}:f>, <t:${Math.floor(who.joinedTimestamp / 1000)}:R>`,
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
				"url": `https://discord.com/users/949401296404905995`
			}], 
			allowedMentions: { parse: [] }
		});

	}
};
