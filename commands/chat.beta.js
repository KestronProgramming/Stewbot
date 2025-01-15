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

const config = require("../data/config")
const INTERFACES = config.aiNodeInterfaces;
const BROADCAST_PORT = config.aiNodePort;

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
                console.log(`Using ${iface}: IP=${localIP}, Broadcast=${broadcastIP}`);

                const server = dgram.createSocket('udp4');
                const discovered = [];

                server.bind(BROADCAST_PORT, localIP, () => {
                    server.setBroadcast(true);
                    console.log(`Bound to ${iface} (${localIP})`);

                    const bufferMessage = Buffer.from(message);
                    server.send(bufferMessage, 0, bufferMessage.length, BROADCAST_PORT, broadcastIP, (err) => {
                        if (err) {
                            console.error(`Broadcast error on ${iface}:`, err);
                            reject(err);
                        } else {
                            console.log(`Broadcast message sent on ${iface}`);
                        }
                    });
                });

                // Collect responses
                server.on('message', (msg, rinfo) => {
                    console.log(`Response from ${rinfo.address}:${rinfo.port} -> ${msg.toString()}`);
                    discovered.push({ ip: rinfo.address, port: rinfo.port, data: msg.toString() });
                });

                // Close the server after the wait time
                setTimeout(() => {
                    server.close(() => {
                        console.log(`Stopped listening on ${iface}`);
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

module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('chat').setDescription('Chat with Stewbot').addBooleanOption(option=>
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
		requiredGlobals: [],

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

		// First, find all currently available servers
		let ollamaInstances = [];
		const message = 'ollama_discovery_request';
		const waitTimeMs = 500;
		const responses = await multicastRequest(message, waitTimeMs);
		responses.forEach(server => {
			ollamaInstances.push(new Ollama({ host: `http://${server.ip}:${server.data}` }))
		})
		console.log(`${ollamaInstances.length} available servers`);
	
		const context = [];
		context.push({"role": "system", "content": fs.readFileSync("../data/system.prompt").toString()})
		context.push({"role": "user", "content": "Hello!"})
	
		console.log(await ollamaInstances[0].ps());
	
		const rresponse = ollamaInstances[0].chat({
			model: config.aiModel,
			messages: context,
		})
		const response = await rresponse;

		console.log(response)

		cmd.followUp(response.message.content);
	}
};
