if (!process.env.token || !process.env.betaToken) process.env = require("./env.json");

injectCmdsProxy()
const { REST, Routes, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path")
const config = require("./data/config.json");
const crypto = require('crypto');
const { notify } = require("./utils");
restoreCmds()

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

function injectCmdsProxy() {
	if (global.cmds) return; // Don't inject unless needed

	// Importing command files relies on `global.cmds` being defined.
	// Because an unlaunched command is not already defined in cmds per it's nature,
	//   (for example of we just added cmds.new_command and modified cmds.old_command to reference cmds.new_command),
	//   to safely load these we need to have a dummy proxy that still lets it call the .mention fields without crashing.

	// Save original commands, without accidentally overriding them with the proxy.
	global.oldCmds = global.oldCmds || global.cmds;

	const cmds = global.cmds = new Proxy({}, {
		get: function (target, prop) {
			if (prop === 'mention') {
				return '';
			}
			return global.cmds;
		}
	});
}

function restoreCmds() {
	if (!global.oldCmds) return;
	global.cmds = global.oldCmds;
	delete global.oldCmds;
}

// Function to build command files, handle beta/production
async function getCommands(autoRelaunch=true) { // launching runs getCommands, so we need to pass false to avoid infinite recursion
	const returnCommands = {};
	try {
		const files = await fsPromises.readdir("./commands");

		injectCmdsProxy()

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
								command = await import(`./commands/${commandName}.js`);

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
							command = await import(`./commands/${commandName}.js`);
						}

						// Tack on filename into command for convenience. 
						command.default.name = command.default.name || commandName;

						returnCommands[commandName] = command?.default || command; // `import` throws the module under the `default` tag
					} catch (importError) {
						try { notify(`Command ${commandName} failed to load`, true) } catch{}
						console.log(`Error importing command "${commandName}":`, importError);
					}
				}
			})
		);

		restoreCmds()

		// If beta, relaunch commands if they changed
		if (autoRelaunch && process.env.beta) {
			const currentCommandsHash = md5(
				JSON.stringify(
					Object.entries(returnCommands)
						.map(c => c[1].data.command)
						.filter(c=>c)
				)
			);
			if (global.cmds._hash !== currentCommandsHash) {
				console.log("Command data change detected, relaunching")
				launchCommands(currentCommandsHash);
			};
		}

		return returnCommands;
	} catch (err) {
		console.error("Error reading directory:", err);
		return {}; // Or throw the error, depending on how you want to handle it
	}
}

// Fetch command data for API
function getCommandAndExtraData() {
	injectCmdsProxy();

	// Build commands for API in a promise
	const commandsPromise = new Promise(async (resolve, reject) =>{
		try {
			// Build command info from slash commands
			const extraInfo = {};
			const migratedCommands = await getCommands(false);   // commands
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

	restoreCmds();

	return commandsPromise;
}

async function launchCommands(hash) {
	const commands = await getCommandAndExtraData();

	// Register
	const rest = new REST({ version: '9' }).setToken(process.env.beta ? process.env.betaToken : process.env.token );
	var comms={};
	await rest.put(Routes.applicationCommands(process.env.beta ? process.env.betaClientId || process.env.clientId : process.env.clientId),{body:commands}).then(d=>{
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
		// const commandsHash = md5(
		// 	JSON.stringify(
		// 		Object.entries(commands)
		// 			.map(c => c[1])
		// 			.filter(c=>c)
		// 	)
		// )
		if (hash) comms._hash = hash;
		fs.writeFileSync("./data/commands.json", JSON.stringify(comms, null, 4));
	}).catch((error) => {
		console.error(error);
	});

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
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
			
		new SlashCommandBuilder()
			.setName('launch_commands')
			.setDescription('Relaunch commands')
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

		new SlashCommandBuilder()
			.setName('update_in_server')
			.setDescription('API heavy - sync our storage database with up to date information by scanning every single guild')
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

		new SlashCommandBuilder()
			.setName('motd')
			.setDescription(`Change the bot's status`)
			.addSubcommand(subcommand =>
				subcommand
					.setName("add")
					.setDescription("Add a new status message")
					.addStringOption(option => 
						option
							.setName("status")
							.setDescription("The status message")
							.setRequired(true)
					)
			)
			.addSubcommand(subcommand => 
				subcommand
					.setName("remove")
					.setDescription("Remove a status message")
					.addStringOption(option => 
						option
							.setName("status")
							.setDescription("The status message")
							.setRequired(true)
							.setAutocomplete(true)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName("delay")
					.setDescription("Set the cycle delay")
					.addNumberOption(option => 
						option
							.setName("milliseconds")
							.setDescription("The time in milliseconds between statuses")
							.setRequired(true)
					)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			
	]
	rest.put(
		Routes.applicationGuildCommands(process.env.beta ? process.env.betaClientId : process.env.clientId, config.homeServer),
		{ body: devadminCommands },
	);

	return "Updated commands on Discord and wrote commands to ./commands.json";
}

module.exports = { launchCommands, getCommands };

// Run if being run directly, register commands
if (require.main == module) {
	launchCommands().then( re => 
		console.log(re)
	).finally( _ => 
		process.exit() // needed since mongo is connected and keeps it alive
	)
}