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
			helpCategory: "Administration",
			helpDesc: "Configure a message to be sent either in a channel or the user's DMs whenever a user leaves",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!storage[cmd.guildId].hasOwnProperty("alm")){
			storage[cmd.guild.id].alm=structuredClone(defaultGuild.alm);
		}
		storage[cmd.guildId].alm.active=cmd.options.getBoolean("active");
		storage[cmd.guildId].alm.channel=cmd.options.getChannel("channel").id;
		var disclaimers=[];
		if(!client.channels.cache.get(storage[cmd.guildId].alm.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
			storage[cmd.guildId].alm.active=false;
			disclaimers.push(`I can't post in the specified channel, so I cannot run auto leave messages.`);
		}
		if(cmd.options.getString("message")!==null) storage[cmd.guildId].alm.message=checkDirty(config.homeServer,cmd.options.getString("message"),true)[1];
		cmd.followUp(`Auto leave messages configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	}
};
