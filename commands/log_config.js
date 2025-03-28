// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("log_config").setDescription("Configure log events")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Log server and user events to the designated channel?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel to post events to?").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addBooleanOption(option=>
				option.setName("channel_events").setDescription("Log channel events?")
			).addBooleanOption(option=>
				option.setName("emoji_events").setDescription("Log emoji and sticker events?")
			).addBooleanOption(option=>
				option.setName("user_change_events").setDescription("Log user changes?")
			).addBooleanOption(option=>
				option.setName("joining_and_leaving").setDescription("Log when a user joins/leaves?")
			).addBooleanOption(option=>
				option.setName("invite_events").setDescription("Log when an invite is made or deleted?")
			).addBooleanOption(option=>
				option.setName("role_events").setDescription("Log role events?")
			).addBooleanOption(option=>
				option.setName("mod_actions").setDescription("Log when a moderator performs an action")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Information","Administration","Configuration","Server Only"],			shortDesc: "Configure log events",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure an amount of events you want Stewbot to automatically notify you of in a configurable channel for moderation and administration purposes.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		storage[cmd.guildId].logs.active=cmd.options.getBoolean("active");
		storage[cmd.guildId].logs.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getBoolean("channel_events")!==null) storage[cmd.guildId].logs.channel_events=cmd.options.getBoolean("channel_events");
		if(cmd.options.getBoolean("emoji_events")!==null) storage[cmd.guildId].logs.emoji_events=cmd.options.getBoolean("emoji_events");
		if(cmd.options.getBoolean("user_change_events")!==null) storage[cmd.guildId].logs.user_change_events=cmd.options.getBoolean("user_change_events");
		if(cmd.options.getBoolean("joining_and_leaving")!==null) storage[cmd.guildId].logs.joining_and_leaving=cmd.options.getBoolean("joining_and_leaving");
		if(cmd.options.getBoolean("invite_events")!==null) storage[cmd.guildId].logs.invite_events=cmd.options.getBoolean("invite_events");
		if(cmd.options.getBoolean("role_events")!==null) storage[cmd.guildId].logs.role_events=cmd.options.getBoolean("role_events");
		if(cmd.options.getBoolean("mod_actions")!==null) storage[cmd.guildId].logs.mod_actions=cmd.options.getBoolean("mod_actions");
		var disclaimers=[];
		if(!client.channels.cache.get(storage[cmd.guildId].logs.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
			storage[cmd.guildId].logs.active=false;
			disclaimers.push(`I can't post in the specified channel, so logging is turned off.`);
		}
		cmd.followUp(`Configured log events.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	}
};
