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
		command: new SlashCommandBuilder().setName("levels_config").setDescription("Configure level ups").addBooleanOption(option=>
				option.setName("active").setDescription("Should level ups be active?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel should level ups go to, if set to a specific channel?")
			).addStringOption(option=>
				option.setName("message").setDescription("What gets sent at a new level. Use ${USER} for ping, ${USERNAME} for username, ${LVL} for level.").setMinLength(1)
			).addStringOption(option=>
				option.addChoices(
					{"name":"Specific Channel",value:"channel"},
					{"name":"DM",value:"DM"},
					{"name":"Inline","value":"inline"}
				).setName("location").setDescription("Where should level up messages be sent?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Administration","Configuration","Entertainment","General","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Configure level ups",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure a server leveling system where posting gets you an amount of experience points that allow you to level up. Exp points are granted with a cooldown to discourage spamming.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		storage[cmd.guildId].levels.active=cmd.options.getBoolean("active");
		if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].levels.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getString("location")!==null) storage[cmd.guildId].levels.location=cmd.options.getString("location");
		if(cmd.options.getString("message")!==null) storage[cmd.guildId].levels.msg=checkDirty(config.homeServer,cmd.options.getString("message"),true)[1];
		var disclaimers=[];
		if(storage[cmd.guildId].levels.channel===""&&storage[cmd.guildId].levels.location==="channel"){
			storage[cmd.guildId].levels.location="DM";
			disclaimers.push(`No channel was set to post level-ups to, so I have changed the level-up notification location to DMs.`);
		}
		if(storage[cmd.guildId].levels.location!=="DM"&&!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
			storage[cmd.guildId].levels.location="DM";
			disclaimers.push(`I do not have the MANAGE_WEBHOOKS permission for this server, so I cannot post level-up messages. I have set the location for level-up notifications to DMs instead.`);
		}
		cmd.followUp(`Level ups configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	}
};
