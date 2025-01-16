const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

const dgram = require('dgram');
const os = require('os');
const { Ollama } = require('ollama');
const fs = require("fs");
console.beta = (...args) => process.env.beta && console.log(...args);

const config = require("../data/config")
const INTERFACES = config.aiNodeInterfaces;
const BROADCAST_PORT = config.aiNodePort;

let activeAIRequests = {};
let convoCache = {}; // Stored here instead of storage, since it does not need persistance

// Function to get IP and broadcast address for specified interfaces
function getInterfaceDetails(interfaceName) {
    const interfaces = os.networkInterfaces();
    const iface = interfaces[interfaceName];
    if (!iface) {
        throw new Error(`Interface ${interfaceName} not found`);
    }
    const ipv4 = iface.find((info) => info.family === 'IPv4' && !info.internal);
    if (!ipv4) {
        throw new Error(`IPv4 address not found on interface ${interfaceName}`);
    }
    const ipParts = ipv4.address.split('.').map(Number);
    const maskParts = ipv4.netmask.split('.').map(Number);
    const broadcastParts = ipParts.map((part, i) => part | (~maskParts[i] & 0xff));
    return {
        localIP: ipv4.address,
        broadcastIP: broadcastParts.join('.'),
    };
}

// Generic discovery function
async function multicastRequest(message, waitTimeMs) {
    const results = [];

    const promises = INTERFACES.map((iface) =>
        new Promise((resolve, reject) => {
            try {
                const { localIP, broadcastIP } = getInterfaceDetails(iface);
                console.beta(`Using ${iface}: IP=${localIP}, Broadcast=${broadcastIP}`);

                const server = dgram.createSocket('udp4');
                const discovered = [];

                server.bind(BROADCAST_PORT, localIP, () => {
                    server.setBroadcast(true);
                    console.beta(`Bound to ${iface} (${localIP})`);

                    const bufferMessage = Buffer.from(message);
                    server.send(bufferMessage, 0, bufferMessage.length, BROADCAST_PORT, broadcastIP, (err) => {
                        if (err) {
                            console.error(`Broadcast error on ${iface}:`, err);
                            reject(err);
                        } else {
                            console.beta(`Broadcast message sent on ${iface}`);
                        }
                    });
                });

                // Collect responses
                server.on('message', (msg, rinfo) => {
                    console.beta(`Response from ${rinfo.address}:${rinfo.port} -> ${msg.toString()}`);
                    discovered.push({ ip: rinfo.address, port: rinfo.port, data: msg.toString() });
                });

                // Close the server after the wait time
                setTimeout(() => {
                    server.close(() => {
                        console.error(`Stopped listening on ${iface}`);
                        resolve(discovered);
                    });
                }, waitTimeMs);
            } catch (error) {
                console.error(`Error on ${iface}:`, error.message);
                reject(error);
            }
        })
    );

    // Await all interface discoveries and merge results
    const allResults = await Promise.all(promises);
    allResults.forEach((result) => results.push(...result));
    return results;
}

async function getAvailableOllamaServers() {
    let ollamaInstances = [];
    const waitTimeMs = 500;
    const responses = await multicastRequest('ollama_discovery_request', waitTimeMs);
    responses.forEach(server => {
        ollamaInstances.push(new Ollama({ host: `http://${server.ip}:${server.data}` }))
    })
    console.beta(`${ollamaInstances.length} available servers`);

    // Remove servers with active requests
    ollamaInstances = ollamaInstances.filter((instance) => !activeAIRequests[instance.config.host]);

    return ollamaInstances;
}

async function getAiResponse(threadID, message, notify, retryAttempt=0) {
    // returns: [response, success]

    // First, find all currently available servers
    const ollamaInstances = await getAvailableOllamaServers();

    if (ollamaInstances.length === 0) {
        return [`Sorry, there are no available AI servers. Try again later.` + 
                `We host our own AI servers. If you would like to support this project, feel free to join the [discord server](https://discord.gg/jFCVtHJFTY) and see how you can help!`,
                false ];
    }

    // Choose a random server
    const randomIndex = Math.floor(Math.random() * ollamaInstances.length);
    const chosenInstance = ollamaInstances[randomIndex];

    // Mark the server as busy
    activeAIRequests[chosenInstance.config.host] = true;

    let response = null;

    try {
        // Build context
        const oneHour = 1000 * 60 * 60;
        if (!convoCache[threadID] || Date.now() - convoCache[threadID].lastMessage > oneHour) {
            const context = [];
            context.push({"role": "system", "content": fs.readFileSync("./data/system.prompt").toString()})
    
            convoCache[threadID] = {
                context,
                lastMessage: Date.now()
            };
        }
        convoCache[threadID].context.push({"role": "user", "content": message})

        const AIResult = await ollamaInstances[0].chat({
            model: config.aiModel,
            messages: convoCache[threadID].context,
        })

        // Check for an error
        if (!AIResult?.message?.content) {
            if (retryAttempt === 0) {
                delete convoCache[threadID];
                return getAiResponse(threadID, message, notify, retryAttempt+1);
            } else {
                notify && notify(1, `Error with AI API response: \n${JSON.stringify(AIResult)}`);
                return [`Sorry, there was an error with the AI response. It has already been reported. Try again later.`, false];
            }
        }

        convoCache[threadID].context.push(AIResult.message);
        
        response = AIResult.message.content;
    }
    catch (e) {
        notify && notify(1, `AI API response has no content: \n${e.stack}`)
        console.beta(e);
        response = `Sorry, there was an error with the AI response. It has already been reported. Try again later.`;
    }
    finally {
        // Mark the server as available
        delete activeAIRequests[chosenInstance.config.host];
    }

    return [response, true];
}

module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('chat').setDescription('Chat with Stewbot')
            .addStringOption(option=>
                option
                    .setName("message")
                    .setDescription("Message to stewbot")
                    .setRequired(true)
            )
            .addBooleanOption(option=>
                option.setName("clear").setDescription("Clear history?")
            )
            .addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),
		
		// Optional fields
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},//Where the command can be used and what kind of installs it supports
        /*
            Contexts
             - 0: Server command
             - 1: Bot's DMs
             - 2: User command

            Integration Types:
             - 0: Installed to servers
             - 1: Installed to users
        */

		// Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
		requiredGlobals: ["notify"],

		help: {
			helpCategories: ["Entertainment"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Ask Stewbot's AI something",
			detailedDesc: null
		},
	},

	async execute(cmd, globalsContext) {
		applyContext(globalsContext);

        const message = cmd.options.getString("message");
        const clearHistory = cmd.options.getBoolean("clear");
        const threadID = cmd.user.id;

        if (clearHistory) {
            delete convoCache[threadID];
        }

        const [ response, success ] = await getAiResponse(threadID, message, notify)

		cmd.followUp(response);
	}
};
