if (!process.env.token) require("./setEnvs.js");

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const config = require("./data/config.json");
const crypto = require("crypto");

// Safely load utils, even if it relies on commands not yet launched.
injectCmdsProxy();
const { notify } = require("./utils");
restoreCmds();

const md5 = (str) => crypto.createHash("md5").update(str)
    .digest("hex");

/**
 * Importing command files relies on `global.cmds` being defined.
 * Because an unlaunched command is not already defined in commands.json,
 *   to safely load commands we need to have a dummy proxy that still lets it call the .mention fields on import without crashing.
 */
function injectCmdsProxy() {
    if (global.cmds) return; // Don't inject unless needed

    // Save original commands, without accidentally overriding them with the proxy.
    global.oldCmds = global.oldCmds || global.cmds;

    // @ts-ignore TS is mad that this is a proxy.
    global.cmds = new Proxy({}, {
        get: function(target, prop) {
            if (prop === "mention") {
                return "";
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

/**
 * Build command object of all command modules
 * handle beta/production
 */
async function getCommands(autoRelaunch = true) { // launching runs getCommands, so we need to pass false to avoid infinite recursion
    const returnCommands = {};
    try {
        const files = await fsPromises.readdir("./commands");
        const { disabledModules } = require("./setEnvs");

        // Process files concurrently
        await Promise.all(
            files.map(async (filename) => {
                if (disabledModules.has(filename)) {
                    notify(`Skipping loading ${filename} due to missing environment variables.`, true);
                };

                if (path.extname(filename) === ".js") {
                    let commandName = "<unloaded>";
                    try {
                        commandName = path.parse(filename).name;
                        let command;

                        // Only load beta commands on beta
                        if (commandName.includes(".beta")) {
                            if (process.env.beta) {
                                // Load command before we strip the .beta out of the filename
                                command = await import(`./commands/${commandName}.js`);

                                // Store this command under the normal name/location
                                commandName = commandName.replaceAll(".beta", "");

                                console.log(`Loading beta command "${commandName}"`);
                            }
                            else {
                                // If production, ignore beta commands
                                return; // Use return to skip the current file
                            }
                        }
                        else {
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

                        // console.log(`Loaded command file: "${commandName}"`);
                    }
                    catch (importError) {
                        try { notify(`Command ${commandName} failed to load`, true); }
                        catch {}
                        console.log(`Error importing command "${commandName}":`, importError);
                    }
                }
            })
        );

        // restoreCmds();

        // If beta, relaunch commands if they changed
        if (autoRelaunch && process.env.beta) {
            const currentCommandsHash = md5(
                JSON.stringify(
                    Object.entries(returnCommands)
                        .map(c => c[1].data.command)
                        .filter(c => c)
                )
            );
            if (global.cmds._hash !== currentCommandsHash) {
                console.log("Command data change detected, relaunching");
                launchCommands(currentCommandsHash);
            };
        }

        return returnCommands;
    }
    catch (err) {
        console.error("Error reading directory:", err);
        return {}; // Or throw the error, depending on how you want to handle it
    }
}

// Fetch command data for API
function getCommandAPIData() {
    injectCmdsProxy();

    // Build commands for API in a promise
    const commandsPromise = getCommands(false).then(async (migratedCommands) => {
        // Build command info from slash commands
        const extraInfo = {};
        let commands = [];

        for (let commandName in migratedCommands) {
            const module = migratedCommands[commandName];
            // Get base discord.js command
            if (module?.data?.command) {
                let commandData = module.data.command;
                // Inject sudo field
                if (module.data.sudo) commandData.sudo = true;
                // Push to commands list
                commands.push(commandData);
            }
            // Inject extras
            if (module?.data?.extra) {
                extraInfo[commandName] = module.data.extra;
            }
        }

        // Inject any extra data that discord.js doesn't support natively
        commands = commands.map(command =>
            Object.assign(command.toJSON(), extraInfo[command.toJSON().name])
        );

        return commands;
    });

    restoreCmds();

    return commandsPromise;
}

async function launchCommands(hash) {
    const commands = await getCommandAPIData();
    let globalCommands = commands.filter(cmd => !cmd.sudo);

    // Register
    const rest = new REST({ version: "9" }).setToken(process.env.beta ? process.env.betaToken : process.env.token );
    var comms = {};

    let data = await rest.put(
        Routes.applicationCommands(process.env.beta ? process.env.betaClientId || process.env.clientId : process.env.clientId),
        { body: globalCommands }
    ).catch(notify);

    // @ts-ignore
    for (const commandData of data) {
        comms[commandData.name] = {
            mention: `</${commandData.name}:${commandData.id}>`,
            id: commandData.id,
            name: commandData.name,
            description: commandData.description,
            contexts: commandData.contexts,
            integration_types: commandData.integration_types,
            type: commandData.type,
            default_member_permissions: commandData.default_member_permissions
        };
        if ("options" in commandData) {
            commandData.options.forEach(option => {
                if (option.type === 1) {
                    comms[commandData.name][option.name] = {
                        mention: `</${commandData.name} ${option.name}:${commandData.id}>`,
                        id: commandData.id,
                        name: option.name,
                        description: option.description,
                        contexts: commandData.contexts || [0], // Default to server only
                        integration_types: commandData.integration_types || [0], // Default to server only
                        type: option.type,
                        default_member_permissions: commandData.default_member_permissions
                    };
                }
            });
        }
    };

    // Idk what this is doing, something to do with the detecting if cmds has changed system
    if (hash) comms._hash = hash;

    await fs.promises.writeFile("./data/commands.json", JSON.stringify(comms, null, 4));

    // Register stewbot-devadmin-only commands
    let sudoOnlyCommands  = commands
        .filter(cmd => cmd.sudo)
        .map(data => ({ ...data, sudo: undefined })); // Remove sudo field so API doesn't panic

    await rest.put(
        Routes.applicationGuildCommands(process.env.beta ? process.env.betaClientId : process.env.clientId, config.homeServer),
        { body: sudoOnlyCommands }
    );

    return "Updated commands on Discord and wrote commands to ./commands.json";
}

module.exports = { launchCommands, getCommands };

// Run if being run directly, register commands
if (require.main == module) {
    launchCommands().then( re =>
        console.log(re)
    )
        .finally( _ =>
            process.exit() // needed since mongo is connected and keeps it alive
        );
}
