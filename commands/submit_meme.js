// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
// #endregion Boilerplate
const fs = require("fs")

module.exports = {
    data: {
        // Slash command data
        command: new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message),

        // Optional fields

        extra: {
            "contexts": [0, 1, 2], "integration_types": [0, 1],
            "desc": "Submit a meme to the Kestron moderators for verification to show up in `/fun meme`"
        },

        requiredGlobals: ["presets", "limitLength"],

        help: {
            "helpCategory": "Entertainment",
            "helpDesc": "Submit a meme to be approved for the bot to post"
        },
    },

    async execute(cmd, context) {
        applyContext(context);

        if (cmd.targetMessage.attachments.size === 0) {
            cmd.followUp({ ephemeral: true, content: "I'm sorry, but I didn't detect any attachments on that message. Note that it has to be attached (uploaded), and that I don't visit embedded links." });
            return;
        }
        cmd.followUp({ content: `Submitted for evaluation`, ephemeral: true });
        let i = 0;
        for (a of cmd.targetMessage.attachments) {
            var dots = a[1].url.split("?")[0].split(".");
            dots = dots[dots.length - 1];
            if (!["mov", "png", "jpg", "jpeg", "gif", "mp4", "mp3", "wav", "webm", "ogg"].includes(dots)) {
                cmd.reply({ content: `I don't support/recognize the file extension \`.${dots}\``, ephemeral: true });
                return;
            }
            await fetch(a[1].url).then(d => d.arrayBuffer()).then(d => {
                fs.writeFileSync(`./tempMemes/${i}.${dots}`, Buffer.from(d));
            });
            i++;
        }
        await client.channels.cache.get(process.env.noticeChannel).send({ content: limitLength(`User ${cmd.user.username} submitted a meme for evaluation.`), files: fs.readdirSync("./tempMemes").map(a => `./tempMemes/${a}`), components: presets.meme });
        fs.readdirSync("./tempMemes").forEach(file => {
            fs.unlinkSync("./tempMemes/" + file);
        });
    }
};
