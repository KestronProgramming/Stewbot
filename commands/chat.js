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

// Function to send multicasts to interfaces with stewbot AI nodes
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
                        console.beta(`Stopped listening on ${iface}`); 
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

async function getAiResponse(threadID, message, contextualData={}, notify=null, retryAttempt=0, ollamaInstances=null) {
    // returns: [response, success]

    // First, find all currently available servers if they have not already been provided in the command input
    // (they are provided by the message handler so it can check avaialble servers and send typing indicator when there is an available server)
    if (!ollamaInstances) ollamaInstances = await getAvailableOllamaServers();

    if (ollamaInstances.length === 0) {
        return [`Sorry, there are no available AI servers. Try again later.\n\n` + 
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
        if (
            !convoCache[threadID] || 
            Date.now() - convoCache[threadID].lastMessage > oneHour || 
            JSON.stringify(contextualData) !== JSON.stringify(convoCache[threadID].contextualData)
        ) {
            const context = [];

            let systemPrompt = fs.readFileSync("./data/system.prompt").toString();
            if (process.env.beta) systemPrompt = systemPrompt.replace("Stewbot", "Stewbeta");
            Object.keys(contextualData).forEach((key) => {
                systemPrompt = systemPrompt.replaceAll(`{${key}}`, contextualData[key]);
            })
            context.push({"role": "system", "content": systemPrompt})

            convoCache[threadID] = {
                context,
                contextualData,
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
                return getAiResponse(threadID, message, contextualData, notify, retryAttempt+1, ollamaInstances);
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

async function postprocessUserMessage(message, guild) {
    message = message.replace(/<@!?(\d+)>/g, (match, userId) => {
        const username = guild?.members.cache.get(userId)?.user?.username;
        return username ? `@${username}` : match;
    });

    // Convert role mentions to their raw format
    message = message.replace(/<@&(\d+)>/g, (match, roleId) => {
        const rolename = guild?.roles.cache.get(roleId)?.name;
        return rolename ? `<${rolename} (discord role mention)>` : match;
    });

    // Convert channel mentions to their raw format
    message = message.replace(/<#(\d+)>/g, (match, channelId) => {
        const channelname = guild?.channels.cache.get(channelId)?.name;
        return channelname ? `<#${channelname} (discord channel)>` : match;
    });

    return message;
}

async function postprocessAIMessage(message, guild) {
    // Replace @username with <@id-of-username>
    message = message.replace(/@([\w_\.]+)/g, (match, username) => {
        const user = guild?.members.cache.find((member) => member.user.username === username);
        return user ? `<@${user.id}>` : match;
    });

    return message
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
		requiredGlobals: ["notify", "limitLength"],

		help: {
			helpCategories: ["General","Bot","Information","Entertainment"],
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
			detailedDesc: "Have a fun chat with Stewbot's self-hosted AI"
		},
	},

	async execute(cmd, globalsContext) {
		applyContext(globalsContext);

        let message = cmd.options.getString("message");
        const clearHistory = cmd.options.getBoolean("clear");
        const threadID = cmd.user.id;

        message = await postprocessUserMessage(message, cmd.guild);

        if (clearHistory) {
            delete convoCache[threadID];
        }

        let [ response, success ] = await getAiResponse(threadID, message, {
            name: cmd.user.username,
            server: cmd.guild ? cmd.guild.name : "Dirrect Messages",
        }, notify);

        response = await postprocessAIMessage(limitLength(response))
        response = checkDirty(cmd.guild?.id, response, true)[1];

        cmd.followUp({
            content: await postprocessAIMessage(limitLength(response), cmd.guild),
            allowedMentions: { parse: [] }
        });
    },

    async onmessage(msg, globals) {
        applyContext(globals);

        // If the bot is pinged
        if (
            msg.mentions.users.has(client.user.id)
            && storage[msg.author.id]?.config?.aiPings !== false // Check if the user has explicitly disabled AI pings
            && !(msg.guild && storage[msg.guild.id]?.config?.ai === false) // And as long as the guild has not explicitly disabled it
        ) {

            // Check for available servers before sending typing indicator
            const ollamaInstances = await getAvailableOllamaServers();
            if (ollamaInstances.length > 0) msg.channel.sendTyping();
            else return;

            let message = await postprocessUserMessage(msg.content, msg.guild);
            let threadID = msg.author.id;
            let [ response, success ] = await getAiResponse(threadID, message, {
                name: msg.author.username,
                server: msg.guild ? msg.guild.name : "Direct Messages",
            }, notify, 0, ollamaInstances);

            if (success) { // Only reply if it worked, don't send error codes in reply to replies
                let stillExists = true; // Message could have been deleted/filtered since sending
                try {
                    stillExists = await msg.channel.messages.fetch(msg.id)
                } catch {
                    stillExists = false
                }

                // Let's trim emojis as reactions
                var emojiEnding = /[\p{Emoji}\uFE0F]$/u; 
                var emoji = null;
                if (stillExists && emojiEnding.test(response)) {
                    emoji = response.match(emojiEnding)[0]
                    response = response.replace(emojiEnding, '')
                }

                response = await postprocessAIMessage(response, msg.guild);
                response = checkDirty(msg.guild?.id, response, true)[1];

                if (emoji) msg.react(emoji);

                // If response is > 2000 chars, split it up.
                while (response.length > 0) {
                    let chunk = response.slice(0, 2000-3);
                    response = response.slice(2000-3);
                    if (response.length > 0) chunk += "...";
                    
                    // await ((stillExists ? msg.reply : msg.channel.send)({
                    //     content: chunk,
                    //     allowedMentions: { parse: [] }
                    // }));
                    if (stillExists) {
                        await msg.reply({
                            content: chunk,
                            allowedMentions: { parse: [] },
                        });
                    } else {
                        await msg.channel.send({
                            content: chunk,
                            allowedMentions: { parse: [] },
                        });
                    }
                
                }

                // if (response) msg.reply({
                //     content: await postprocessAIMessage(response, msg.guild),
                //     allowedMentions: { parse: [] }
                // });
            
            }
        }
    }
};
