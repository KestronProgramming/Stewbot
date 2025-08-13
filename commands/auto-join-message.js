// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js");
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { censor } = require("./filter");

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("auto-join-message").setDescription("Set up a message to be sent automatically when a user joins")
			.addBooleanOption(option =>
				option.setName("active").setDescription("Should I send a message when the user joins?").setRequired(true)
			).addStringOption(option =>
				option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to mention the user)")
			).addStringOption(option =>
				option.setName("channel_or_dm").setDescription("Should I post this message in a channel or the user's DMs?").addChoices(
					{ "name": "Channel", "value": "channel" },
					{ "name": "DM", "value": "dm" }
				)
			).addChannelOption(option =>
				option.setName("channel").setDescription("The channel to post the message to").addChannelTypes(ChannelType.GuildText)
			).addBooleanOption(option =>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

		// Optional fields

		extra: { "contexts": [0], "integration_types": [0] },

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Set up a message to be sent automatically when a user joins",
			detailedDesc:
				`Configures a template message Stewbot will post to a designated channel or the user's DMs in the server's name every time a user joins`
		},
	},

	/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
	async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);

		guild.ajm.active = cmd.options.getBoolean("active");
		if (cmd.options.getChannel("channel") !== null) guild.ajm.channel = cmd.options.getChannel("channel").id;
		if (cmd.options.getString("channel_or_dm") !== null) guild.ajm.dm = cmd.options.getString("channel_or_dm") === "dm";
		if (cmd.options.getString("message") !== null) guild.ajm.message = await censor(cmd.options.getString("message"));

		var disclaimers = [];

		if (!guild.ajm.dm && guild.ajm.channel === "") {
			guild.ajm.dm = true;
			disclaimers.push(`-# No channel was specified to post auto join messages in, so I have set it to DMs instead.`);
		}

		if (!guild.ajm.dm) {
			let channel = await client.channels.fetch(guild.ajm.channel).catch(e => null);

			if (!("permissionsFor" in channel) || !("fetchWebhooks" in channel)  || !channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				guild.ajm.dm = true;
				disclaimers.push(`-# I can't post in the specified channel, so I have set the location to DMs instead.`);
			}
		}

		await guild.save();

		cmd.followUp(`Auto join messages configured.${disclaimers.map(d => `\n\n${d}`).join("")}`);
	},

	async [Events.GuildMemberAdd](member, readGuildStore) {

		// Auto join messages
		if (readGuildStore.ajm.active) {
			if (!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
				// Swap to DMs if we don't have perms to message, but the join messages are active
				readGuildStore.ajm.dm = true;

				// Save it (guildStore is readonly here)
				Guilds.updateOne({ id: readGuildStore.id }, { $set: { "ajm.dm": true } });
			}

			if (readGuildStore.ajm.dm) {
				try {
					member.send({
						embeds: [{
							type: "rich",
							title: member.guild.name,
							description: readGuildStore.ajm.message.replaceAll("${@USER}", `<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : ''}`).replaceAll("\\n", "\n"),
							color: 0x006400,
							thumbnail: {
								url: member.guild.iconURL(),
								height: 0,
								width: 0,
							},
							footer: { text: `This message was sent from ${member.guild.name}` },
						}]
					}).catch(e => { });
				} catch (e) { }
			}

			else {
				var resp = {
					content: readGuildStore.ajm.message.replaceAll("${@USER}", `<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : ''}`).replaceAll("\\n", "\n"),
					username: member.guild.name,
					avatarURL: member.guild.iconURL()
				};
				const channel = await client.channels.cache.get(readGuildStore.ajm.channel);
				if (!("fetchWebhooks" in channel)) return;

				let webhooks = await channel.fetchWebhooks();
				let hook = webhooks.find(h => h.token);
				if (hook) {
					hook.send(resp);
				}
				else {
					channel.createWebhook({
						name: config.name,
						avatar: config.pfp
					}).then(d => {
						d.send(resp);
					});
				}
			}
		}
	}
};
