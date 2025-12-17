// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { userByObj } = require("./modules/database.js");
const { Events, SlashCommandBuilder } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}
// #endregion CommandBoilerplate

const { limitLength, notify } = require("../utils.js");
const fs = require("fs");
const ms = require("ms");
const NodeCache = require("node-cache");
const { censor } = require("./filter");

// AI SDKs
const { groq } = require("@ai-sdk/groq");
const { streamText } = require("ai");

// Configuration
const COOLDOWN_SECONDS = 3;
const COOLDOWN_MS = COOLDOWN_SECONDS * 1000;

// Server IPs and User IDs who need to wait for the requests to finish - this clears after 2 min in case of an error
let activeAIRequests = new NodeCache({ stdTTL: ms("5m") / 1000, checkperiod: 120 });
// Cooldown tracker for rate limiting
let userCooldowns = new NodeCache({ stdTTL: COOLDOWN_SECONDS, checkperiod: 1 });

// Non-persistent store of convos with users
let convoCache = {};

function resetAIRequests() {
    activeAIRequests.flushAll();
    userCooldowns.flushAll();
}

//#region Tools

// Setup discord -> tool calling functions
const GeminiType = {
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
    BOOLEAN: "BOOLEAN",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT"
};

// Mapping from Discord ApplicationCommandOptionType enum values
// https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandOptionType
function discordTypeToGeminiType(discordType) {
    switch (discordType) {
        case 3: return "STRING"; // STRING
        case 4: return "INTEGER"; // INTEGER
        case 5: return "BOOLEAN"; // BOOLEAN
        case 6: return "STRING"; // USER (ID or mention)
        case 7: return "STRING"; // CHANNEL (ID or mention)
        case 8: return "STRING"; // ROLE (ID or mention)
        case 9: return "STRING"; // MENTIONABLE
        case 10: return "NUMBER"; // NUMBER
        case 11: return "STRING"; // ATTACHMENT (ID or URL placeholder)
        default:
            console.warn(`Unknown Discord option type: ${discordType}. Defaulting to STRING.`);
            return GeminiType.STRING; // Fallback
    }
}

function processParameterOptions(discordOptions) {
    const parameters = {
        type: GeminiType.OBJECT, // Or Type.OBJECT
        properties: {},
        required: []
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
            enhancedDesc += ` (Channel types: ${paramOption.channel_types.join(", ")})`; // You might map numbers to names
        }
        if (paramOption.min_length !== undefined) {
            enhancedDesc += ` (Min length: ${paramOption.min_length})`;
        }
        if (paramOption.max_length !== undefined) {
            enhancedDesc += ` (Max length: ${paramOption.max_length})`;
        }
        if (paramOption.choices && Array.isArray(paramOption.choices)) {
            const choiceList = paramOption.choices.map(c => `'${c.name}' (${c.value})`).join(", ");
            enhancedDesc += ` (Choices: ${choiceList})`;
        }
        // Add min/max value if applicable (for NUMBER/INTEGER types if present in your data)

        parameters.properties[paramName] = {
            type: discordTypeToGeminiType(paramOption.type),
            description: enhancedDesc
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
                        parameters: parameters
                    };
                    tools.push(tool);
                }
                else {
                    // Handle cases where a command might unexpectedly mix subcommands and direct parameters
                    console.warn(`Command '${commandName}' has an option '${subCommandOption.name}' that looks like a direct parameter mixed with subcommands. Skipping.`);
                }
            }
        }
        else {
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
                parameters: parameters // Contains parameters if mainCommand.options existed, empty otherwise
            };
            tools.push(tool);
        }
    }

    return tools;
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
        const roleName = guild?.roles.cache.get(roleId)?.name;
        return roleName ? `<${roleName} (discord role mention)>` : match;
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
    message = message.replace(/@([\w_.]+)/g, (match, username) => {
        const user = guild?.members.cache.find((member) => member.user.username === username);
        return user ? `<@${user.id}>` : match;
    });

    // AI overuses the blush and star emojis (and trim the other one to prevent starboard abuse)
    message = message.replaceAll(/🌟/g, "");
    message = message.replaceAll(/⭐/g, "");
    message = message.replaceAll(/😊/g, "");

    //// Post process AI thinking block
    // Require newlines after thought process
    let thinkingRegexNewline = /^Here is my thought process:[^\w]*/m;
    let responseRegexNewline = /^Here is my response:[^\w]*/m;
    if (thinkingRegexNewline.test(message)) {
        message = message.replace(thinkingRegexNewline, "$&\n");
    }
    if (responseRegexNewline.test(message)) {
        message = message.replace(responseRegexNewline, "$&\n");
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
            .split("\n")
            .map(line => {
                if (line.length === 0) return line;
                return "-# " + line;
            })
            .join("\n");

        message = message.substring(0, thinkingStart) + processedThinkingBlock + message.substring(responseStart);
    }


    return message;
}

async function getAiResponse(threadID, message, thinking = null, contextualData = {}, notify = null, retryAttempt = 0) {
    // returns: [response, success]

    if (
        !convoCache[threadID] ||
        !convoCache[threadID].messages ||
        Date.now() - convoCache[threadID].lastMessage > 1000 * 60 * 60 ||
        JSON.stringify(contextualData) !== JSON.stringify(convoCache[threadID].contextualData)
    ) {
        let systemPrompt = (await fs.promises.readFile("./data/system.prompt")).toString();
        if (process.env.beta) systemPrompt = systemPrompt.replaceAll("Stewbot", "Stewbeta");
        Object.keys(contextualData).forEach((key) => {
            systemPrompt = systemPrompt.replaceAll(`{${key}}`, contextualData[key]);
        });

        convoCache[threadID] = {
            systemPrompt: systemPrompt,
            messages: [],
            contextualData,
            lastMessage: Date.now()
        };
    }

    // Add user message to history
    convoCache[threadID].messages.push({
        role: "user",
        content: message
    });

    let response = null;
    let success = true;

    try {
        const result = await streamText({
            model: groq("openai/gpt-oss-120b"),
            system: convoCache[threadID].systemPrompt,
            messages: convoCache[threadID].messages
        });

        // Collect the full response from the stream
        let fullText = "";
        for await (const textPart of result.textStream) {
            fullText += textPart;
        }

        if (!fullText) {
            if (retryAttempt === 0) {
                // Remove the failed message before retry
                convoCache[threadID].messages.pop();
                delete convoCache[threadID];
                return getAiResponse(threadID, message, thinking, contextualData, notify, retryAttempt + 1);
            }
            else {
                notify && notify(`Error with AI API response: Empty response received`);
                return [`Sorry, there was an error with the AI response. It has already been reported. Try again later.`, false];
            }
        }

        response = fullText;

        // Add assistant response to history
        convoCache[threadID].messages.push({
            role: "assistant",
            content: response
        });

    }
    catch (e) {
        notify && notify(`AI API error: \n${e.stack}`);
        console.error("AI API error:", e);
        response = `Sorry, there was an error with the AI response. It has already been reported. Try again later.`;
        success = false;
        // Remove the failed user message from history
        convoCache[threadID].messages.pop();
    }
    finally {
        if (convoCache[threadID]) {
            convoCache[threadID].lastMessage = Date.now();
        }
    }

    return [response, success];
}

function checkRateLimit(userId) {
    // Check if user has an active request
    if (activeAIRequests.has(userId)) {
        return { allowed: false, message: "You already have an active chat request. Please wait for that one to finish before requesting another." };
    }

    // Check if user is on cooldown
    const cooldownRemaining = userCooldowns.get(userId);
    if (cooldownRemaining) {
        const secondsLeft = Math.ceil((cooldownRemaining - Date.now()) / 1000);
        return { allowed: false, message: `To keep the ping-AI free, please wait ${secondsLeft} more second${secondsLeft !== 1 ? "s" : ""} before trying again.` };
    }

    return { allowed: true };
}

function startCooldown(userId) {
    userCooldowns.set(userId, Date.now() + COOLDOWN_MS);
}
//#endregion

module.exports = {
    resetAIRequests,
    convertCommandsToTools,

    data: {
        command: new SlashCommandBuilder().setName("chat")
            .setDescription("Chat with Stewbot")
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
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),

        // Optional fields
        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] }, //Where the command can be used and what kind of installs it supports

        // Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Information, Categories.Entertainment],
            shortDesc: "Ask Stewbot's AI something",
            detailedDesc: "Have a fun chat with Stewbot's self-hosted AI"
        }
    },
    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, globalsContext) {
        applyContext(globalsContext);

        // Check rate limits
        const rateLimitCheck = checkRateLimit(cmd.user.id);
        if (!rateLimitCheck.allowed) {
            return cmd.followUp({
                content: rateLimitCheck.message,
                ephemeral: true
            });
        }

        activeAIRequests.set(cmd.user.id, true);

        let message = cmd.options.getString("message");
        let thinking = cmd.options.getBoolean("thinking");

        const clearHistory = cmd.options.getBoolean("clear");
        const threadID = cmd.user.id;

        message = await postprocessUserMessage(message, cmd.guild);

        if (clearHistory) {
            delete convoCache[threadID];
        }

        let [response, _success] = await getAiResponse(threadID, message, thinking, {
            name: cmd.user.username,
            server: cmd.guild ? cmd.guild.name : "Direct Messages"
        }, notify);

        response = await postprocessAIMessage(limitLength(response), cmd.guild);
        response = await censor(String(response), cmd.guild, true);

        cmd.followUp({
            content: response,
            allowedMentions: { parse: [] }
        });

        activeAIRequests.del(cmd.user.id);
        startCooldown(cmd.user.id);
    },

    /**
     * @param {import('discord.js').Message} msg
     * @param {import("./modules/database.js").GuildDoc} guildStore
     * @param {import("./modules/database.js").GuildUserDoc} guildStore
     * */
    async [Events.MessageCreate](msg, globals, guildStore) {
        applyContext(globals);

        if (!("send" in msg.channel)) return;

        if (!msg.mentions.users.has(client.user.id)) return; // If the bot wasn't pinged

        // Check the guild settings since we already have it first
        const guild = guildStore;
        if (!guild?.config?.ai) return;

        // Then as long as the user did not blacklist it
        const user = await userByObj(msg.author);
        if (user?.config?.aiPings) {

            // Check rate limits
            const rateLimitCheck = checkRateLimit(msg.author.id);
            if (!rateLimitCheck.allowed) {
                // Send rate limit message for mentions
                try {
                    await msg.reply({
                        content: rateLimitCheck.message,
                        allowedMentions: { parse: [] }
                    });
                }
                catch (e) {
                    console.error("Failed to send rate limit message:", e);
                }
                return;
            }

            if ("sendTyping" in msg.channel) msg.channel.sendTyping();
            activeAIRequests.set(msg.author.id, true);

            let message = await postprocessUserMessage(msg.content, msg.guild);
            let threadID = msg.author.id;
            let response, success;

            [response, success] = await getAiResponse(threadID, message, false, {
                name: msg.author.username,
                server: msg.guild ? msg.guild.name : "Direct Messages"
            }, notify, 0);

            if (success) { // Only reply if it worked, don't send error codes in reply to replies
                let stillExists; // Message could have been deleted/filtered since sending
                try {
                    stillExists = await msg.channel.messages.fetch(msg.id);
                }
                catch {
                    stillExists = false;
                }

                response = await postprocessAIMessage(response, msg.guild);
                response = await censor(response, guildStore, true);

                // Let's trim emojis as reactions
                var emojiEnding = /[\p{Emoji}\uFE0F]$/u;
                var emoji = null;
                if (stillExists && emojiEnding.test(response)) {
                    emoji = response.match(emojiEnding)[0];
                    response = response.replace(emojiEnding, "");
                }

                // React
                try {
                    if (emoji) await msg.react(emoji);
                }
                catch {
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
                            allowedMentions: { parse: [] }
                        });
                    }
                    else {
                        await msg.channel.send({
                            content: chunk,
                            allowedMentions: { parse: [] }
                        });
                    }
                }

                activeAIRequests.del(msg.author.id);
                startCooldown(msg.author.id);
            }
            else {
                activeAIRequests.del(msg.author.id);
            }
        }
    }
};
