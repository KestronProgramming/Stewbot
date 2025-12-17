// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Events, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, DMChannel, ChannelType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("ticket")
            .setDescription("Set up a ticket system here for users to contact mods")
            .addChannelOption(option =>
                option.setName("channel").setDescription("The channel for tickets to be opened in on the staff end")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        // Optional fields

        extra: { "contexts": [0], "integration_types": [0] },

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.Administration, Categories.Configuration, Categories.Server_Only],
            shortDesc: "Set up a ticket system here for users to contact mods", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Use this command in the channel you would like Stewbot to post the ticket message in. This message will contain a button that will connect the user's DMs with Stewbot to a thread in the channel specified during command setup.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const targetChannel = cmd.options.getChannel("channel");
        if (!("isSendable" in targetChannel) || !targetChannel.isSendable()) {
            await cmd.followUp({ content: "I cannot create ticket threads in that channel because I lack permission to send messages there.", ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${cmd.guild.name} Moderator Tickets`)
            .setDescription(`Press the button below to open up a private ticket with ${cmd.guild.name} moderators.`)
            .setColor(0x006400)
            .setThumbnail(cmd.guild.iconURL() ?? null)
            .setFooter({ text: `Tickets will take place over DMs, make sure to have DMs open to ${client.user.username}.` });

        await cmd.followUp({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-${targetChannel.id}`)
                        .setLabel("Create private ticket with staff")
                        .setStyle(ButtonStyle.Success)
                )
                    .toJSON()
            ]
        });
    },

    /**
     * @param {import('discord.js').Message} msg
     * */
    async [Events.MessageCreate](msg, context) {
        applyContext(context);

        // Ticket system
        if ("ownerId" in msg.channel && msg.channel.ownerId === client.user.id && msg.channel.name?.startsWith("Ticket with ") && !msg.author.bot) {
            let resp = {
                files: [],
                content: `Ticket response from **${msg.guild.name}**. To respond, make sure to reply to this message.\nTicket ID: ${msg.channel.name.split("Ticket with ")[1].split(" in ")[1]}/${msg.channel.id}`
            };
            msg.attachments.forEach((attached, key) => {
                // TODO_LINT: test this
                let url = attached.url.toLowerCase();
                if (key !== "0" || (!url.includes(".jpg") && !url.includes(".png") && !url.includes(".jpeg"))) {
                    resp.files.push(attached.url);
                }
            });
            resp.embeds = [new EmbedBuilder()
                .setColor(0x006400)
                .setTitle(`Ticket Message from ${msg.guild.name}`)
                .setAuthor({
                    name: msg.author.globalName || msg.author.username,
                    iconURL: msg.author.displayAvatarURL(),
                    url: `https://discord.com/users/${msg.author.id}`
                })
                .setDescription(msg.content ? msg.content : "⠀")
                .setTimestamp(new Date(msg.createdTimestamp))
                .setThumbnail(msg.guild.iconURL())
                .setFooter({
                    text: "Make sure to reply to this message to respond"
                })
                .setImage(msg.attachments.first()?.url ?? null)
            ];
            try {
                client.users.cache.get(msg.channel.name.split("Ticket with ")[1].split(" in ")[0]).send(resp)
                    .catch(() => {});
            }
            catch (e) {}
        }

        if (msg.reference && msg.channel instanceof DMChannel && !msg.author.bot) {
            var rMsg = await msg.channel.messages.fetch(msg.reference.messageId);
            if (rMsg.author.id === client.user.id && rMsg.content.includes("Ticket ID: ")) {
                let resp = {
                    content: msg.content,
                    username: msg.member?.nickname || msg.author.globalName || msg.author.username,
                    avatar_url: msg.author.displayAvatarURL()
                };
                let channel = client.channels.cache.get(rMsg.content.split("Ticket ID: ")[1].split("/")[0]);
                if (channel.isSendable() && "fetchWebhooks" in channel) {
                    let webhooks = await channel.fetchWebhooks();
                    let hook = webhooks.find(h => h.token);
                    if (hook) {
                        fetch(`https://discord.com/api/webhooks/${hook.id}/${hook.token}?thread_id=${rMsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(resp)
                        }).then(d => d.text());
                    }
                    else {
                        channel.createWebhook({
                            name: config.name,
                            avatar: config.pfp
                        }).then(d => {
                            fetch(`https://discord.com/api/webhooks/${d.id}/${d.token}?thread_id=${rMsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(resp)
                            });
                        });
                    }
                }
                return;
            }
        }
    },

    // Only button subscriptions matched will be sent to the handler
    subscribedButtons: [/ticket-.*/],

    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
        applyContext(context);

        if (cmd.customId?.startsWith("ticket-")) {
            const target = client.channels.cache.get(cmd.customId.split("-")[1]);
            if (!target.isSendable()) {
                await cmd.reply({
                    content: "I cannot open a ticket because I do not have permission to send messages in the staff channel.",
                    ephemeral: true
                });
                return;
            }
            // @ts-ignore
            target.send(`Ticket opened by **${cmd.member?.nickname || cmd.user.globalName || cmd.user.username}**.`).then(async msg => {
                const thread = await msg.startThread({
                    name: `Ticket with ${cmd.user.id} in ${cmd.customId.split("-")[1]}`,
                    autoArchiveDuration: 60,
                    type: "GUILD_PUBLIC_THREAD",
                    reason: `Ticket opened by ${cmd.user.username}`
                });
                try {
                    await cmd.user.send(`Ticket opened in **${cmd.guild?.name ?? "this server"}**. You can reply to this message to converse in the ticket. Note that any messages not a reply will not be sent to the ticket.\n\nTicket ID: ${cmd.customId.split("-")[1]}/${thread.id}`);
                }
                catch {}
            });
            await cmd.deferUpdate();
        }
    }
};
