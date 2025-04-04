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
			helpCategories: [Categories.Administration, Categories.Configuration, Categories.Server_Only, Categories.Entertainment],
			shortDesc: "Configure the ability for server members to vote to mute someone",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure an emoji that users can react to a message, and once it reaches a configured threshold the user will be timeouted for the configured amount of time.`
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
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
		
		const guild = await guildByObj(cmd.guild);

		const oldEmoji = guild.groupmute;

		
		// If just moving to a different emoji
		if (oldEmoji && oldEmoji !== emoji) {
			// If the emoji is different than it already was,
			// delete the emojiboard for it since we are gonna store the groupmute there
			
			// Set new one
			guild.emojiboards.set(
				emoji, 
				guild.emojiboards.get(oldEmoji)
			);

			// Delete the old one
			guild.emojiboards.delete(oldEmoji);
		}
		if(!guild.emojiboards.has(emoji)){
			guild.emojiboards.set(emoji, {
				active: false,
				emoji:emoji,
				threshold: 5,
				length:60000*5,
				isMute:true
			});
		}

		guild.emojiboards.get(emoji).active=cmd.options.getBoolean("active");
		guild.groupmute=emoji;

		if(cmd.options.getInteger("threshold")!==null) 
			guild.emojiboards.get(emoji).threshold=cmd.options.getInteger("threshold");

		if(cmd.options.getInteger("mute_length")!==null) 
			guild.emojiboards.get(emoji).length=cmd.options.getInteger("mute_length");
		
		await guild.save();

		cmd.followUp(
			`Alright, I have configured groupmute.${
				cmd.options.getBoolean("active")
					? ` If ${parseEmoji(emoji)} is reacted ${guild.emojiboards.get(emoji).threshold} times, I'll mute the author of the message.`
					: ``
			}`
		);
    }
};
