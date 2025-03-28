// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

function getStarMsg(msg){
	var starboardHeaders = [
		`Excuse me, there is a new message.`,
		`I have detected a notification for you.`,
		`Greetings, esteemed individuals, a new message has achieved popularity.`,
		`Here's the mail it never fails`,
		`Detected popularity. Shall I put it on screen for you?`,
		`And now it's time for a word from our sponsor.`,
		`Got a message for you.`,
		`It's always a good day when @ posts`
	];
	return `**${starboardHeaders[Math.floor(Math.random()*starboardHeaders.length)].replaceAll("@",msg.member?.nickname||msg.author?.globalName||msg.author?.username||"this person")}**`;
}

export default {
	getStarMsg,
	
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("add_emojiboard").setDescription("Create a new emojiboard")
			.addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to react with to trigger the emojiboard").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post the emojiboard in").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addIntegerOption(option=>
				option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)").setMinValue(1)
			).addStringOption(option=>
				option.setName("message_type").setDescription("What should the bot's starboard posts look like?").addChoices(
					{"name":"Make it look like the user posted","value":"0"},
					{"name":"Post an embed with the message and a greeting","value":"1"},
					{"name":"Post an embed with the message","value":"2"}
				)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		requiredGlobals: ["parseEmoji", "getEmojiFromMessage"],

		help: {
			helpCategories: ["General","Configuration","Entertainment","Server Only"],
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
			shortDesc: "Create a new emojiboard",
			detailedDesc: 
				`Adds an emojiboard for Stewbot to run. If the emoji you choose is reacted enough times on a message (configurable threshold), then it will be posted to a highlights reel channel of your choosing.\n
				You can choose if Stewbot should display a random message and an embed with the message, just an embed with the message, or use webhooks to appear as if the user who originally made the post in question posted it there themselves.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.id){
			cmd.followUp("Something is wrong");
			return;
		}
		var emoji = getEmojiFromMessage(cmd.options.getString("emoji"));
		if(!emoji) {
			cmd.followUp("That emoji is not valid.");
			return;
		}
		if(storage[cmd.guildId].groupmute===emoji){
			cmd.followUp(`That emoji is in use for groupmute.`);
			return;
		}
		storage[cmd.guildId].emojiboards[emoji] = {
			channel: cmd.options.getChannel("channel").id,
			active: true,
			threshold: cmd.options.getInteger("threshold") || 3,
			messType: cmd.options.getString("message_type"),
			posted: {},
			posters:{}
		};
		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji added.");
    }
};
