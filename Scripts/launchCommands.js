process.env = require("../env.json");
const { REST, Routes, PermissionFlagsBits, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, ChannelType } = require('discord.js');
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path")
const config = require("../data/config.json");

// Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)

// Function to build command files, handle beta/production
async function getCommands() {
	const returnCommands = {};
	try {
		const files = await fsPromises.readdir("./commands");

		// Process files concurrently
		await Promise.all(
			files.map(async (filename) => {
				if (path.extname(filename) === ".js") {
					let commandName = "<unloaded>";
					try {
						commandName = path.parse(filename).name;
						let command;

						// Beta command handling logic
						if (commandName.includes(".beta")) {
							if (process.env.beta) {
								// Load command before we strip the .beta out of the filename
								command = await import(`../commands/${commandName}.js`);

								// Store this command under the normal name/location
								commandName = commandName.replaceAll(".beta", "");
								
								console.log(`Loading beta command "${commandName}"`);
							} else {
								// If production, ignore beta commands
								return; // Use return to skip the current file
							}
						} else {
							// If this is a non-beta file, check that there isn't a beta version before loading this one
							if (files.includes(`${commandName}.beta.js`)) {
								return; // Use return to skip the current file
							}
							// Load this normal command
							command = await import(`../commands/${commandName}.js`);
						}

						returnCommands[commandName] = command?.default || command; // `import` throws the module under the `default` tag
					} catch (importError) {
						notify(`Command ${commandName} failed to load`, true)
						console.error(`Error importing command "${commandName}":`, importError);
					}
				}
			})
		);

		return returnCommands;
	} catch (err) {
		console.error("Error reading directory:", err);
		return {}; // Or throw the error, depending on how you want to handle it
	}
}

// Fetch command data for API
function getCommandAndExtraData() {
	// Save original commands
	const oldCmds = global.cmds;

	// Command imports rely on `global.cmds` being defined.
	// Because an unregistered command is not already defined, to load it we need to have a dummy proxy that still lets it load the .mention fields without crashing
	global.cmds = new Proxy({}, {
		get: function(target, prop) {
			if (prop === 'mention') {
				return '';
			}
			return global.cmds;
		}
	});

	// Build commands for API in a promise
	let commands = []
	const commandsPromise = new Promise(async (resolve, reject) =>{
		try {
			// Build command info from slash commands
			const extraInfo = {};
			const migratedCommands = await getCommands();   // commands
			let commands = [];                        // list we're gonna build into data needed for discord API
			for (let commandName in migratedCommands) {
				const command = migratedCommands[commandName];
				if (command?.data?.command) {
					commands.push(command.data.command);
				}
				if (command?.data?.extra) {
					extraInfo[commandName] = command.data.extra;
				}
			}

			// Inject any extra data that discord.js doesn't support natively
			commands = commands.map(command => Object.assign(command.toJSON(),extraInfo[command.toJSON().name]));

			resolve(commands);
		} catch (e) {
			reject(e);
		}
	});

	// Once we're done, set global.cmds back to what it was before.
	// Ideally, after calling launchCommands, the code will also set global.cmds to the new outputted file.
	commandsPromise.then( _ => 
		global.cmds = oldCmds
	)

	return commandsPromise;
}

async function launchCommands() {
	const commands = await getCommandAndExtraData();

	// Register
	const rest = new REST({ version: '9' }).setToken(process.env.beta ? process.env.betaToken : process.env.token );
	var comms={};
	await rest.put(Routes.applicationCommands(process.env.clientId),{body:commands}).then(d=>{
		d.forEach(c=>{
			comms[c.name]={
				mention:`</${c.name}:${c.id}>`,
				id:c.id,
				name:c.name,
				description:c.description,
				contexts:c.contexts,
				integration_types:c.integration_types,
				type:c.type,
				default_member_permissions:c.default_member_permissions
			};
			if(c.hasOwnProperty("options")){
				c.options.forEach(o=>{
					if(o.type===1){
						comms[c.name][o.name]={
							mention:`</${c.name} ${o.name}:${c.id}>`,
							id:c.id,
							name:o.name,
							description:o.description,
							contexts:c.contexts,
							integration_types:c.integration_types,
							type:o.type,
							default_member_permissions:c.default_member_permissions
						};
					}
				});
			}
		});
		fs.writeFileSync("./data/commands.json",JSON.stringify(comms));
	}).catch(console.error);

	// Register stewbot-devadmin-only commands
	const devadminCommands = [
		new SlashCommandBuilder()
			.setName('restart')
			.setDescription('Restart the bot')
			.addBooleanOption(option=>
				option.setName("update").setDescription("Update git and npm before restarting").setRequired(true)
			)
			.addBooleanOption(option=>
				option.setName("update_commands").setDescription("Update registered commands on discord").setRequired(false)
			),
		new SlashCommandBuilder()
			.setName('launch_commands')
			.setDescription('Relaunch commands')
	]
	rest.put(
		Routes.applicationGuildCommands(process.env.clientId, config.homeServer),
		{ body: devadminCommands },
	);

	return "Updated commands on Discord and wrote commands to ./commands.json";
}

// Run if being run directly
if (require.main == module) {
	launchCommands().then( re => 
		console.log(re)
	).finally( _ => 
		process.exit() // needed since mongo is connected and keeps it alive
	)
}
else {
	module.exports = { launchCommands, getCommands };
}