process.env=require("./env.json");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST,Routes} = require('discord.js');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats')
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.token);

rest.put(Routes.applicationCommands(process.env.clientId), { body: commands })
	.then(() => console.log('Launched slash commands'))
	.catch(console.error);