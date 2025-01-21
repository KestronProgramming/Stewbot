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
		command: new SlashCommandBuilder().setName("groupmute_config").setDescription("Configure the ability for server members to vote to mute someone").addBooleanOption(option=>
				option.setName("active").setDescription("Is groupmute enabled?").setRequired(true)
			).addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to react with to trigger the mute").setRequired(true)
			).addIntegerOption(option=>
				option.setName("threshold").setDescription("How many reactions are needed to trigger the mute? (Default: 5)").setMinValue(1)
			).addIntegerOption(option=>
				option.setName("mute_length").setDescription("How long should they be muted for? (Default: 5 mins)").addChoices(
					{name:"1 min",value:60000},
					{name:"5 min",value:60000*5},
					{name:"10 min",value:600000},
					{name:"1 hour",value:60000*60},
					{name:"1 day",value:60000*60*24}
				)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
		
		// Optional fields
		extra: {"contexts":[0],"integration_types":[0]},
		requiredGlobals: ["parseEmoji", "getEmojiFromMessage"],

		help: {
			helpCategories: ["Administration","Configuration","Server Only","Entertainment"],
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
			shortDesc: "Configure the ability for server members to vote to mute someone",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure an emoji that users can react to a message, and once it reaches a configured threshold the user will be timeouted for the configured amount of time.`
		}
	},

	async execute(cmd, context) {
		applyContext(context);
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ModerateMembers)){
			cmd.followUp(`I can't help with groupmutes because I don't have the ModerateMembers permission.`);
			return;
		}
		var emoji = getEmojiFromMessage(cmd.options.getString("emoji"));
		if(!emoji) {
			cmd.followUp("That emoji is not valid.");
			return;
		}
		if(storage[cmd.guildId].hasOwnProperty("groupmute")&&storage[cmd.guildId].groupmute!==emoji){
			storage[cmd.guildId].emojiboards[emoji]=structuredClone(storage[cmd.guildId].emojiboards[storage[cmd.guildId].groupmute]);
			delete storage[cmd.guildId].emojiboards[storage[cmd.guildId].groupmute];
		}
		if(!storage[cmd.guildId].emojiboards.hasOwnProperty(emoji)){
			storage[cmd.guildId].emojiboards[emoji]={
				active: false,
				emoji:emoji,
				threshold: 5,
				length:60000*5,
				isMute:true
			};
		}
		storage[cmd.guildId].emojiboards[emoji].active=cmd.options.getBoolean("active");
		storage[cmd.guildId].groupmute=emoji;
		if(cmd.options.getInteger("threshold")!==null) storage[cmd.guildId].emojiboards[emoji].threshold=cmd.options.getInteger("threshold");
		if(cmd.options.getInteger("mute_length")!==null) storage[cmd.guildId].emojiboards[emoji].length=cmd.options.getInteger("mute_length");
		
		cmd.followUp(`Alright, I have configured groupmute.${cmd.options.getBoolean("active")?` If ${parseEmoji(emoji)} is reacted ${storage[cmd.guild.id].emojiboards[emoji].threshold} times, I'll mute the author of the message.`:``}`);
    }
};
