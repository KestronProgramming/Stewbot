// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { userByObj, Users } = require("./modules/database.js");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

const sherlock = require("sherlockjs");
const { DateTime, FixedOffsetZone } = require("luxon");

function parseFreeformDate(text, customSherlock = sherlock, customNow, require24HourColon = true) {
    if (!text) return null;

    if (customNow && !customSherlock._can_pass_now_in_parse) {
        throw new Error("The custom 'now' property can only be passed if sherlock is modified to accept it.");
    }

    const result = customSherlock.parse(text, customNow, require24HourColon); // NOTE: customNow can only be used with a modified sherlock parser
    if (!result.startDate || isNaN(result.startDate.getTime())) return null;

    return DateTime.fromJSDate(result.startDate);
}

/** @param {HydratedDocument<Users>} user */
function getRegionFromUser(userConfig) {
    const config = userConfig?.config || userConfig;
    if (config.timeZoneRegion) {
        const zoned = DateTime.now().setZone(config.timeZoneRegion);
        if (zoned.isValid) return zoned.zone;
    }

    let baseOffset = typeof config.timeOffsetMinutes === "number" ? config.timeOffsetMinutes : 0;
    if (baseOffset === 0 && typeof config.timeOffset === "number" && config.timeOffset !== 0) {
        baseOffset = config.timeOffset * 60;
    }

    return FixedOffsetZone.instance(baseOffset);
}

function parseTextDateIfValid(text, userConfig, customSherlock = sherlock, customNow) {
    const zone = getRegionFromUser(userConfig);

    // Convert the reference time (customNow) to the user's timezone to get their wall clock time
    // Then create a "fake now" Date with those wall-clock components
    // This ensures sherlock's "past time = tomorrow" logic works from the user's perspective
    let effectiveNow = customNow;
    if (customNow && zone) {
        const userWallClock = DateTime.fromJSDate(customNow).setZone(zone);
        // Create a Date with the same wall-clock values but treated as if they were UTC
        // This tricks sherlock into comparing times as the user would see them
        effectiveNow = new Date(Date.UTC(
            userWallClock.year,
            userWallClock.month - 1, // JavaScript months are 0-indexed
            userWallClock.day,
            userWallClock.hour,
            userWallClock.minute,
            userWallClock.second,
            userWallClock.millisecond
        ));
    }

    const parsed = parseFreeformDate(text, customSherlock, effectiveNow);
    if (!parsed) return null;

    const target = DateTime.fromObject(
        {
            year: parsed.year,
            month: parsed.month,
            day: parsed.day,
            hour: parsed.hour,
            minute: parsed.minute,
            second: parsed.second,
            millisecond: parsed.millisecond
        },
        { zone }
    );

    if (!target.isValid) return null;
    return target.toUTC().toJSDate();
}

// Select which lib to use
// Kept for compatibility with prior naming across commands


const components = {
    timestamp: [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("tsHour")
                .setLabel("Hour")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsMinutes")
                .setLabel("Minutes")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsSeconds")
                .setLabel("Seconds")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsDay")
                .setLabel("Day")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsYear")
                .setLabel("Year")
                .setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("tsMonth")
                .setPlaceholder("Month...")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("January")
                        .setValue("0"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("February")
                        .setValue("1"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("March")
                        .setValue("2"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("April")
                        .setValue("3"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("May")
                        .setValue("4"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("June")
                        .setValue("5"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("July")
                        .setValue("6"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("August")
                        .setValue("7"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("September")
                        .setValue("8"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("October")
                        .setValue("9"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("November")
                        .setValue("10"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("December")
                        .setValue("11")
                )
        ),
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("tsType")
                .setPlaceholder("Display Type...")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Relative")
                        .setDescription("Example: 10 seconds ago")
                        .setValue("R"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Time")
                        .setDescription("Example: 1:48 PM")
                        .setValue("t"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Date")
                        .setDescription("Example: 4/19/22")
                        .setValue("d"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Time w/ Seconds")
                        .setDescription("Example: 1:48:00 PM")
                        .setValue("T"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Long Date")
                        .setDescription("Example: April 19, 2022")
                        .setValue("D"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Long Date & Short Time")
                        .setDescription("April 19, 2022 at 1:48 PM")
                        .setValue("f"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Full Date")
                        .setDescription(
                            "Example: Tuesday, April 19, 2022 at 1:48 PM"
                        )
                        .setValue("F")
                )
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("howToCopy")
                .setLabel("How to Copy")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("onDesktop")
                .setLabel("On Desktop")
                .setStyle(ButtonStyle.Success)
        )
    ],

    tsHourModal: new ModalBuilder()
        .setCustomId("tsHourModal")
        .setTitle("Set the Hour for the Timestamp")
        .addComponents(
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsHourInp")
                    .setLabel("The hour of day...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(4)
                    .setRequired(true)
            ),
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsAmPm")
                    .setLabel("If you used 12 hour, AM/PM")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(false)
            )
        ),
    tsMinutesModal: new ModalBuilder()
        .setCustomId("tsMinutesModal")
        .setTitle("Set the Minutes for the Timestamp")
        .addComponents(
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsMinutesInp")
                    .setLabel("The minutes...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsSecondsModal: new ModalBuilder()
        .setCustomId("tsSecondsModal")
        .setTitle("Set the Seconds for the Timestamp")
        .addComponents(
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsSecondsInp")
                    .setLabel("The seconds...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsDayModal: new ModalBuilder()
        .setCustomId("tsDayModal")
        .setTitle("Set the Day for the Timestamp")
        .addComponents(
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsDayInp")
                    .setLabel("The day of the month...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsYearModal: new ModalBuilder()
        .setCustomId("tsYearModal")
        .setTitle("Set the Year for the Timestamp")
        .addComponents(
            // @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsYearInp")
                    .setLabel("The year...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(4)
                    .setRequired(true)
            )
        )
};

/** @type {import("../command-module").CommandModule} */
module.exports = {
    parseTextDateIfValid: parseTextDateIfValid,
    parseFreeformDate: parseFreeformDate,
    getRegionFromUser: getRegionFromUser,

    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("timestamp")
            .setDescription("Generate a timestamp for use in your message")
            .addStringOption(option =>
                option.setName("quick-input").setDescription("Attempt to parse a sentence into a date.")
            ),

        // Optional fields

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: [],

        deferEphemeral: true,

        help: {
            helpCategories: [Categories.General, Categories.Information, Categories.Entertainment],
            shortDesc: "Generate a timestamp for use in your message", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Generates a timestamp string. Pasting the output will automatically correct the time set to show the correct time for any user regardless of timezone.\n
				For example, if there was a timestamp for 4 EST, a user in PST would see 1.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);

        if (user.config.hasSetTZ) {
            const quickInput = cmd.options.getString("quick-input");
            const userZone = getRegionFromUser(user.config);

            let startingTime = parseTextDateIfValid(quickInput, user.config);
            if (!startingTime) {
                startingTime = DateTime.now().setZone(userZone)
                    .toUTC()
                    .toJSDate();
            }

            const unixSeconds = Math.round(DateTime.fromJSDate(startingTime).toSeconds());

            cmd.followUp({
                content: `<t:${unixSeconds}:t>`,
                components: components.timestamp.map(c => c.toJSON())
            });
        }
        else {
            cmd.followUp(`This command needs you to set your timezone first! Run ${cmds.personal_config.mention} and specify \`timezone_region\` or \`timezone_manual\` to get started,`);
        }
    },

    // Only button subscriptions matched will be sent to the handler
    subscribedButtons: ["timestamp", "howToCopy", "onDesktop", /ts.*/],

    async onbutton(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);
        const userZone = getRegionFromUser(user.config);
        const getMessageTimestampSeconds = () => Number(cmd.message.content.split(":")[1]);
        const getMessageFormat = () => cmd.message.content.split(":")[2].split(">")[0];
        const getZonedMessageDate = () => DateTime.fromSeconds(getMessageTimestampSeconds()).setZone(userZone);
        const toDiscordTimestamp = (dt) => `<t:${Math.round(dt.toUTC().toSeconds())}:${getMessageFormat()}>`;

        switch (cmd.customId) {
            // Buttons
            case "howToCopy":
                cmd.reply({ content: `## Desktop\n- Press the \`On Desktop\` button\n- Press the copy icon on the top right of the code block\n- Paste it where you want to use it\n## Mobile\n- Hold down on the message until the context menu appears\n- Press \`Copy Text\`\n- Paste it where you want to use it`, ephemeral: true });
                break;
            case "onDesktop":
                cmd.reply({ content: `\`\`\`\n${cmd.message.content}\`\`\``, ephemeral: true });
                break;
            case "tsHour":
                if (!cmd.isButton()) return;
                cmd.showModal(components.tsHourModal);
                break;
            case "tsMinutes":
                if (!cmd.isButton()) return;
                cmd.showModal(components.tsMinutesModal);
                break;
            case "tsSeconds":
                if (!cmd.isButton()) return;
                cmd.showModal(components.tsSecondsModal);
                break;
            case "tsDay":
                if (!cmd.isButton()) return;
                cmd.showModal(components.tsDayModal);
                break;
            case "tsYear":
                if (!cmd.isButton()) return;
                cmd.showModal(components.tsYearModal);
                break;

                // Modals
            case "tsYearModal": {
                if (!cmd.isModalSubmit()) return;
                const inp = cmd.fields.getTextInputValue("tsYearInp");
                if (!/^\d+$/.test(inp)) {
                    cmd.deferUpdate();
                    break;
                }

                const updated = getZonedMessageDate().set({ year: Number(inp) });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            case "tsMinutesModal": {
                if (!cmd.isModalSubmit()) return;
                const inp = cmd.fields.getTextInputValue("tsMinutesInp");
                if (!/^\d+$/.test(inp)) {
                    cmd.deferUpdate();
                    break;
                }

                const updated = getZonedMessageDate().set({ minute: Number(inp) });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            case "tsSecondsModal": {
                if (!cmd.isModalSubmit()) return;
                const inp = cmd.fields.getTextInputValue("tsSecondsInp");
                if (!/^\d+$/.test(inp)) {
                    cmd.deferUpdate();
                    break;
                }

                const updated = getZonedMessageDate().set({ second: Number(inp) });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            case "tsHourModal": {
                if (!cmd.isModalSubmit()) return;
                const inp = cmd.fields.getTextInputValue("tsHourInp");
                if (!/^\d+$/.test(inp)) {
                    cmd.deferUpdate();
                    break;
                }

                let hour = Number(inp);
                const amPmInput = cmd.fields.getTextInputValue("tsAmPm").toLowerCase();
                if (amPmInput.startsWith("p") && hour < 12) hour += 12;
                if (amPmInput.startsWith("a") && hour === 12) hour = 0;
                hour = ((hour % 24) + 24) % 24;

                const updated = getZonedMessageDate().set({ hour });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            case "tsDayModal": {
                if (!cmd.isModalSubmit()) return;
                const inpStr = cmd.fields.getTextInputValue("tsDayInp");
                if (!/^\d+$/.test(inpStr)) {
                    cmd.deferUpdate();
                    break;
                }

                const updated = getZonedMessageDate().set({ day: Number(inpStr) });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            // Menus
            case "tsMonth": {
                const month = Number(cmd.values[0]) + 1;
                const updated = getZonedMessageDate().set({ month });
                if (!updated.isValid) {
                    cmd.deferUpdate();
                    break;
                }

                cmd.update(toDiscordTimestamp(updated));
                break;
            }
            case "tsType": {
                // @ts-ignore
                cmd.update(`<t:${Math.round(new Date(Number(cmd.message.content.split(":")[1]) * 1000).getTime() / 1000)}:${cmd.values[0]}>`);
                break;
            }
        }
    }
};
