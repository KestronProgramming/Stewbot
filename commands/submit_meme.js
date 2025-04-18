// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, AttachmentBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
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
const fs = require("fs")

const components = [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("save_meme").setLabel("Approve meme").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Danger)
)]

module.exports = {
    data: {
        // Slash command data
        command: new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message),

        // Optional fields

        extra: {
            "contexts": [0, 1, 2], "integration_types": [0, 1],
            "desc": "Submit a meme to the Stewbot moderators for verification to show up in `/fun meme`"
        },

        requiredGlobals: [],

        deferEphemeral: true,

        help: {
            helpCategories: [Categories.Bot, Categories.Entertainment, Categories.Context_Menu],
			shortDesc: "Submit a meme to the Stewbot moderators for verification to show up in `/fun meme`",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Using this command on a message with an image or video will submit it to the Stewbot moderators to verify to begin showing up in the ${cmds.fun.meme.mention} command. This is a context menu command, and is accessed by holding down on a message on mobile, or right clicking on desktop, and then selecting "Apps".`
        },
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        if (cmd.targetMessage.attachments.size === 0) {
            cmd.followUp({ ephemeral: true, content: "I'm sorry, but I didn't detect any attachments on that message. Note that it has to be attached (uploaded), and that I don't visit embedded links." });
            return;
        }
        cmd.followUp({ content: `Submitted for evaluation`, ephemeral: true });
        let i = 0;
        let files = [ ]
        for (a of cmd.targetMessage.attachments) {
            var dots = a[1].url.split("?")[0].split(".");
            dots = dots[dots.length - 1];
            if (!["mov", "png", "jpg", "jpeg", "gif", "mp4", "mp3", "wav", "webm", "ogg"].includes(dots)) {
                cmd.reply({ content: `I don't support/recognize the file extension \`.${dots}\``, ephemeral: true });
                return;
            }
            await fetch(a[1].url).then(d => d.arrayBuffer()).then(d => {
                const tempMeme = new AttachmentBuilder(Buffer.from(d), { name: `${i}.${dots}` });
                files.push(tempMeme);
            });
            i++;
        }
        await client.channels.cache.get(process.env.beta ? config.betaNoticeChannel : config.noticeChannel).send({ 
            content: limitLength(`User ${cmd.user.username} submitted a meme for evaluation.`), 
            files: files, 
            components: components 
        });
    },

    subscribedButtons: ["save_meme"],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

        for (const [name, a] of cmd.message.attachments) {
            var dots=a.url.split("?")[0].split(".");
            dots=dots[dots.length-1];
            if(!["mov","png","jpg","jpeg","gif","mp4","mp3","wav","webm","ogg"].includes(dots)){
                cmd.reply({content:`I don't support or recognize that format (\`.${dots}\`)`,ephemeral:true});
                return;
            }
            const c = await fetch(a.url);
            const d = await c.arrayBuffer();
            const memeNum = (await fs.promises.readdir("./memes")).length;
            await fs.promises.writeFile(`./memes/${memeNum}.${dots}`,Buffer.from(d));
        };
        cmd.update({components:[]});
        cmd.message.react("✅");
	}
};
