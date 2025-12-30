// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { ContextMenuCommandBuilder, AttachmentBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
function applyContext(context = {}) {
    for (const key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate
const fs = require("fs");
const { limitLength } = require("../utils.js");
const config = require("../data/config.json");

const components = [
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("save_meme")
            .setLabel("Approve meme")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("delete-all")
            .setLabel("Delete message")
            .setStyle(ButtonStyle.Danger)
    )
        .toJSON()
];

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new ContextMenuCommandBuilder().setName("submit_meme")
            .setType(ApplicationCommandType.Message),

        // Optional fields

        extra: {
            "contexts": [0, 1, 2], "integration_types": [0, 1],
            "desc": "Submit a meme to the Stewbot moderators for verification to show up in `/fun meme`"
        },

        requiredGlobals: [],

        deferEphemeral: true,

        help: {
            helpCategories: [Categories.Bot, Categories.Entertainment, Categories.Context_Menu],
            shortDesc: "Submit a meme to the Stewbot moderators for verification to show up in `/fun meme`", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
                `Using this command on a message with an image or video will submit it to the Stewbot moderators to verify to begin showing up in the ${cmds?.fun?.meme?.mention||"/fun meme"} command. This is a context menu command, and is accessed by holding down on a message on mobile, or right clicking on desktop, and then selecting "Apps".`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        if (cmd.targetMessage.attachments.size === 0) {
            await cmd.followUp({ ephemeral: true, content: "I'm sorry, but I didn't detect any attachments on that message. Note that it has to be attached (uploaded), and that I don't visit embedded links." });
            return;
        }
        let i = 0;
        let files = [];
        for (let a of cmd.targetMessage.attachments) {
            var temp = a[1].url.split("?")[0].split(".");
            let dots = temp[temp.length - 1];
            if (!["webp", "mov", "png", "jpg", "jpeg", "gif", "mp4", "mp3", "wav", "webm", "ogg"].includes(dots)) {
                await cmd.followUp({ content: `I don't support/recognize the file extension \`.${dots}\``, ephemeral: true });
                return;
            }
            await fetch(a[1].url).then(d => d.arrayBuffer())
                .then(d => {
                    const tempMeme = new AttachmentBuilder(Buffer.from(d), { name: `${i}.${dots}` });
                    files.push(tempMeme);
                });
            i++;
        }
        const targetChannel = client.channels.cache.get(process.env.beta ? config.betaNoticeChannel : config.noticeChannel);
        if (
            !targetChannel.isTextBased() ||
            !targetChannel.isSendable()
        ) {
            await cmd.followUp({ content: "Unable to submit meme right now; report channel is unavailable.", ephemeral: true });
            return;
        }

        await targetChannel.send({
            content: limitLength(`User ${cmd.user.username} submitted a meme for evaluation.`),
            files: files,
            components: components
        });
        await cmd.followUp({ content: `Submitted for evaluation`, ephemeral: true });
    },

    subscribedButtons: ["save_meme"],

    async onbutton(cmd, context) {
        applyContext(context);

        for (const [, a] of cmd.message.attachments) {
            let temp = a.url.split("?")[0].split(".");
            let dots = temp[temp.length - 1];
            if (!["webp", "mov", "png", "jpg", "jpeg", "gif", "mp4", "mp3", "wav", "webm", "ogg"].includes(dots)) {
                await cmd.deferReply({ ephemeral: true }).catch(() => null);
                cmd.editReply({ content: `I don't support or recognize that format (\`.${dots}\`)` });
                return;
            }
            const c = await fetch(a.url);
            const d = await c.arrayBuffer();
            const memeNum = (await fs.promises.readdir("./memes")).length;
            await fs.promises.writeFile(`./memes/${memeNum}.${dots}`, Buffer.from(d));
        };
        cmd.update({ components: [] });
        cmd.message.react("✅");
    }
};
