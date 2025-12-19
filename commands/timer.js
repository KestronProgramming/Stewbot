// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Users, userByID, userByObj } = require("./modules/database.js");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, Events, GuildMember } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const ms = require("ms");
const { escapeBackticks } = require("../utils.js");
const { censor } = require("./filter");

async function finTimer(userId, force) {
    const user = await userByID(userId);

    if (!user.timer) {
        return;
    }
    if (user.timer.time - Date.now() > 10000 && !force) {
        setTimeout(() => { finTimer(userId); }, user.timer.time - Date.now());
        return;
    }
    if (user.timer.respLocation === "DM") {
        try {
            (await client.users.fetch(userId)).send(`Your timer is done!${user.timer.reminder.length > 0 ? `\n\`${user.timer.reminder}\`` : ``}`).catch(e => {console.log(e);});
        }
        catch (e) {console.log(e);}
    }
    else {
        try {
            var chan = await client.channels.fetch(user.timer.respLocation.split("/")[0]);
            try {
                if (chan && chan.isSendable()) {
                    var msg = await chan.messages.fetch(user.timer.respLocation.split("/")[1]);
                    if (msg) {
                        msg.reply(`<@${userId}>, your timer is done!${user.timer.reminder.length > 0 ? `\n\`${escapeBackticks(user.timer.reminder)}\`` : ``}`);
                        msg.edit({
                            components: [
                                new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Clear Timer")
                                        .setCustomId("jerry")
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                )
                                    .toJSON()
                            ]
                        });
                    }
                    else {
                        chan.send(`<@${userId}>, your timer is done!${user.timer.reminder.length > 0 ? `\n\`${escapeBackticks(user.timer.reminder)}\`` : ``}`);
                    }
                }
                else {
                    (await client.users.fetch(userId)).send(`Your timer is done!${user.timer.reminder.length > 0 ? `\n\`${escapeBackticks(user.timer.reminder)}\`` : ``}`).catch(e => {console.log(e);});
                }
            }
            catch {
                (await client.users.fetch(userId)).send(`Your timer is done!${user.timer.reminder.length > 0 ? `\n\`${user.timer.reminder}\`` : ``}`).catch(e => {console.log(e);});
            }
        }
        catch (e) {console.log(e);}
    }
    await user.updateOne({ $unset: { timer: "" } });
}

async function scheduleTimerEnds() {
    // Grab all timers and schedule
    const usersWTimersEnding = await Users.find({
        timer: { $exists: true },
        "timer.time": { $gt: Date.now() - ms("10 min") } // Retroactively finish timers from 10 min ago... too late for anything else
    });

    usersWTimersEnding.forEach(user => {
        setTimeout(() => {
            finTimer(user.id);
        }, user.timer.time - Date.now());
    });
}

/** @type {import("../command-module").CommandModule} */
module.exports = {
    finTimer,
    scheduleTimerEnds,

    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("timer")
            .setDescription("Set a timer/reminder")
            .addStringOption(option =>
                option.setName("reminder").setDescription("What is the timer for?")
                    .setMaxLength(150)
            )
            .addIntegerOption(option =>
                option.setName("hours").setDescription("How many hours?")
                    .setMinValue(0)
                    .setMaxValue(24)
            )
            .addIntegerOption(option =>
                option.setName("minutes").setDescription("How many minutes?")
                    .setMinValue(0)
                    .setMaxValue(59)
            )
            .addIntegerOption(option =>
                option.setName("seconds").setDescription("How many seconds?")
                    .setMinValue(0)
                    .setMaxValue(59)
            )
            .addBooleanOption(option =>
                option.setName("respond_here").setDescription("Should I respond here? If not I'll DM you")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Information, Categories.Entertainment],
            shortDesc: "Set a timer/reminder", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Set a timer that will notify you after the specified amount of time in a configurable location.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);

        if (user.timer) {
            await cmd.followUp({
                content: `You already have a timer registered. This timer must be cleared before setting another. Would you like to clear it now?`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Clear Timer")
                            .setCustomId(`clearTimer-${cmd.user.id}`)
                            .setStyle(ButtonStyle.Danger)
                    )
                        .toJSON()
                ]
            });
            return;
        }
        else {
            // Calc length
            var timer = 0;
            if (cmd.options.getInteger("hours") !== null) timer += cmd.options.getInteger("hours") * 60000 * 60;
            if (cmd.options.getInteger("minutes") !== null) timer += cmd.options.getInteger("minutes") * 60000;
            if (cmd.options.getInteger("seconds") !== null) timer += cmd.options.getInteger("seconds") * 1000;
            if (timer < 1) {
                await cmd.followUp(`Please set a valid time for the timer`);
                return;
            }

            // Calc reminder settings
            var respondHere = cmd.options.getBoolean("respond_here") || false;
            var resp;
            var reminder = "";
            if (cmd.options.getString("reminder") !== null) {
                reminder = await censor(cmd.options.getString("reminder"), cmd.guild, true);
            }

            if (respondHere && cmd.channel.isSendable()) {
                respondHere = false;
                resp = await cmd.followUp({
                    content: `Alright, I have set a timer that expires <t:${Math.round((Date.now() + timer) / 1000)}:R> at <t:${Math.round((Date.now() + timer) / 1000)}:f>. I was asked to ping you here, but I cannot do that in this channel. I will DM you instead.${reminder.length > 0 ? `\n\`${reminder}\`` : ``}`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Clear Timer")
                                .setCustomId(`clearTimer-${cmd.user.id}`)
                                .setStyle(ButtonStyle.Danger)
                        )
                            .toJSON()
                    ]
                });
            }
            else {
                resp = await cmd.followUp({
                    content: `Alright, I have set a timer that expires <t:${Math.round(
                        (Date.now() + timer) / 1000
                    )}:R> at <t:${Math.round(
                        (Date.now() + timer) / 1000
                    )}:f>. I will ${
                        respondHere ? `ping you here` : `DM you`
                    } when it finishes.${
                        reminder.length > 0 ? `\n\`${reminder}\`` : ``
                    }`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Clear Timer")
                                .setCustomId(`clearTimer-${cmd.user.id}`)
                                .setStyle(ButtonStyle.Danger)
                        )
                            .toJSON()
                    ]
                });
            }

            user.timer = {
                "time": Date.now() + timer,
                "respLocation": respondHere ? `${cmd.channel.id}/${resp.id}` : "DM",
                "reminder": reminder
            };
            await user.save();

            // await userByObj(cmd.user, {
            //     "timer.time": Date.now()+timer,
            //     "timer.respLocation": respondHere?`${cmd.channel.id}/${resp.id}`:"DM",
            //     "timer.reminder": reminder
            // })

            setTimeout(() => {finTimer(cmd.user.id);}, timer);
        }
    },

    // Only button subscriptions matched will be sent to the handler
    subscribedButtons: [/clearTimer-.*/],

    async onbutton(cmd, context) {
        applyContext(context);

        const user = await userByObj(cmd.user);

        if (cmd.customId?.startsWith("clearTimer-")) {
            if (
                (
                    cmd.member instanceof GuildMember &&
                    cmd.member?.permissions?.has(PermissionFlagsBits.ManageMessages) &&
                    cmd.message.id === user.timer?.respLocation.split("/")[1]
                )
                || cmd.user.id === cmd.customId.split("-")[1]
            ) {
                await user.updateOne({ $unset: { timer: "" } });
                if (cmd.message?.editable) {
                    await cmd.message
                        .edit({
                            components: [
                                new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Clear Timer")
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                        .setCustomId("disabled")
                                )
                                    .toJSON()
                            ]
                        })
                        .catch(() => {});
                }
                await cmd.reply({ content: `I have cleared the timer.`, ephemeral: true });
            }
            else {
                await cmd.reply({ content: `That is not your timer to clear.`, ephemeral: true });
            }
        }
    },

    async [Events.ClientReady]() {
        await scheduleTimerEnds();
    }
};
