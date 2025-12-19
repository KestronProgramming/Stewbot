// #region CommandBoilerplate
const { Events, AttachmentBuilder, EmbedBuilder } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: { command: null },
    /**
     * @param {import('discord.js').Message} msg
     * */
    async [Events.MessageCreate](msg, context) {
        applyContext(context);
        // `context` currently does not respect requested globals
        if (!msg.content.startsWith("~retrieve ")) return;

        const id = msg.content.match(/\b\d+\b/)?.[0];
        if (!id || isNaN(+id)) return;

        try {
            const d = await fetch("https://kap-archive.bhavjit.com/g/" + id).then(d => d.json());

            if ((d.status !== 200 && d.severe) || typeof d.code !== "string") {
                msg.reply({ content: "Requested program could not be retrieved from [KAP Archive](https://kap-archive.bhavjit.com)." });
                return;
            }

            const buffer = Buffer.from(d.code, "utf-8");

            const safeTitle = d.title.replace(/[^a-z0-9_-]/gi, "_").slice(0, 64);
            const filename = `${safeTitle || "file"}.js`;

            const attachment = new AttachmentBuilder(buffer, { name: filename });

            if (!msg.channel?.isSendable?.()) return;

            const embed = new EmbedBuilder()
                .setTitle(d.title)
                .setDescription(`\u200b`)
                .setColor(0x00ff00)
                .setAuthor({
                    name: `Made by ${d.author.nick}`,
                    url: `https://www.khanacademy.org/profile/${d.author.id}`
                })
                .addFields(
                    { name: `Created`, value: `${new Date(d.created).toDateString()}`, inline: true },
                    { name: `Last Updated`, value: `${new Date(d.updated).toDateString()}`, inline: true },
                    { name: `Last Updated in Archive`, value: `${new Date(d.archive.updated).toDateString()}`, inline: true },
                    { name: `Width/Height`, value: `${d.width}/${d.height}`, inline: true },
                    { name: `Votes`, value: `${d.votes}`, inline: true },
                    { name: `Spin-Offs`, value: `${d.spinoffs}`, inline: true }
                )
                .setImage(`https://kap-archive.bhavjit.com/thumb/${d.id}/latest.png`)
                .setThumbnail(`https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`)
                .setFooter({
                    text: `Retrieved from https://kap-archive.bhavjit.com/`,
                    iconURL: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`
                })
                .setURL(`https://kap-archive.bhavjit.com/view?p=${d.id}`);

            await msg.reply({
                content: `Retrieved from [KAP Archive](https://kap-archive.bhavjit.com).`,
                embeds: [embed],
                files: [attachment]
            });
        }
        catch { /* Silence!! MORTALS!!! */ }
    }
};
