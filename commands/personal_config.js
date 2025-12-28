const Categories = require("./modules/Categories");
const { userByObj } = require("./modules/database.js");
const { SlashCommandBuilder } = require("discord.js");
const { DateTime } = require("luxon");
const { parseFreeformDate } = require("./timestamp");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

const Fuse = require("fuse.js");
const fuseOptions = {
    includeScore: true,
    keys: ["item"]
};

function sortByMatch(items, text) {
    // @ts-ignore - Fuse ts checking is broken
    const fuse = new Fuse(items.map(item => ({ item })), fuseOptions);
    const scoredResults = fuse.search(text)
        .filter(result => result.score <= 2) // Roughly similar-ish
        .sort((a, b) => a.score - b.score);
    return scoredResults.map(entry => entry.item.item);
}


function formatUtcOffset(totalMinutes) {
    const sign = totalMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(totalMinutes);
    const hours = Math.floor(abs / 60).toString()
        .padStart(2, "0");
    const mins = (abs % 60).toString().padStart(2, "0");
    return `UTC${sign}${hours}:${mins}`;
}


/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("personal_config")
            .setDescription("Configure the bot for you personally")
            .setDescription("Configure the bot for you personally")
            .addBooleanOption(option =>
                option.setName("ai_pings").setDescription("Respond with an AI message to pings or DMs")
            )
            .addBooleanOption(option =>
                option.setName("trackable_expiration_dm").setDescription("Should I message you before your trackable expires?")
            )
            .addBooleanOption(option =>
                option.setName("dm_infractions").setDescription("If you get filtered, should I DM you?")
            )
            .addBooleanOption(option =>
                option.setName("dm_infraction_content").setDescription("If dm_infractions is true, should I include the content of the filtered message?")
            )
            .addBooleanOption(option =>
                option.setName("embeds").setDescription("If you link a Discord message, should I embed a preview for you?")
            )
            .addBooleanOption(option =>
                option.setName("level_up_messages").setDescription("Do you want to receive messages letting you know you leveled up?")
            )
            .addStringOption(option =>
                option.setName("timezone_region").setDescription("Your timezone region (e.g., America/New_York)")
                    .setAutocomplete(true)
            )
            .addStringOption(option =>
                option.setName("timezone_manual").setDescription("What time is it for you right now? (Manual, rounds to 15m)")
            )
            .addBooleanOption(option =>
                option.setName("timezone_observes_dst").setDescription("Does your region observe daylight saving time at any point?")
            )
            .addBooleanOption(option =>
                option.setName("attachment_protection").setDescription("Protect you from leaking personal information in your message attachments")
            ),

        // Optional fields

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: [],

        deferEphemeral: true,

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Configuration],
            shortDesc: "Configure the bot for you personally", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure options for your personal interactions with the bot. This includes options such as if the bot tells you when you're filtered, if it automatically embeds certain links you post, or if you want it to not ping you when you level up in a server. You can also set your timezone for use with ${cmds.timestamp.mention}`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);

        if (cmd.options.getBoolean("ai_pings") !== null) user.config.aiPings = cmd.options.getBoolean("ai_pings");
        if (cmd.options.getBoolean("trackableNotifsSilenced") !== null) user.config.trackableNotifsSilenced = cmd.options.getBoolean("trackableNotifsSilenced");
        if (cmd.options.getBoolean("dm_infractions") !== null) user.config.dmOffenses = cmd.options.getBoolean("dm_infractions");
        if (cmd.options.getBoolean("dm_infraction_content") !== null) user.config.returnFiltered = cmd.options.getBoolean("dm_infraction_content");
        if (cmd.options.getBoolean("embeds") !== null) user.config.embedPreviews = cmd.options.getBoolean("embeds");
        if (cmd.options.getBoolean("level_up_messages") !== null) user.config.levelUpMsgs = cmd.options.getBoolean("level_up_messages");
        if (cmd.options.getBoolean("attachment_protection") !== null) user.config.attachmentProtection = cmd.options.getBoolean("attachment_protection");

        let response = "Configured your personal setup";

        const manualTimeInput = cmd.options.getString("timezone_manual");
        const regionInput = cmd.options.getString("timezone_region");
        const dstObservesInput = cmd.options.getBoolean("timezone_observes_dst");
        let regionConfigured = false;

        // Prefer explicit region if provided
        if (regionInput) {
            const zoned = DateTime.now().setZone(regionInput);
            if (zoned.isValid) {
                user.config.timeZoneRegion = zoned.zoneName;
                user.config.timeOffsetMinutes = zoned.offset;
                user.config.timeOffset = zoned.offset / 60;

                // Automatically detect DST by checking if offset changes between January and July
                const winterOffset = DateTime.fromObject({ month: 1, day: 15 }, { zone: regionInput }).offset;
                const summerOffset = DateTime.fromObject({ month: 7, day: 15 }, { zone: regionInput }).offset;
                user.config.observesDst = winterOffset !== summerOffset;

                user.config.hasSetTZ = true;
                response += `\n\nSet your timezone to ${zoned.zoneName} (${formatUtcOffset(zoned.offset)})`;
                regionConfigured = true;
            }
            else {
                response += "\n\nSorry, that timezone region was not recognized. Try something like America/New_York.";
            }
        }

        // Manual privacy-friendly input using local time
        if (!regionConfigured && manualTimeInput !== null) {
            const parsed = parseFreeformDate(manualTimeInput);

            if (parsed) {
                const nowUtc = DateTime.utc();
                const providedMinutes = parsed.hour * 60 + parsed.minute;
                const utcMinutes = nowUtc.hour * 60 + nowUtc.minute;
                let diffMinutes = providedMinutes - utcMinutes;
                const maxOffsetMinutes = 14 * 60; // handle regions up to UTC+14

                while (diffMinutes <= -maxOffsetMinutes) diffMinutes += 1440;
                while (diffMinutes > maxOffsetMinutes) diffMinutes -= 1440;

                const rounded = Math.round(diffMinutes / 15) * 15;
                const baseOffset = rounded;

                user.config.timeZoneRegion = "";
                user.config.timeOffsetMinutes = baseOffset;
                user.config.timeOffset = baseOffset / 60;
                user.config.observesDst = dstObservesInput;
                user.config.hasSetTZ = true;

                response += `\n\nSet your timezone offset to ${formatUtcOffset(baseOffset)}.`;
                if (dstObservesInput === true) response += " Your region is marked as observing daylight saving time.";
                if (dstObservesInput === false) response += " Your region is marked as not observing daylight saving time.";
            }
            else {
                response += "\n\nSorry, I couldn't parse your timezone. Try again?";
            }
        }

        cmd.followUp(response);
        await user.save();
    },

    subscribedButtons: ["tzUp", "tzDown", "tzSave"],

    async onbutton(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);
        const getCurrentOffsets = () => {
            const baseMinutes = typeof user.config.timeOffsetMinutes === "number" ? user.config.timeOffsetMinutes
                : typeof user.config.timeOffset === "number" ? user.config.timeOffset * 60
                    : 0;
            const effectiveMinutes = baseMinutes;
            return { baseMinutes, effectiveMinutes };
        };

        const bumpOffset = (deltaMinutes) => {
            const { baseMinutes } = getCurrentOffsets();
            const roundedBase = Math.round(baseMinutes / 15) * 15;
            const nextBase = roundedBase + deltaMinutes;
            user.config.timeOffsetMinutes = nextBase;
            user.config.timeOffset = nextBase / 60;
        };

        const renderPrompt = () => {
            const { effectiveMinutes } = getCurrentOffsets();
            const displayTime = DateTime.utc().plus({ minutes: effectiveMinutes });
            return `## Timezone Configuration\n\nPlease use the buttons to make the following number your current time\n${displayTime.toFormat("h:mm a")}\n${displayTime.toFormat("HHmm")}`;
        };

        switch (cmd.customId) {
            case "tzUp":
                bumpOffset(15);
                cmd.update(renderPrompt());
                break;
            case "tzDown":
                // NOTE: it would be better of the offset is stored in the buttons until they click save.
                bumpOffset(-15);
                cmd.update(renderPrompt());
                break;
            case "tzSave":
                user.config.hasSetTZ = true;
                {
                    const { effectiveMinutes } = getCurrentOffsets();

                    cmd.update({
                        content: `## Timezone Configured\n\n${formatUtcOffset(effectiveMinutes)}`,
                        components: []
                    });
                }
                break;
        }

        user.save();
    },

    async autocomplete(cmd) {
        let allTimezones = Intl.supportedValuesOf("timeZone");
        const userInput = cmd.options.getFocused() || "";

        // Get the top matching results
        if (userInput) {
            allTimezones = sortByMatch(allTimezones, userInput);
        }

        // Limit to discord max
        allTimezones = allTimezones.slice(0, 25);

        // Format for discord
        let autocompletes = [];
        for (let timezone of allTimezones) {
            autocompletes.push({
                name: timezone,
                value: timezone
            });
        }

        cmd.respond(autocompletes);
    }
};
