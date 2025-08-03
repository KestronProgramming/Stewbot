// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Events, AttachmentBuilder, MessageAttachment, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

module.exports = {
	data: { command: null },
    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {UserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context) {
		applyContext(context);
		// `context` currently does not respect requested globals
		if (!msg.content.startsWith("~retrieve ")) return;
		
		const id = msg.content.match(/\b\d+\b/)?.[0];
        if (!id || isNaN(+id)) return;

		try {
            const d = await fetch("https://kap-archive.bhavjit.com/g/"+id).then(d=>d.json());

            if ((d.status !== 200 && d.severe) || typeof d.code !== "string") {
                msg.reply({ content: "Requested program could not be retrieved from [KAP Archive](https://kap-archive.bhavjit.com)." });
                return;
            }

            const buffer = Buffer.from(d.code, "utf-8");

            const safeTitle = d.title.replace(/[^a-z0-9_\-]/gi, "_").slice(0, 64);
            const filename = `${safeTitle || "file"}.js`;

            const attachment = new AttachmentBuilder(buffer, { name: filename });


            await msg.reply({ content: `Code retrieved from [KAP Archive](https://kap-archive.bhavjit.com).`,
                embeds: [{
                        type: "rich",
                        title: d.title,
                        description: `\u200b`,
                        color: 0x00ff00,
                        author: {
                            name: `Made by ${d.author.nick}`,
                            url: `https://www.khanacademy.org/profile/${d.author.id}`,
                        },
                        fields: [
                            {
                                name: `Created`,
                                value: `${new Date(d.created).toDateString()}`,
                                inline: true
                            },
                            {
                                name: `Last Updated`,
                                value: `${new Date(d.updated).toDateString()}`,
                                inline: true
                            },
                            {
                                name: `Last Updated in Archive`,
                                value: `${new Date(d.archive.updated).toDateString()}`,
                                inline: true
                            },
                            {
                                name: `Width/Height`,
                                value: `${d.width}/${d.height}`,
                                inline: true
                            },
                            {
                                name: `Votes`,
                                value: `${d.votes}`,
                                inline: true
                            },
                            {
                                name: `Spin-Offs`,
                                value: `${d.spinoffs}`,
                                inline: true
                            },
                        ],
                        image: {
                            url: `https://kap-archive.bhavjit.com/thumb/${d.id}/latest.png`,
                            height: 0,
                            width: 0,
                        },
                        thumbnail: {
                            url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                            height: 0,
                            width: 0,
                        },
                        footer: {
                            text: `Retrieved from https://kap-archive.bhavjit.com/`,
                            icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                        },
                        url: `https://kap-archive.bhavjit.com/view?p=${d.id}`
                    }
                ],
                files: [attachment] });
		} catch (e) { /* Silence!! MORTALS!!! */ } 
	},
};
