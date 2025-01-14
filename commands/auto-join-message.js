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
			helpCategories: ["Administration","Configuration","Server Only"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Set up a message to be sent automatically when a user joins",
			detailedDesc: 
				`Configures a template message Stewbot will post to a designated channel or the user's DMs in the server's name every time a user joins`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		storage[cmd.guildId].ajm.active=cmd.options.getBoolean("active");
		if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].ajm.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getString("channel_or_dm")!==null) storage[cmd.guildId].ajm.dm=cmd.options.getString("channel_or_dm")==="dm";
		if(cmd.options.getString("message")!==null) storage[cmd.guildId].ajm.message=checkDirty(config.homeServer,cmd.options.getString("message"),true)[1];
		var disclaimers=[];
		if(!storage[cmd.guildId].ajm.dm&&storage[cmd.guildId].ajm.channel===""){
			storage[cmd.guildId].ajm.dm=true;
			disclaimers.push(`No channel was specified to post auto join messages in, so I have set it to DMs instead.`);
		}
		if(!storage[cmd.guildId].ajm.dm&&!client.channels.cache.get(storage[cmd.guildId].ajm.channel)?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
			storage[cmd.guildId].ajm.dm=true;
			disclaimers.push(`I can't post in the specified channel, so I have set the location to DMs instead.`);
		}
		if(storage[cmd.guildId].ajm.message==="") storage[cmd.guildId].ajm.message=defaultGuild.ajm.message;
		cmd.followUp(`Auto join messages configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	}
};
