// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { globalCensor } = require("./filter");

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("auto-leave-message").setDescription("Set up a message to be sent automatically when a user leaves")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Should I send a message when the user leaves?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post the message to").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addStringOption(option=>
				option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to use the user's username)")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Configuration, Categories.Administration, Categories.Server_Only],
			shortDesc: "Set up a message to be sent automatically when a user leaves",
			detailedDesc: 
				`Configures a template message Stewbot will post to a designated channel in the server's name every time a user leaves`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);
		
		guild.alm.active=cmd.options.getBoolean("active");
		guild.alm.channel=cmd.options.getChannel("channel").id;

		var disclaimers=[];

		let channel = await client.channels.fetch(guild.alm.channel).catch(e => null);

		if(!("permissionsFor" in channel) || !("fetchWebhooks" in channel) || !channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
			guild.alm.active=false;
			disclaimers.push(`I can't post in the specified channel, so I cannot run auto leave messages.`);
		}

		if (cmd.options.getString("message") !== null) 
			guild.alm.message = await globalCensor(cmd.options.getString("message"));
		
		await guild.save();
		cmd.followUp(`Auto leave messages configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	},

	async [Events.GuildMemberRemove](member, guildStore) {
		// Auto Leave Messages
		if (guildStore.alm?.active) {
			if (!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
				Guilds.updateOne({ id: guildStore.id }, {
					$set: { "alm.active": false }
				})
				return;
			}

			var resp = {
				content: guildStore.alm.message.replaceAll("${@USER}", `<@${member.id}> ${member.user.username ? `(**${member.user.username}**)` : ''}`),
				username: member.guild.name,
				avatarURL: member.guild.iconURL()
			};

			let channel = await client.channels.fetch(guildStore.alm.channel);
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
};
