process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder} = require('discord.js');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats'),
	new SlashCommandBuilder().setName('no_swear').setDescription('Add a word to the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to blacklist").setRequired(true)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('re_swear').setDescription('Remove a word from the filter').addStringOption(option=>
		option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
	).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName('view_filter').setDescription('View all blacklisted words for this server').setDMPermission(false)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);

rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
	.then(() => console.log('Launched slash commands'))
	.catch(console.error);