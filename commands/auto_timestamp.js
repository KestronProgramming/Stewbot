// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { userByObj, guildByObj } = require("./modules/database.js");
const { Events, InteractionContextType: IT, ApplicationIntegrationType: AT, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { parseTextDateIfValid, parseFreeformDate, getRegionFromUser } = require("./timestamp.js");
const { DateTime } = require("luxon");
const TIMEZONE_MAP = require("../data/timezone_abbreviations.js");

const sherlock_limited = require("./modules/sherlock-limited.js");
const sherlock_full = require("./modules/sherlock-full.js");

const NodeCache = require("node-cache");
const ms = require("ms");
const clickReactionRatelimit = new NodeCache({ stdTTL: ms("5 min") / 1000, checkperiod: 60 });

/**
* Extracts timezone from text and returns the timezone and cleaned text
* Also removes incomplete relative time fragments
* @param {string} text
* @returns {{timezone: string | null, cleanedText: string}}
*/
function extractTimezone(text) {
    let cleanedText = text;

    // Remove trailing incomplete "in" that might confuse the parser
    cleanedText = cleanedText.replace(/\bin\s*$/i, "").trim();

    // Match timezone abbreviations at the end or in the middle
    const tzRegex = /\b([A-Z]{2,5})\b/gi;
    const matches = [...cleanedText.matchAll(tzRegex)];

    // Check matches from end to start (prioritize timezone at end)
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const abbr = match[1].toUpperCase();

        if (TIMEZONE_MAP[abbr]) {
            // Remove the timezone from the text
            cleanedText = cleanedText.slice(0, match.index) + cleanedText.slice(match.index + match[0].length);
            return {
                timezone: TIMEZONE_MAP[abbr],
                cleanedText: cleanedText.trim()
            };
        }
    }

    // Also check for UTC+X or GMT+X format
    const offsetRegex = /(UTC|GMT)([+-]\d{1,2}(?::\d{2})?)/i;
    const offsetMatch = cleanedText.match(offsetRegex);
    if (offsetMatch) {
        cleanedText = cleanedText.replace(offsetMatch[0], "").trim();
        return {
            timezone: offsetMatch[0],
            cleanedText: cleanedText
        };
    }

    return {
        timezone: null,
        cleanedText: cleanedText
    };
}

/**
* Detects and parses 24-hour time format (only unambiguous cases)
* @param {string} text
* @returns {{hour: number, minute: number} | null}
*/
function parse24HourTime(text) {
    // Check if text contains AM/PM indicators - if so, don't use 24-hour parsing
    if (/\b(am|pm|a\.m\.|p\.m\.)\b/i.test(text)) {
        return null;
    }

    // Check if text contains time-of-day phrases that indicate 12-hour format
    if (/\b(morning|evening|afternoon|night|noon|midnight)\b/i.test(text)) {
        return null;
    }

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
* Check if text contains a COMPLETE relative time phrase
* @param {string} text
* @returns {boolean}
*/
function hasRelativeTime(text) {
    const lowerText = text.toLowerCase();

    // Check for complete "in X unit" patterns (including abbreviations like min, hr, sec)
    if (/\bin\s+(\d+|a|an)\s+(s(?:ec(?:ond)?)?|m(?:in(?:ute)?)?|h(?:(?:ou)?r)?|day|week|month|year)s?\b/i.test(lowerText)) {
        return true;
    }

    // Check for "X unit ago" patterns (including abbreviations)
    if (/\b(\d+|a|an)\s+(s(?:ec(?:ond)?)?|m(?:in(?:ute)?)?|h(?:(?:ou)?r)?|day|week|month|year)s?\s+ago\b/i.test(lowerText)) {
        return true;
    }

    // Other standalone relative phrases
    return lowerText.includes("from now") ||
           lowerText.includes("yesterday") ||
           lowerText.includes("tomorrow") ||
           /\b(today|tonight|tmrw)\b/i.test(lowerText);
}

/**
* Check if text is a PURE relative time offset (like "in 20 min", "1 hour ago")
* These don't need timezone conversion because they're offsets from now, not absolute times.
* Date references like "today", "tomorrow" with explicit times still need timezone handling.
* @param {string} text
* @returns {boolean}
*/
function isPureRelativeTimeOffset(text) {
    const lowerText = text.toLowerCase();

    // "in X unit" patterns - these are pure offsets
    if (/\bin\s+(\d+|a|an)\s+(s(?:ec(?:ond)?)?|m(?:in(?:ute)?)?|h(?:(?:ou)?r)?|day|week|month|year)s?\b/i.test(lowerText)) {
        return true;
    }

    // "X unit ago" patterns - these are pure offsets
    if (/\b(\d+|a|an)\s+(s(?:ec(?:ond)?)?|m(?:in(?:ute)?)?|h(?:(?:ou)?r)?|day|week|month|year)s?\s+ago\b/i.test(lowerText)) {
        return true;
    }

    // "X unit from now" patterns
    if (/\b(\d+|a|an)\s+(s(?:ec(?:ond)?)?|m(?:in(?:ute)?)?|h(?:(?:ou)?r)?|day|week|month|year)s?\s+from now\b/i.test(lowerText)) {
        return true;
    }

    return false;
}

/**
* Check if sherlock parsed a time component (not just a date)
* @param {string} text
* @returns {boolean}
*/
function hasTimeComponent(text, customNow, customSherlock = sherlock_limited, require24HourColon = true) {
    const sherlockResult = customSherlock.parse(text, customNow, require24HourColon);
    if (sherlockResult.isAllDay === false) {
        return true;
    }
    return parse24HourTime(text) !== null;
}

/**
* Parse time with explicit timezone if provided
* Cleans up incomplete relative time fragments before parsing
* @param {string} text
* @param {object} userConfig
* @returns {Date | null}
*/
function parseTimeWithTimezone(text, userConfig, customNow, customSherlock = sherlock_limited, require24HourColon = true) {
    let { timezone, cleanedText } = extractTimezone(text);

    // Clean contextual phrases that might confuse the parser -> Sherlock doesn't *get* confused :muscle:
    // cleanedText = cleanedText.replace(/\bin\s+the\s+(morning|evening|afternoon|night)\b/gi, "").trim();

    // Determine which timezone to use
    const targetZone = timezone || getRegionFromUser(userConfig);

    // Check for 24-hour time format (only if no AM/PM or time-of-day context)
    const time24 = parse24HourTime(cleanedText); // TODO: nuke this

    if (time24 && targetZone) {
        // We have an unambiguous 24-hour time, construct the date manually
        const now = DateTime.now().setZone(targetZone);
        let dt = now.set({
            hour: time24.hour,
            minute: time24.minute,
            second: 0,
            millisecond: 0
        });

        if (!dt.isValid) return null;
        return dt.toUTC().toJSDate();
    }

    // If we had an explicit timezone
    if (timezone) {
        // Parse the cleaned text with the detected timezone
        const rawParsed = parseFreeformDate(cleanedText, customSherlock, customNow, require24HourColon);
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
    return parseTextDateIfValid(cleanedText, userConfig, customSherlock, customNow);
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
            )
            .addSubcommand(subcommand =>
                subcommand.setName("personal_config")
                    .setDescription("Configure your own personal setup for automatic timezone conversion")
                    .addBooleanOption(option =>
                        option.setName("auto_timezone_reaction").setDescription("Offer an automatic timezone conversion via reaction?")
                            .setRequired(true)
                    )
                    .addBooleanOption(option =>
                        option.setName("24hr_without_colon").setDescription("Add reactions to 24hr times without a colon? (Can be confused with years - 2023 vs 20:23 (8:23 PM))")
                            .setRequired(true)
                    )
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName("server_config")
                    .setDescription("Configure whether timezone reactions will be added server wide")
                    .addBooleanOption(option =>
                        option.setName("auto_timezone_reaction").setDescription("Offer an automatic timezone conversion via reaction?")
                            .setRequired(true)
                    )
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
                You can enable and disable this personally and server wide.\n
                By default, does not parse 24hr times such as '2023' due to overlap confusion with the year. This can be changed in the personal config.`
        }
    },

    async execute(cmd) {
        switch (cmd.options.getSubcommand()) {
            case "help":
                const helpMessage =
                    `The ${cmds.auto_timestamp.mention} module detects when you post a time in a message, and allows users to click the added emoji to convert it to their timezone.\n` +
                    // `\n` +
                    `To use this feature on your messages, you must configure your timezone in ${cmds.personal_config.mention}. To disable these reactions being added automatically, use ${cmds.auto_timestamp.personal_config.mention} for personal messages or ${cmds.auto_timestamp.server_config.mention} to disable it server-wide.`;

                cmd.followUp(helpMessage);
                break;
            case "personal_config":
                const user = await userByObj(cmd.user);
                if (cmd.options.getBoolean("auto_timezone_reaction") !== null) user.config.timeReactions = cmd.options.getBoolean("auto_timezone_reaction");
                if (cmd.options.getBoolean("24hr_without_colon") !== null) user.config.noColon24h = cmd.options.getBoolean("24hr_without_colon");
                await user.save();

                cmd.followUp(`I have configured your personal timezone reactions.${user.config.timeReactions ? ` To configure your timezone, use ${cmds.personal_config.mention}. This must be done before timezone reactions will begin being added.` : ``}`);
                break;
            case "server_config":
                //IF(USER!==MODERATOR) return cmd.followUp("You need the [PERMS] permission to use this command."); <- Before pushing
                const updates = {};
                if (cmd.options.getBoolean("auto_timezone_reaction") !== null) updates["config.timeReactions"] = cmd.options.getBoolean("auto_timezone_reaction");
                await guildByObj(cmd.guild, updates);

                cmd.followUp(`I have configured timezone reactions server wide.${updates?.config?.timeReactions ? ` Users must run ${cmds.personal_config.mention} and configure their timezone before timezone reactions will be added to their messages.` : ``}`);
                break;
        }
    },

    async [Events.MessageCreate](msg, context, readGuild) {
        // Don't process bot messages
        if (msg.author.bot) return;

        // Ignore messages that are solely numbers
        if (/^\d+$/.test(msg.content.trim())) return;
        //What we do want to parse: ^\d\d?\s?(a|p)m$
        if (/\ba (m(?:in(?:ute)?)?) ?(ago)?\b/ig.test(msg.content.trim())) return; // Too common

        const reactable = ("permissionsFor" in msg.channel) && msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AddReactions);
        if (!reactable) return;

        // Get user config for timezone
        const user = await userByObj(msg.author);
        if (!readGuild.config.timeReactions || !user.config.timeReactions) return;

        // Make sure that the "current time" is when the message was sent
        const customNow = msg.createdAt;

        // Check if message contains a relative time or explicit time
        const isRelativeTime = hasRelativeTime(msg.content);
        const hasTime = hasTimeComponent(msg.content, customNow, sherlock_limited, !user.config.noColon24h);

        // Only proceed if there's a time component or relative time
        if (!isRelativeTime && !hasTime) return;

        // Check if there's an explicit timezone in the message
        const { timezone } = extractTimezone(msg.content);

        // Try parsing
        const rawParsed = parseFreeformDate(msg.content, sherlock_limited, customNow, !user.config.noColon24h);
        if (!rawParsed) return;

        // For absolute times without explicit timezone, require user timezone config
        if (!isRelativeTime && !timezone && !user.config.hasSetTZ) return;

        // Parse with appropriate timezone context
        // Pure relative offsets (like "in 20 min") don't need timezone conversion
        // Everything else (including "5:30 pm today") needs timezone handling
        let parsedTime;
        if (isPureRelativeTimeOffset(msg.content)) {
            parsedTime = rawParsed.toJSDate();
        }
        else {
            parsedTime = parseTimeWithTimezone(msg.content, user.config, customNow, sherlock_limited, !user.config.noColon24h);
        }

        if (!parsedTime) return;

        msg.react(process.env.beta ? "<:Normalize_Timezone:1452899414996811816>" : "<:Click_To_Normalize_Timezone:1452898452173492284>").catch(() => {});
    },

    async [Events.MessageReactionAdd](reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;

        // Check if it's the right emoji
        if (reaction.emoji.name !== "Normalize_Timezone" && reaction.emoji.name !== "Click_To_Normalize_Timezone") return;

        // Get the message author's user config for timezone
        const messageAuthor = await userByObj(reaction.message.author);

        // Parse accordingly
        // Pure relative offsets (like "in 20 min") don't need timezone conversion
        // Everything else (including "5:30 pm today") needs timezone handling
        let parsedTime;
        if (isPureRelativeTimeOffset(reaction.message.content)) {
            const rawParsed = parseFreeformDate(reaction.message.content, sherlock_full, reaction.message.createdAt);
            if (!rawParsed) return;
            parsedTime = rawParsed.toJSDate();
        }
        else {
            parsedTime = parseTimeWithTimezone(reaction.message.content, messageAuthor.config, reaction.message.createdAt, sherlock_full);
            if (!parsedTime) return;
        }

        parsedTime = Math.round(parsedTime.getTime() / 1000);

        let response =
            `<t:${parsedTime}:t>, <t:${parsedTime}:R>\n` +
            `-# Want to use, or disable this feature? ${cmds.auto_timestamp.help.mention}`;

        // Check if we can send messages in this channel
        const canSendMessages = ("permissionsFor" in reaction.message.channel) &&
        reaction.message.channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages);

        if (reaction.message.author.id === user.id && canSendMessages) {
            // Check if we've already replied in the past hour.
            if (!clickReactionRatelimit.has(reaction.message.id)) {
                // Reply with timestamp if the reacting user is the message author, and we haven't replied in the past hour
                clickReactionRatelimit.set(reaction.message.id, true);
                reaction.message.reply(response).catch(() => {
                    clickReactionRatelimit.delete(reaction.message.id);
                });
            }
        }
        else {
            // DM with timestamp for other users
            user.send(response).catch(() => {});
        }
    }
};
