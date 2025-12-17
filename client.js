// This file creates the Discord.js client object, and exports it for all files to access.

const { Client, GatewayIntentBits, Partials } = require("discord.js");

/**
 * @type {import('discord.js').Client<true>}
 *
 * A client who we can assume is *always* logged in.
 */
const client = global.client = new Client({
    // Login with intents that tell discord what events to send us.
    intents: Object.values(GatewayIntentBits)
        .filter(i => typeof(i) == "number")
        .filter(i => i !== GatewayIntentBits.GuildPresences), // Our production bot was denied GuildPresences intents

    // Enable all partials. This means even if the event discord sends us isn't complete,
    //   it will still emit it. This means sometimes various properties might be null.
    partials: Object.keys(Partials)
        .map(a => Partials[a])
});

module.exports = client;
