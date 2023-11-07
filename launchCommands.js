process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder,ContextMenuCommandBuilder,ApplicationCommandType,ChannelType} = require('discord.js');

//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats'),
	new SlashCommandBuilder().setName('no_swear').setDescription('Add a word to the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to blacklist").setRequired(true)
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('re_swear').setDescription('Remove a word from the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('view_filter').setDescription('View all blacklisted words for this server').setDMPermission(false),
	new SlashCommandBuilder().setName('filter_config').setDescription('Configure the filter for this server').addBooleanOption(option=>
		option.setName("active").setDescription("Should I remove messages that contain words configured in the blacklist?").setRequired(true)
	).addBooleanOption(option=>
		option.setName("censor").setDescription("Should I remove the filtered words from the message (true), or delete the message entirely (false)?")
	).addBooleanOption(option=>
		option.setName("log").setDescription("Post a summary of filtered messages to a staff channel? (Must set 'channel' on this command if true)")
	).addChannelOption(option=>
		option.setName("channel").setDescription("Which channel should I post summaries of deleted messages to?").addChannelTypes(ChannelType.GuildText)
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("starboard_config").setDescription("Configure starboard for this server").addBooleanOption(option=>
		option.setName("active").setDescription("Should I post messages to the configured channel?").setRequired(true)
	).addChannelOption(option=>
		option.setName("channel").setDescription("The channel to post messages to (Required for first config)").addChannelTypes(ChannelType.GuildText)
	).addStringOption(option=>
		option.setName("emoji").setDescription("The emoji to react with to trigger starboard (Default: ⭐)")
	).addIntegerOption(option=>
		option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)")
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
	),

	new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);
rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
	.then(() => console.log('Launched slash commands'))
	.catch(console.error);