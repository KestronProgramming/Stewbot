// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { userByObj } = require("./modules/database.js");
const { Events, InteractionContextType: IT, ApplicationIntegrationType: AT, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sherlockjs = require("sherlockjs");
const { parseTextDateIfValid, parseFreeformDate } = require("./timestamp.js");
const { DateTime } = require("luxon");
const TIMEZONE_MAP = require("../data/timezone_abbreviations.js");

/**
* Extracts timezone from text and returns the timezone and cleaned text
* @param {string} text
* @returns {{timezone: string | null, cleanedText: string}}
*/
function extractTimezone(text) {
    // Match timezone abbreviations at the end or in the middle
    const tzRegex = /\b([A-Z]{2,5})\b/gi;
    const matches = [...text.matchAll(tzRegex)];

    // Check matches from end to start (prioritize timezone at end)
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const abbr = match[1].toUpperCase();

        if (TIMEZONE_MAP[abbr]) {
            // Remove the timezone from the text
            const cleanedText = text.slice(0, match.index) + text.slice(match.index + match[0].length);
            return {
                timezone: TIMEZONE_MAP[abbr],
                cleanedText: cleanedText.trim()
            };
        }
    }

    // Also check for UTC+X or GMT+X format
    const offsetRegex = /(UTC|GMT)([+-]\d{1,2}(?::\d{2})?)/i;
    const offsetMatch = text.match(offsetRegex);
    if (offsetMatch) {
        const cleanedText = text.replace(offsetMatch[0], "").trim();
        return {
            timezone: offsetMatch[0], // Luxon can handle UTC+5 format directly
            cleanedText: cleanedText
        };
    }

    return {
        timezone: null,
        cleanedText: text
    };
}

/**
* Detects and parses 24-hour time format
* @param {string} text
* @returns {{hour: number, minute: number} | null}
*/
function parse24HourTime(text) {
    // First check for times with colons (unambiguous)
    const timeWithColonRegex = /\b([0-2]?\d):([0-5]\d)(?::([0-5]\d))?\b/g;
    const colonMatches = [...text.matchAll(timeWithColonRegex)];

    for (const match of colonMatches) {
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hour, minute };
        }
    }

    // Then check for 4-digit times WITHOUT colons (like 2100)
    // But ONLY for afternoon/evening times (13:00-23:59) to avoid year confusion
    const time4DigitRegex = /\b(1[3-9]|2[0-3])([0-5]\d)\b/g;
    const digitMatches = [...text.matchAll(time4DigitRegex)];

    for (const match of digitMatches) {
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);

        if (hour >= 13 && hour <= 23 && minute >= 0 && minute <= 59) {
            return { hour, minute };
        }
    }

    return null;
}

/**
* Check if text contains a relative time phrase
* @param {string} text
* @returns {boolean}
*/
function hasRelativeTime(text) {
    const lowerText = text.toLowerCase();
    return lowerText.includes("from now") ||
    lowerText.includes("ago") ||
    /\bin\s+\d+\s+(second|minute|hour|day|week|month|year)s?/i.test(text) ||
    lowerText.includes("yesterday") ||
    lowerText.includes("tomorrow");
}

/**
* Check if sherlock parsed a time component (not just a date)
* @param {string} text
* @returns {boolean}
*/
function hasTimeComponent(text) {
    const sherlockResult = sherlockjs.parse(text);
    if (sherlockResult.isAllDay === false) {
        return true;
    }
    return parse24HourTime(text) !== null;
}

/**
* Parse time with explicit timezone if provided
* @param {string} text
* @param {object} userConfig
* @returns {Date | null}
*/
function parseTimeWithTimezone(text, userConfig) {
    const { timezone, cleanedText } = extractTimezone(text);

    // Check for 24-hour time format first
    const time24 = parse24HourTime(cleanedText);

    // Determine which timezone to use
    const targetZone = timezone || (userConfig.timeZoneRegion ? userConfig.timeZoneRegion : null);

    if (time24 && targetZone) {
        // We have a 24-hour time, construct the date manually
        const now = DateTime.now().setZone(targetZone);
        const dt = now.set({
            hour: time24.hour,
            minute: time24.minute,
            second: 0,
            millisecond: 0
        });

        if (!dt.isValid) return null;
        return dt.toUTC().toJSDate();
    }

    if (timezone) {
        // Parse the cleaned text with the detected timezone
        const rawParsed = parseFreeformDate(cleanedText);
        if (!rawParsed) return null;

        // Create DateTime in the specified timezone
        const dt = DateTime.fromObject(
            {
                year: rawParsed.year,
                month: rawParsed.month,
                day: rawParsed.day,
                hour: rawParsed.hour,
                minute: rawParsed.minute,
                second: rawParsed.second,
                millisecond: rawParsed.millisecond
            },
            { zone: timezone }
        );

        if (!dt.isValid) return null;
        return dt.toUTC().toJSDate();
    }

    // No explicit timezone, use user's configured timezone
    return parseTextDateIfValid(text, userConfig);
}

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel  // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName("auto_timestamp")
            .setDescription("Automatically convert times to timestamps")
            .addSubcommand(subcommand =>
                subcommand.setName("help")
                    .setDescription("Enable automatic time detection and timestamp conversion")
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                    )
            ),

        help: {
            helpCategories: [Categories.General, Categories.Information, Categories.Module],
            shortDesc: "Automatically convert times to timestamps",
            detailedDesc:
               `Automatically detects times in messages and converts them to Discord timestamps.\n
                React with the Normalize_Timezone emoji to convert the detected time to a proper timestamp.\n
                Supports timezone abbreviations (EST, PST, GMT, CST, etc.)\n
                For times without explicit timezones, requires timezone configuration via /personal_config.\n
                Only reacts to messages with times or relative time phrases (ignores date-only messages).`
        }
    },

    async execute(cmd) {
        if (cmd.options.getSubcommand() === "help") {
            const helpMessage =
                `The ${cmds.auto_timestamp.mention} module detects when you post a time in a message, and allows users to click the added emoji to convert it to their timezone.\n` +
                // `\n` +
                `To use this feature on your messages, you must configure your timezone in ${cmds.personal_config.mention}. To disable these reactions being added automatically, use ${cmds.personal_config.mention} for personal messages or ${cmds.general_config.mention} to disable it server-wide.`;

            cmd.followUp(helpMessage);
        }
    },

    async [Events.MessageCreate](msg, context, readGuild) {
        // Don't process bot messages
        if (msg.author.bot) return;

        // Get user config for timezone
        const user = await userByObj(msg.author);

        if (!readGuild.config.timeReactions || !user.config.timeReactions) return;

        const reactable = ("permissionsFor" in msg.channel) && msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AddReactions);
        if (!reactable) return;

        // Check if message contains a relative time or explicit time
        const isRelativeTime = hasRelativeTime(msg.content);
        const hasTime = hasTimeComponent(msg.content);

        // Only proceed if there's a time component or relative time
        if (!isRelativeTime && !hasTime) return;

        // Check if there's an explicit timezone in the message
        const { timezone } = extractTimezone(msg.content);

        // Try parsing
        const rawParsed = parseFreeformDate(msg.content);
        if (!rawParsed) return;

        // For absolute times without explicit timezone, require user timezone config
        if (!isRelativeTime && !timezone && !user.config.hasSetTZ) return;

        // Parse with appropriate timezone context
        let parsedTime;
        if (isRelativeTime) {
            parsedTime = rawParsed.toJSDate();
        }
        else {
            parsedTime = parseTimeWithTimezone(msg.content, user.config);
        }

        if (!parsedTime) return;

        msg.react(process.env.beta ? "<:Normalize_Timezone:1452899414996811816>" : "<:Normalize_Timezone:1452898452173492284>").catch(() => {});
    },

    async [Events.MessageReactionAdd](reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;

        // Check if it's the right emoji
        if (reaction.emoji.name !== "Normalize_Timezone") return;

        // Get the message author's user config for timezone
        const messageAuthor = await userByObj(reaction.message.author);

        // Check if it's a relative time
        const isRelativeTime = hasRelativeTime(reaction.message.content);

        // Parse accordingly
        let parsedTime;
        if (isRelativeTime) {
            const rawParsed = parseFreeformDate(reaction.message.content);
            if (!rawParsed) return;
            parsedTime = rawParsed.toJSDate();
        }
        else {
            parsedTime = parseTimeWithTimezone(reaction.message.content, messageAuthor.config);
            if (!parsedTime) return;
        }

        parsedTime = Math.round(parsedTime.getTime() / 1000);

        let response =
            `<t:${parsedTime}:f>, <t:${parsedTime}:R>\n` +
            `-# Want to use this feature? ${cmds.auto_timestamp.help.mention}`;

        // Check if we can send messages in this channel
        const canSendMessages = ("permissionsFor" in reaction.message.channel) &&
        reaction.message.channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages);

        if (reaction.message.author.id === user.id && canSendMessages) {
            // Reply with timestamp if the reacting user is the message author
            reaction.message.reply(response).catch(() => {});
        }
        else {
            // DM with timestamp for other users
            user.send(response).catch(() => {});
        }
    }
};
