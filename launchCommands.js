process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder} = require('discord.js');

//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats'),
	new SlashCommandBuilder().setName('no_swear').setDescription('Add a word to the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to blacklist").setRequired(true)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('re_swear').setDescription('Remove a word from the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('view_filter').setDescription('View all blacklisted words for this server').setDMPermission(false),
	new SlashCommandBuilder().setName('filter_config').setDescription('Configure the filter for this server').addBooleanOption(option=>
		option.setName("active").setDescription("Should I remove words configured in the blacklist?").setRequired(true)
	).addBooleanOption(option=>
		option.setName("censor").setDescription("Should I remove the filtered words from the message (true), or delete the message entirely (false)?")
	).addBooleanOption(option=>
		option.setName("log").setDescription("Post a summary of filtered messages to a staff channel? (Must set 'channel' on this command if true)")
	).addChannelOption(option=>
		option.setName("channel").setDescription("Which channel should I post summaries of deleted messages to?")
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);

rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
	.then(() => console.log('Launched slash commands'))
	.catch(console.error);