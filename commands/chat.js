// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { limitLength, notify } = require("../utils.js")
const dgram = require('dgram');
const os = require('os');
const { Ollama } = require('ollama');
const fs = require("fs");
const { ApplicationCommandOptionType } = require("discord.js")
const ms = require("ms");
const NodeCache = require("node-cache");
const { checkDirty } = require("./filter");

console.beta = (...args) => process.env.beta && console.log(...args);

const config = require("../data/config.json")
const INTERFACES = config.aiNodeInterfaces;
const BROADCAST_PORT = config.aiNodePort;

// Server IPs and User IDs who need to wait for the requests to finish - this clears after 2 min in case of an error
let activeAIRequests = new NodeCache({ stdTTL: ms("5m")/1000, checkperiod: 120 });

// Non-persistent store of convos with users 
let convoCache = {};


// Setup Gemini
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.geminiAPIKey);

function resetAIRequests() {
    // Sometimes this can get off - TODO: use ollama.ps to reset when the model is unloaded
    activeAIRequests.flushAll()
}

//#region Tools

// Setup discord -> tool calling functions
const GeminiType = {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
};

// Mapping from Discord ApplicationCommandOptionType enum values
// https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandOptionType
function discordTypeToGeminiType(discordType) {
    switch (discordType) {
        case 3: return SchemaType.STRING; // STRING
        case 4: return SchemaType.INTEGER; // INTEGER
        case 5: return SchemaType.BOOLEAN; // BOOLEAN
        case 6: return SchemaType.STRING; // USER (ID or mention)
        case 7: return SchemaType.STRING; // CHANNEL (ID or mention)
        case 8: return SchemaType.STRING; // ROLE (ID or mention)
        case 9: return SchemaType.STRING; // MENTIONABLE
        case 10: return SchemaType.NUMBER; // NUMBER
        case 11: return SchemaType.STRING; // ATTACHMENT (ID or URL placeholder)
        default:
            console.warn(`Unknown Discord option type: ${discordType}. Defaulting to STRING.`);
            return GeminiType.STRING; // Fallback
    }
}

function processParameterOptions(discordOptions) {
    const parameters = {
        type: GeminiType.OBJECT, // Or Type.OBJECT
        properties: {},
        required: [],
    };

    if (!discordOptions || !Array.isArray(discordOptions)) {
        // No parameters, return empty structure
        // Gemini requires 'parameters', even if empty
        delete parameters.required;
        return parameters;
    }

    for (const paramOption of discordOptions) {
        const paramName = paramOption.name;
        // Fallback description if none provided
        const paramDesc = paramOption.description || `Parameter ${paramName}`;

        // Enhance description with constraints
        let enhancedDesc = paramDesc;
        if (paramOption.channel_types) {
            enhancedDesc += ` (Channel types: ${paramOption.channel_types.join(', ')})`; // You might map numbers to names
        }
        if (paramOption.min_length !== undefined) {
            enhancedDesc += ` (Min length: ${paramOption.min_length})`;
        }
        if (paramOption.max_length !== undefined) {
            enhancedDesc += ` (Max length: ${paramOption.max_length})`;
        }
        if (paramOption.choices && Array.isArray(paramOption.choices)) {
            const choiceList = paramOption.choices.map(c => `'${c.name}' (${c.value})`).join(', ');
            enhancedDesc += ` (Choices: ${choiceList})`;
        }
        // Add min/max value if applicable (for NUMBER/INTEGER types if present in your data)

        parameters.properties[paramName] = {
            type: discordTypeToGeminiType(paramOption.type),
            description: enhancedDesc,
        };

        if (paramOption.required) {
            parameters.required.push(paramName);
        }
    }

    // If there are no required parameters, Gemini might prefer omitting the 'required' array
    if (parameters.required.length === 0) {
        delete parameters.required;
    }
    
    // Keep properties object even if empty, Gemini seems to require it.
    // if (Object.keys(parameters.properties).length === 0) {
    //    delete parameters.properties;
    //}

    return parameters;
}

function convertCommandsToTools(commandsLoaded) {
    const tools = [];

    for (const commandName in commandsLoaded) {
        const commandDefinition = commandsLoaded[commandName];
        if (!commandDefinition?.data?.command) continue; // Skip malformed

        const commandData = commandDefinition.data;
        const mainCommand = commandData.command;
        const helpData = commandData.help || {};

        const hasOptions = mainCommand.options && Array.isArray(mainCommand.options) && mainCommand.options.length > 0;
        let isSubcommandBased = false;

        if (hasOptions) {
            // Check if the *first* option looks like a subcommand (has nested options or specific type)
            // Relying on nested 'options' seems most reliable based on your examples.
            const firstOption = mainCommand.options[0];
            // Type 1 = SUB_COMMAND, Type 2 = SUB_COMMAND_GROUP
            // if (firstOption.type === 1 || firstOption.type === 2 || (firstOption.options && Array.isArray(firstOption.options))) {
            if (firstOption.options && Array.isArray(firstOption.options)) { // Simplified check based on examples
                isSubcommandBased = true;
            }
        }

        if (isSubcommandBased) {
            // --- Process Subcommands ---
            for (const subCommandOption of mainCommand.options) {
                // Ensure it's definitely a subcommand structure before processing
                if (subCommandOption.options && Array.isArray(subCommandOption.options)) {
                    const toolName = `${commandName}_${subCommandOption.name}`;
                    // Use specific help description if available, otherwise subcommand description
                    const toolDescription = helpData[subCommandOption.name]?.detailedDesc || subCommandOption.description || `Executes the ${toolName} action.`;

                    const parameters = processParameterOptions(subCommandOption.options); // Process its parameters

                    const tool = {
                        name: toolName,
                        description: toolDescription,
                        parameters: parameters,
                    };
                    tools.push(tool);
                } else {
                    // Handle cases where a command might unexpectedly mix subcommands and direct parameters
                    console.warn(`Command '${commandName}' has an option '${subCommandOption.name}' that looks like a direct parameter mixed with subcommands. Skipping.`);
                }
            }
        } else {
            // --- Process as Main Command (with or without parameters) ---
            const toolName = commandName;
            // For non-subcommand commands, the 'help' object directly contains the details (if structured like admin_message)
            // Or fallback to main command description
            const toolDescription = helpData?.detailedDesc || mainCommand.description || `Executes the ${toolName} command.`;

            // Process the main command's options (which are direct parameters)
            const parameters = processParameterOptions(mainCommand.options); // Pass options directly

            const tool = {
                name: toolName,
                description: toolDescription,
                parameters: parameters, // Contains parameters if mainCommand.options existed, empty otherwise
            };
            tools.push(tool);
        }
    }

    return tools;
}
//#endregion

//#region Networking
// Function to get IP and broadcast address for specified interfaces
function getInterfaceDetails(interfaceName) {
    const interfaces = os.networkInterfaces();
    const iface = interfaces[interfaceName];
    if (!iface) {
        if (process.env.beta) return null;
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
                const interfaceDetails = getInterfaceDetails(iface);
                if (!interfaceDetails) {
                    resolve([]); // Beta clones don't have the same interface setup
                    return null;
                }
                const { localIP, broadcastIP } = interfaceDetails;
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
    ollamaInstances = ollamaInstances.filter((instance) => !activeAIRequests.get(instance.config.host));

    return ollamaInstances;
}
//#endregion

//#region AI
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

    // qwen2.5 overuses the blush and star emojis (and trim the other one to prevent starboard abuse)
    message = message.replaceAll(/🌟/g, "");
    message = message.replaceAll(/⭐/g, "");
    message = message.replaceAll(/😊/g, "");

    //// Post process AI thinking block
    // Require newlines after thought process
    let thinkingRegexNewline = /^Here is my thought process:[^\w]*/m;
    let responseRegexNewline = /^Here is my response:[^\w]*/m;
    if (thinkingRegexNewline.test(message)) {
        message = message.replace(thinkingRegexNewline, '$&\n');
    }
    if (responseRegexNewline.test(message)) {
        message = message.replace(responseRegexNewline, '$&\n');
    }

    // Make thought process smaller text
    let thinkingRegex = /^Here is my thought process:\s*$/m;
    let responseRegex = /^Here is my response:\s*$/m;
    if (thinkingRegex.test(message) && responseRegex.test(message)) {
        let thinkingStart = message.match(thinkingRegex).index;
        const responseMatch = message.match(responseRegex);
        let responseStart = responseMatch.index + responseMatch[0].length;
        let thinkingBlock = message.substring(thinkingStart, responseStart);
        let processedThinkingBlock = thinkingBlock
            .split('\n')
            .map(line => {
                if (line.length === 0) return line;
                return '-# ' + line;
            }).join('\n');

        message = message.substring(0, thinkingStart) + processedThinkingBlock + message.substring(responseStart);
    }


    return message
}

async function getAiResponseGemini(threadID, message, thinking = null, contextualData = {}, notify = null, retryAttempt = 0) {
    // returns: [response, success]

    if (
        !convoCache[threadID] ||
        !convoCache[threadID].geminiChat ||
        Date.now() - convoCache[threadID].lastMessage > 1000 * 60 * 60 ||
        JSON.stringify(contextualData) !== JSON.stringify(convoCache[threadID].contextualData)
    ) {
        let systemPrompt = (await fs.promises.readFile("./data/system.prompt")).toString();
        if (process.env.beta) systemPrompt = systemPrompt.replaceAll("Stewbot", "Stewbeta");
        Object.keys(contextualData).forEach((key) => {
            systemPrompt = systemPrompt.replaceAll(`{${key}}`, contextualData[key]);
        });

        convoCache[threadID] = {
            geminiChat:
                genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    systemInstruction: systemPrompt
                }).startChat(),
            contextualData,
            lastMessage: Date.now(),
        };
    }

    let response = null;
    let success = true;

    try {
        const geminiResult = await convoCache[threadID].geminiChat.sendMessage(message);

        if (!geminiResult?.response?.text()) {
            if (retryAttempt === 0) {
                delete convoCache[threadID];
                return getAiResponseGemini(threadID, message, thinking, contextualData, notify, retryAttempt + 1);
            } else {
                notify && notify(`Error with Gemini API response: \n${JSON.stringify(geminiResult)}`);
                return [`Sorry, there was an error with the AI response. It has already been reported. Try again later.`, false];
            }
        }

        response = geminiResult.response.text();
    } catch (e) {
        notify && notify(`Gemini API error: \n${e.stack}`);
        console.error("Gemini API error:", e);
        response = `Sorry, there was an error with the AI response. It has already been reported. Try again later.`;
        success = false;
    } finally {
        convoCache[threadID].lastMessage = Date.now();
    }

    return [response, success];
}

async function getAiResponseOllama(threadID, message, thinking = null, contextualData = {}, notify = null, retryAttempt = 0, ollamaInstances = null) {
    // returns: [response, success]

    // First, find all currently available servers if they have not already been provided in the command input
    // (they are provided by the message handler so it can check avaialble servers and send typing indicator when there is an available server)
    if (!ollamaInstances) ollamaInstances = await getAvailableOllamaServers();

    if (ollamaInstances.length === 0) {
        return [`Sorry, there are no available AI servers. Try again later.\n\n` +
            `We host our own AI servers. If you would like to support this project, feel free to join the [Support Server](<https://discord.gg/k3yVkrrvez>) and see how you can help!`,
            false];
    }

    // Choose a random server
    const randomIndex = Math.floor(Math.random() * ollamaInstances.length);
    const chosenInstance = ollamaInstances[randomIndex];

    // Mark as busy
    activeAIRequests.set(chosenInstance.config.host, true);

    let response = null;

    try {
        // Build context
        const oneHour = 1000 * 60 * 60;
        if (
            !convoCache[threadID] ||
            !convoCache[threadID].context || // Add check for context existence
            Date.now() - convoCache[threadID].lastMessage > oneHour ||
            JSON.stringify(contextualData) !== JSON.stringify(convoCache[threadID].contextualData)
        ) {
            const context = [];

            let systemPrompt = (await fs.promises.readFile("./data/system.prompt")).toString();
            if (process.env.beta) systemPrompt = systemPrompt.replaceAll("Stewbot", "Stewbeta");
            Object.keys(contextualData).forEach((key) => {
                systemPrompt = systemPrompt.replaceAll(`{${key}}`, contextualData[key]);
            })
            context.push({ "role": "system", "content": systemPrompt })

            convoCache[threadID] = {
                context,
                contextualData,
                lastMessage: Date.now()
            };
        }

        // Enable / disable models
        // NOTE 1: Works best on models like granite3.2 that have been trained to enable thinking on the fly
        // NOTE 2: To make it actually hot swappable it might be best to put the thinkingPrompt right above the message they turned it on for...
        //          But idk if that would override this system prompt
        let thinkingDefined = thinking !== null;
        if (thinkingDefined) {
            const thinkingFlag = { "role": "control", "content": "thinking" }; // This makes the model think
            const thinkingPrompt = `\n\nYou can write down your thought process *before* responding. Write your thoughts after 'Here is my thought process:' and aftwards, write your response after 'Here is my response:' for each user query.`;
            if (thinking) {
                // Add the thinking switch
                if (!convoCache[threadID].context.some(item => item.role === 'control' && item.content === 'thinking')) {
                    convoCache[threadID].context.unshift(thinkingFlag);

                    let systemIndex = convoCache[threadID].context.findIndex(item => item.role === 'system');
                    if (systemIndex !== -1) {
                        convoCache[threadID].context[systemIndex].content += thinkingPrompt;
                    }
                }
            } else {
                // Filter out the thinking switch
                convoCache[threadID].context = convoCache[threadID].context
                    .filter(item => !(item.role === 'control' && item.content === 'thinking'));

                let systemIndex = convoCache[threadID].context.findIndex(item => item.role === 'system');
                if (systemIndex !== -1) {
                    convoCache[threadID].context[systemIndex].content = convoCache[threadID].context[systemIndex].content.replace(thinkingPrompt, '');
                }
            }
        }

        convoCache[threadID].context.push({ "role": "user", "content": message })

        const AIResult = await ollamaInstances[0].chat({
            model: config.aiModel,
            messages: convoCache[threadID].context,
            options: {
                temperature: config.aiTemp
            },
        })

        // Check for an error
        if (!AIResult?.message?.content) {
            if (retryAttempt === 0) {
                delete convoCache[threadID];
                return getAiResponseOllama(threadID, message, thinking, contextualData, notify, retryAttempt + 1, ollamaInstances);
            } else {
                notify && notify(`Error with AI API response: \n${JSON.stringify(AIResult)}`);
                return [`Sorry, there was an error with the AI response. It has already been reported. Try again later.`, false];
            }
        }

        convoCache[threadID].context.push(AIResult.message);

        response = AIResult.message.content;
    }
    catch (e) {
        notify && notify(`AI API response has no content: \n${e.stack}`)
        console.beta(e);
        response = `Sorry, there was an error with the AI response. It has already been reported. Try again later.`;
    }
    finally {
        // Mark the server as available
        activeAIRequests.del(chosenInstance.config.host);
    }

    return [response, true];
}
//#endregion

module.exports = {
    resetAIRequests,
    convertCommandsToTools,

    data: {
        command: new SlashCommandBuilder().setName('chat').setDescription('Chat with Stewbot')
            .addStringOption(option =>
                option
                    .setName("message")
                    .setDescription("Message to stewbot")
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName("clear").setDescription("Clear history?")
            )
            .addBooleanOption(option =>
                option.setName("thinking").setDescription("Enable thinking before responding?")
            )
            .addBooleanOption(option =>
                option.setName("gemini").setDescription("Use Google's Gemini instead of our local AI?")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),

        // Optional fields
        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },//Where the command can be used and what kind of installs it supports

        // Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Information, Categories.Entertainment],
            shortDesc: "Ask Stewbot's AI something",
            detailedDesc: "Have a fun chat with Stewbot's self-hosted AI"
        },
    },
    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, globalsContext) {
        applyContext(globalsContext);

        // Check if this user is allowed to message again
        if(activeAIRequests.has(cmd.user.id)) {
            cmd.followUp({
                content: "You already have an active chat request. Please wait for that one to finish before requesting another.",
                ephemeral: true
            })
        }
        activeAIRequests.set(cmd.user.id, true) 

        let message = cmd.options.getString("message");
        let thinking = cmd.options.getBoolean("thinking");
        let gemini = cmd.options.getBoolean("gemini") ?? true;

        const clearHistory = cmd.options.getBoolean("clear");
        const threadID = cmd.user.id;

        message = await postprocessUserMessage(message, cmd.guild);

        if (clearHistory) {
            delete convoCache[threadID];
        }

        let response, success;
        if (gemini) {
            [response, success] = await getAiResponseGemini(threadID, message, thinking, {
                name: cmd.user.username,
                server: cmd.guild ? cmd.guild.name : "Direct Messages",
            }, notify);
        } else {
            [response, success] = await getAiResponseOllama(threadID, message, thinking, {
                name: cmd.user.username,
                server: cmd.guild ? cmd.guild.name : "Direct Messages",
            }, notify);
        }


        response = await postprocessAIMessage(limitLength(response))
        response = (await checkDirty(cmd.guild?.id, response, true, true))[1];

        cmd.followUp({
            content: await postprocessAIMessage(limitLength(response), cmd.guild),
            allowedMentions: { parse: [] }
        });

        activeAIRequests.del(cmd.user.id); 
    },

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {UserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, globals, guildStore, guildUserStore) {
        applyContext(globals);

        if (!msg.mentions.users.has(client.user.id)) return; // If the bot wasn't pinged

        // Check the guild settings since we already have it first
        const guild = guildStore;
        if (!guild?.config?.ai) return; 

        // Then as long as the user did not blacklist it
        const user = await userByObj(msg.author);
        if (user?.config?.aiPings) {
            const botSettings = await ConfigDB.findOne().lean();

            // Check for available servers before sending typing indicator
            let ollamaInstances = null;
            if (!botSettings.useGlobalGemini) ollamaInstances = await getAvailableOllamaServers();
            if (!botSettings.useGlobalGemini && ollamaInstances?.length === 0) return; // Don't send typing if no ollama servers and not using gemini
            
            // Check if this user is allowed to message again
            if(activeAIRequests.has(msg.author.id)) {
                // For MessageCreate, just ignore.
                return;
            }

            msg.channel.sendTyping();
            activeAIRequests.set(msg.author.id, true) // Don't allow this user to send another request until this one finishes

            let message = await postprocessUserMessage(msg.content, msg.guild);
            let threadID = msg.author.id;
            let response, success;

            if (botSettings.useGlobalGemini) {
                [response, success] = await getAiResponseGemini(threadID, message, false, {
                    name: msg.author.username,
                    server: msg.guild ? msg.guild.name : "Direct Messages",
                }, notify, 0);
            } else {
                [response, success] = await getAiResponseOllama(threadID, message, false, { // Disable thinking on replies for now. Consider setting to null later to default to last
                    name: msg.author.username,
                    server: msg.guild ? msg.guild.name : "Direct Messages",
                }, notify, 0, ollamaInstances);
            }


            if (success) { // Only reply if it worked, don't send error codes in reply to replies
                let stillExists = true; // Message could have been deleted/filtered since sending
                try {
                    stillExists = await msg.channel.messages.fetch(msg.id)
                } catch {
                    stillExists = false
                }

                response = await postprocessAIMessage(response, msg.guild);
                response = (await checkDirty(msg.guild?.id, response, true, true))[1];

                // Let's trim emojis as reactions
                var emojiEnding = /[\p{Emoji}\uFE0F]$/u;
                var emoji = null;
                if (stillExists && emojiEnding.test(response)) {
                    emoji = response.match(emojiEnding)[0]
                    response = response.replace(emojiEnding, '')
                }

                // React
                try {
                    if (emoji) await msg.react(emoji);
                } catch {
                    // Some emojis are not in discord
                    response += emoji;
                }

                if (!user.config?.beenAIDisclaimered) {
                    user.config.beenAIDisclaimered = true;
                    user.save();
                    response += `\n-# This is part of a Stewbot feature. If you wish to disable it, a user can run /personal_config to disable it for them personally, or a moderator can run /general_config.`;
                }

                // If response is > 2000 chars, split it up.
                while (response.length > 0) {
                    let chunk = response.slice(0, 2000 - 3);
                    response = response.slice(2000 - 3);
                    if (response.length > 0) chunk += "...";

                    // If the user deleted their message, send without replying
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

                activeAIRequests.del(msg.author.id, true);

                // if (response) msg.reply({
                //     content: await postprocessAIMessage(response, msg.guild),
                //     allowedMentions: { parse: [] }
                // });

            }
        }
    }
};
