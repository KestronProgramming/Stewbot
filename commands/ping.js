// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { ConfigDB } = require("./modules/database.js");
const { SlashCommandBuilder, Events } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const mongoose = require("mongoose");
const ms = require("ms");
const { notify } = require("../utils");

let uptime = 0; // Bot uptime in seconds I think?

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Check uptime stats")
            .addBooleanOption(option =>
                option
                    .setName("private")
                    .setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),
        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        // Optional fields
        requiredGlobals: [],

        // AI tool configuration - allows AI to call this command
        // aiToolOptions: {
        //     toolable: true,
        //     sendDirect: false, // Response goes back to AI so it can relay status in its own words
        //     requiresApproval: true // Ping is safe, no approval needed
        // },

        help: {
            helpCategories: [Categories.General, Categories.Bot, Categories.Information],
            shortDesc: "Check uptime stats", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`The standard command to check if the bot is online, how long it's been online for, and in how many places it's installed.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const [app, dbPingInMillis] = await Promise.all([
            client.application.fetch(),

            (async () => {
                const db = mongoose.connection.db;
                const start = performance.now();
                await db.command({ ping: 1 });
                return +(performance.now() - start).toFixed(2);
            })()
        ]);

        cmd.followUp(
            `**Online**\n` +
			`- Discord latency: ${ms(client.ws.ping, { long: true })}\n` +
			`- Database latency: ${ms(dbPingInMillis, { long: true })}\n` +
			`- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n` +
			`- Uptime: ${ms(Date.now() - (uptime * 1000), { long: true })}\n` +
			`- Server Count: ${client.guilds.cache.size} Servers\n` +
			`- User Install Count: ${app.approximateUserInstallCount} Users`
        );
    },

    async [Events.ClientReady]() {
        let bootMOTD = ``;

        // Determine uptime
        const bootedAtTimestamp = `<t:${Math.round(Date.now() / 1000)}:R>`;

        const config = await ConfigDB.findOne();

        if (config) {
            const rebootIntentional = Date.now() - config.restartedAt < ms("30s");
            if (rebootIntentional) {
                // The reboot was intentional
                uptime = Math.round(config.restartedAt / 1000);
                bootMOTD += `Bot resumed after restart ${bootedAtTimestamp}`;
            }
            else {
                // The reboot was accidental, so reset our bootedAt time
                config.bootedAt = Date.now();
                uptime = Math.round(Date.now() / 1000);
                bootMOTD += `Started ${bootedAtTimestamp}`;
                config.save();
            }
        }

        // Add boot time
        bootMOTD += ` | Booting took ${Date.now() - global.bootedAt}ms`;

        notify(bootMOTD);

        console.log(`Logged into ${client.user.tag}`);

    }
};
