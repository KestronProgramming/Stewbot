// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("auto-join-message").setDescription("Set up a message to be sent automatically when a user joins")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Should I send a message when the user joins?").setRequired(true)
			).addStringOption(option=>
				option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to mention the user)")
			).addStringOption(option=>
				option.setName("channel_or_dm").setDescription("Should I post this message in a channel or the user's DMs?").addChoices(
					{"name":"Channel","value":"channel"},
					{"name":"DM","value":"dm"}
				)
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post the message to").addChannelTypes(ChannelType.GuildText)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["defaultGuild"],

		help: {
			helpCategories: [Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Set up a message to be sent automatically when a user joins",
			detailedDesc: 
				`Configures a template message Stewbot will post to a designated channel or the user's DMs in the server's name every time a user joins`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);
		
		guild.ajm.active = cmd.options.getBoolean("active");
		if (cmd.options.getChannel("channel") !== null) guild.ajm.channel = cmd.options.getChannel("channel").id;
		if (cmd.options.getString("channel_or_dm") !== null) guild.ajm.dm = cmd.options.getString("channel_or_dm") === "dm";
		if (cmd.options.getString("message") !== null) guild.ajm.message = checkDirty(config.homeServer, cmd.options.getString("message"), true)[1];
		
		var disclaimers = [];
		if (!guild.ajm.dm && guild.ajm.channel === "") {
			guild.ajm.dm = true;
			disclaimers.push(`-# No channel was specified to post auto join messages in, so I have set it to DMs instead.`);
		}
		if (!guild.ajm.dm && !client.channels.cache.get(guild.ajm.channel)?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
			guild.ajm.dm = true;
			disclaimers.push(`-# I can't post in the specified channel, so I have set the location to DMs instead.`);
		}

		await guild.save();

		cmd.followUp(`Auto join messages configured.${disclaimers.map(d => `\n\n${d}`).join("")}`);
	}
};
