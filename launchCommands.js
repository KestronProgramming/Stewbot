process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder,ContextMenuCommandBuilder,ApplicationCommandType,ChannelType} = require('discord.js');
const fs=require("fs");

//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
//Don't enable anything in DMs that is unusable in DMs (server configurations, multiplayer reliant commands, etc)
const commands = [
	new SlashCommandBuilder().setName("help").setDescription("View the help menu"),
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats'),
	new SlashCommandBuilder().setName("filter").setDescription("Manage the filter for this server").addSubcommand(command=>
		command.setName("config").setDescription("Configure the filter for this server").addBooleanOption(option=>
				option.setName("active").setDescription("Should I remove messages that contain words configured in the blacklist?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("censor").setDescription("Should I remove the filtered words from the message (true), or delete the message entirely (false)?")
			).addBooleanOption(option=>
				option.setName("log").setDescription("Post a summary of filtered messages to a staff channel? (Must set 'channel' on this command if true)")
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel should I post summaries of deleted messages to?").addChannelTypes(ChannelType.GuildText)
			)
		).addSubcommand(command=>
			command.setName("add").setDescription('Add a word to the filter').addStringOption(option=>
				option.setName("word").setDescription("The word to blacklist").setRequired(true)
			)
		).addSubcommand(command=>
			command.setName("remove").setDescription('Remove a word from the filter').addStringOption(option=>
				option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
			)
		).addSubcommand(command=>
			command.setName("import").setDescription("Import a predetermined wordlist").addStringOption(option=>
				option.setName("strictness").setDescription("How strict should the imported words be?").addChoices(
					{"name":"Strict","value":"strict"},
					{"name":"Moderate","value":"moderate"},
					{"name":"Weak","value":"weak"}
				)
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("view_filter").setDescription("View the list of blacklisted words for this server").setDMPermission(false),
	new SlashCommandBuilder().setName("starboard_config").setDescription("Configure starboard for this server").addBooleanOption(option=>
			option.setName("active").setDescription("Should I post messages to the configured channel?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post messages to (Required for first config)").addChannelTypes(ChannelType.GuildText)
		).addStringOption(option=>
			option.setName("emoji").setDescription("The emoji to react with to trigger starboard (Default: ⭐)")
		).addIntegerOption(option=>
			option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)")
		).addStringOption(option=>
			option.setName("message_type").setDescription("What should the bot's starboard posts look like?").addChoices(
				{"name":"Make it look like the user posted","value":"0"},
				{"name":"Post an embed with the message and a greeting","value":"1"},
				{"name":"Post an embed with the message","value":"2"}
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("fun").setDescription("Posts something fun to enjoy").addSubcommand(command=>
			command.setName("meme").setDescription("Posts a meme").addIntegerOption(option=>
				option.setName("number").setDescription("Specific meme # to post (optional)")
			)
		).addSubcommand(command=>
			command.setName("joke").setDescription("Posts a joke")
		).addSubcommand(command=>
			command.setName("wyr").setDescription("Posts a Would-You-Rather question")
		).addSubcommand(command=>
			command.setName("dne").setDescription("Posts a picture of a person - who never existed! (AI Person generation)")
		).addSubcommand(command=>
			command.setName("craiyon").setDescription("Use Dall-E Mini to generate an image").addStringOption(option=>
				option.setName("prompt").setDescription("The prompt to use").setRequired(true)
			).addStringOption(option=>
				option.setName("type").setDescription("The type of image to generate").addChoices(
					{name:"Photo",value:"photo"},
					{name:"Art",value:"art"},
					{name:"Drawing",value:"drawing"},
					{name:"None",value:"none"}
				)
			).addStringOption(option=>
				option.setName("negative").setDescription("Negative words for the AI (Example: 'blue' would result in less blue)")
			)
		).addSubcommand(command=>
			command.setName("rac").setDescription("Play a game of Rows & Columns").addBooleanOption(option=>
				option.setName("help").setDescription("View the rules instead of playing?")
			).addIntegerOption(option=>
				option.setName("start").setDescription("Set your amount of rows and start playing!").setMinValue(3).setMaxValue(25)
			)
		),
	new SlashCommandBuilder().setName("kick").setDescription("Kick a user").addUserOption(option=>
			option.setName("target").setDescription("Who to kick?").setRequired(true)
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this kick?")
		).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("ban").setDescription("Ban a user").addUserOption(option=>
			option.setName("target").setDescription("Who to ban?").setRequired(true)
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this ban?")
		).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user").addUserOption(option=>
			option.setName("target").setDescription("Who to timeout?").setRequired(true)
		).addIntegerOption(option=>
			option.setName("hours").setDescription("Hours to timeout the user for?")
		).addIntegerOption(option=>
			option.setName("minutes").setDescription("Minutes to timeout the user for?")
		).addIntegerOption(option=>
			option.setName("seconds").setDescription("Seconds to timeout the user for?")
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this timeout?")
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("translate").setDescription("Translate a string of text").addStringOption(option=>
			option.setName("what").setDescription("What to translate").setRequired(true)
		).addStringOption(option=>
			option.setName("language_from").setDescription("The language the original text is in (Default: autodetect)")
		).addStringOption(option=>
			option.setName("language_to").setDescription("The language you want the text translated into (Default: en)")
		),
	new SlashCommandBuilder().setName("define").setDescription("Get the definition for a word").addStringOption(option=>
		option.setName("what").setDescription("What to define").setRequired(true)
	),
	new SlashCommandBuilder().setName("counting").setDescription("Manage counting functions for this server").addSubcommand(command=>
			command.setName("config").setDescription("Configure counting for this server").addBooleanOption(option=>
				option.setName("active").setDescription("Do counting things in this server?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Channel to count in")
			).addBooleanOption(option=>
				option.setName("reset").setDescription("Reset the count if a wrong number is posted (True to be on leaderboard)")
			).addBooleanOption(option=>
				option.setName("public").setDescription("Do you want this server to show up in the counting leaderboard?")
			).addIntegerOption(option=>
				option.setName("posts_between_turns").setDescription("How many posts do you need to wait between turns?")
			)
		).addSubcommand(command=>
			command.setName("set_number").setDescription("Set the next number to count at (Disqualifies from leaderboard)").addIntegerOption(option=>
				option.setName("num").setDescription("The number to count at next")
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("next_counting_number").setDescription("View the next number to count at").setDMPermission(false),
	new SlashCommandBuilder().setName("counting_leaderboard").setDescription("View the top ten counting servers"),
	new SlashCommandBuilder().setName("search").setDescription("Search the internet for a query").addStringOption(option=>
			option.setName("query").setDescription("The query to search for").setRequired(true)
		),
	new SlashCommandBuilder().setName("invite_tracking_config").setDescription("Configure invite tracking").addBooleanOption(option=>
			option.setName("active").setDescription("Track invites").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post updates to").setRequired(true)
		).setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog).setDMPermission(false),
	new SlashCommandBuilder().setName("general_config").setDescription("Configure general behaviors").addBooleanOption(option=>
			option.setName("ai_pings").setDescription("Have the bot post an AI message when pinging it?")
		).addBooleanOption(option=>
			option.setName("embeds").setDescription("If a message link is posted, should I post a preview?")
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("personal_config").setDescription("Configure the bot for you personally").addBooleanOption(option=>
			option.setName("ai_pings").setDescription("Respond with an AI message to pings or DMs")
		).addBooleanOption(option=>
			option.setName("dm_infractions").setDescription("If you get filtered, should I DM you what was filtered?")
		).addBooleanOption(option=>
			option.setName("embeds").setDescription("If you link a Discord message, should I embed a preview for you?")
		),
	new SlashCommandBuilder().setName("poll").setDescription("Make a poll with automatically tracked options").addStringOption(option=>
			option.setName("prompt").setDescription("The prompt (We'll set options in a minute)").setRequired(true)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("ticket").setDescription("Set up a ticket system for users to contact mods").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).setDMPermission(false),
	new SlashCommandBuilder().setName("auto-join-message").setDescription("Set up a message to be sent automatically when a user joins").addBooleanOption(option=>
			option.setName("active").setDescription("Should I send a message when the user joins?").setRequired(true)
		).addStringOption(option=>
			option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to mention the user)")
		).addStringOption(option=>
			option.setName("channel_or_dm").setDescription("Should I post this message in a channel or the user's DMs?").addChoices(
				{"name":"Channel","value":"channel"},
				{"name":"DM","value":"dm"}
			)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post the message to")
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("auto_roles").setDescription("Setup a message with auto roles").addStringOption(option=>
			option.setName("message").setDescription("The message to be sent with the role options").setRequired(true)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).setDMPermission(false),
	new SlashCommandBuilder().setName("report_problem").setDescription("Report an error to be looked at").addStringOption(option=>
			option.setName("type").setDescription("What kind of problem are you reporting?").addChoices(
				{"name":"Profanity","value":"profanity"},
				{"name":"Controversial","value":"controversy"},
				{"name":"Bug or Error","value":"bug"},
				{"name":"Suggestion","value":"suggestion"},
				{"name":"Exploit","value":"exploit"},
				{"name":"Other","value":"other"}
			).setRequired(true)
		).addStringOption(option=>
			option.setName("details").setDescription("Can you please provide us some details?").setRequired(true)
		),

	new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("delete_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),//Leaving this in DMs to delete undesirable bot DMs
	new ContextMenuCommandBuilder().setName("translate_message").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("move_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);
var comms={};
rest.put(Routes.applicationCommands(process.env.clientId),{body:commands}).then(d=>{
	d.forEach(c=>{
		comms[c.name]=`</${c.name}:${c.id}>`;
		if(c.hasOwnProperty("options")){
			c.options.forEach(o=>{
				if(o.type===1){
					comms[`${c.name} ${o.name}`]=`</${c.name} ${o.name}:${c.id}>`
				}
			});
		}
	});
	fs.writeFileSync("./commands.json",JSON.stringify(comms));
	console.log("Updated commands and wrote command mentions to ./commands.json");
}).catch(console.error);