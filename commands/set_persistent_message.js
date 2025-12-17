// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, guildByObj } = require("./modules/database.js");
const { Events, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { censor } = require("./filter");

async function checkPersistentDeletion(guildStore, channelId, messageId) {
    // If persistence is not active, or a new persistence message was posted, it was stewbot who deleted it.

    if (!guildStore?.persistence[channelId]?.active) return;

    // Fetch the latest `lastPost`
    const lastPost = (
        await Guilds.findOne({ id: guildStore.id })
            .distinct(`persistence.${channelId}.lastPost`)
    )[0];

    if (lastPost !== messageId) {
        return;
    }
    // If stewbot did not delete it, deactivate it.
    const guild = await Guilds.findOne({ id: guildStore.id });
    let persistChannel = guild.persistence.get(channelId);
    persistChannel.active = false;
    await guild.save();

    const channel = client.channels.cache.get(channelId);
    if (channel.isSendable()) {
        // @ts-ignore
        channel.send(`I have detected that a moderator deleted the persistent message set for this channel, and as such I have deactivated it. To reactivate it, a moderator can run ${cmds?.set_persistent_message?.mention ?? "the persistent message command"}.`).catch(() => {});
    }
}

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("set_persistent_message")
            .setDescription("Set a message that will ALWAYS be visible as the latest message posted in this channel")
            .addBooleanOption(option =>
                option.setName("active").setDescription("Should the persistent message be actively run in this channel?")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("content").setDescription("The message to have persist")
                    .setMinLength(1)
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Information, Categories.Configuration, Categories.Administration, Categories.Server_Only],
            shortDesc: "Set a message that will ALWAYS be visible as the latest message posted in this channel", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure a persistent message that will, in the server's name, always be persistently posted on the bottom of this channel.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const guild = await guildByObj(cmd.guild);

        // If we're changing settings, clear the old message since we'll send a new one
        if (guild.persistence.get(cmd.channel.id)?.lastPost) {
            try {
                var lastPersistent = await cmd.channel.messages.fetch(guild.persistence.get(cmd.channel.id).lastPost);
                if (lastPersistent) await lastPersistent.delete();
            }
            catch {}
        }

        // Initialize data
        if (!guild.persistence.has(cmd.channel.id)) {
            guild.persistence.set(cmd.channel.id, {
                "active": false,
                "content": "<Persistent Message Placeholder>",
                "lastPost": null
            });
        }

        guild.persistence.get(cmd.channel.id).active = cmd.options.getBoolean("active");

        if (cmd.options.getString("content") !== null) guild.persistence.get(cmd.channel.id).content = cmd.options.getString("content");
        const botPerms = cmd.channel.permissionsFor(client.user.id);
        if (
            botPerms?.has(PermissionFlagsBits.ManageWebhooks) &&
            botPerms.has(PermissionFlagsBits.ReadMessageHistory) &&
            botPerms.has(PermissionFlagsBits.ManageMessages) &&
            "fetchWebhooks" in cmd.channel &&
            "createWebhook" in cmd.channel
        ) {
            await cmd.followUp({ content: `I have set your settings for this channel's persistent messages.` });

            var resp = {
                "content": await censor(guild.persistence.get(cmd.channel.id).content),
                "avatarURL": cmd.guild.iconURL(),
                "username": cmd.guild.name
            };

            // If they just set it to active, send the message
            if (guild.persistence.get(cmd.channel.id).active) {
                // Discord server name edge case - TODO: functionize to use elsewhere
                if (resp?.username?.toLowerCase().includes("discord")) {
                    resp.username = "[SERVER]";
                }
                let webhooks = await cmd.channel.fetchWebhooks();
                let hook = webhooks.find(h => h.token);
                if (!hook) {
                    const channel = await client.channels.fetch(cmd.channel.id);
                    hook = (channel && "createWebhook" in channel)
                        ? await channel.createWebhook({
                            name: config.name,
                            avatar: config.pfp
                        })
                        : null;
                }
                if (hook) {
                    const sent = await hook.send(resp);
                    guild.persistence.get(cmd.channel.id).lastPost = sent.id;
                }
            }
        }
        else {
            cmd.followUp(`I need to be able to read message history, delete messages, and manage webhooks to use persistent messages. Without these permissions I cannot manage persistent messages here.`);
            guild.persistence.get(cmd.channel.id).active = false;
        }

        await guild.save();
    },

    /**
     * @param {import('discord.js').Message} msg
     * @param {import("./modules/database.js").GuildDoc} guildStore
     * */
    async [Events.MessageCreate](msg, context, guildStore) {
        if (msg.webhookId) return;
        if (!msg.guild) return;
        applyContext(context);

        // const guild = await guildByObj(msg.guild);
        const guild = guildStore;

        // Persistent messages, if the server has them enabled
        if (
            guild.persistence[msg.channel.id]?.active &&
            "permissionsFor" in msg.channel &&
            "fetchWebhooks" in msg.channel &&
            "createWebhook" in msg.channel
        ) {
            const permissions = msg.channel.permissionsFor(client.user.id);
            if (permissions?.has(PermissionFlagsBits.ManageWebhooks) && permissions.has(PermissionFlagsBits.ManageMessages) && permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
                if (guild.persistence[msg.channel.id].lastPost) {
                    msg.channel.messages.fetch(guild.persistence[msg.channel.id].lastPost).then(mes => {
                        mes?.delete()?.catch(() => {});
                    })
                        .catch(() => {});
                }
                var resp = {
                    "content": guild.persistence[msg.channel.id].content,
                    "avatarURL": msg.guild.iconURL(),
                    "username": msg.guild.name
                };
                let webhooks = await msg.channel.fetchWebhooks();
                let hook = webhooks.find(h => h.token);

                if (!hook) {
                    const channel = await client.channels.fetch(msg.channel.id);
                    hook = (channel && "createWebhook" in channel)
                        ? await channel.createWebhook({
                            name: config.name,
                            avatar: config.pfp
                        })
                        : null;
                }
                if (!hook) return;

                const newMessage = await hook.send(resp);

                await guildByObj(msg.guild, {
                    [`persistence.${msg.channel.id}.lastPost`]: newMessage.id
                });

            }
            else {
                if (msg.channel.isSendable()) {
                    // @ts-ignore
                    msg.channel.send(`I do not have sufficient permissions to manage persistent messages for this channel. Please make sure I can manage webhooks, read message history, and delete messages and then run ${cmds.set_persistent_message.mention}.`);
                }

                await guildByObj(msg.guild, {
                    [`persistence.${msg.channel.id}.active`]: false
                });
            }

            // Maybe save the new ID, then delete the old one? Might work better in high-traffic servers. Also timeout for 3 seconds before reposting
            // await guild.save();
        }
    },

    async [Events.MessageDelete](msg, guildStore) {
        if (!msg.guild) return;

        if (guildStore?.persistence?.[msg.channel.id]?.active && guildStore.persistence?.[msg.channel.id]?.lastPost === msg.id) {
            setTimeout(() => { checkPersistentDeletion(guildStore, msg.channel.id, msg.id); }, 1500);
        }
    }
};
