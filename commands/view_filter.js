// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { guildByObj } = require("./modules/database.js");
const { AttachmentBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, GuildMember } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("view_filter")
            .setDescription("View the list of blacklisted words for this server")
            .setDMPermission(false)
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),
        extra: { "contexts": [0], "integration_types": [0] },

        // Optional fields
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.Information, Categories.Server_Only],
            shortDesc: "View the list of blacklisted words for this server", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Using this command will add a button that allows those who press it to view a spoilered list of all words this server has configured to block. This command, due to the nature of it, can have some very colorful language contained within the DM after pressing the button.`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const guild = await guildByObj(cmd.guild);
        const channel = cmd.channel;
        const canSend = channel?.isTextBased?.() && channel.permissionsFor?.(cmd.client.user)?.has(PermissionFlagsBits.SendMessages);

        if (!canSend) {
            await cmd.followUp({
                content: "I can't speak in this channel.",
                ephemeral: true
            });
            return;
        }

        if (guild.filter.blacklist.length > 0 && guild.filter.active) {
            await cmd.followUp({
                content: `## ⚠️ Warning\nWhat follows _may_ be considered dirty, or offensive, as these are words that **${cmd.guild.name}** has decided to not allow.\n-# If you would like to continue, press the button below.`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("view_filter")
                            .setLabel("DM me the blacklist")
                            .setStyle(ButtonStyle.Danger)
                    )
                        .toJSON()
                ]
            });
        }
        else {
            await cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds.filter.add.mention}.`);
        }
    },

    subscribedButtons: ["view_filter", "export", /delete-.*/],

    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
        applyContext(context);

        switch (cmd.customId) {
            case "view_filter":
                const guild = await guildByObj(cmd.guild);

                try {
                    await cmd.user.send({
                        content: guild.filter.blacklist.length > 0
                            ? `The following is the blacklist for **${ cmd.guild.name}** as requested.\n\n||${guild.filter.blacklist.join("||, ||")}||`
                            : `This server does not have any blacklisted words configured.`,
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("delete-all")
                                .setLabel("Delete message")
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId("export")
                                .setLabel("Export to CSV")
                                .setStyle(ButtonStyle.Primary)
                        )
                            .toJSON()]
                    });
                    await cmd.deferUpdate();
                }
                catch {
                    await cmd.reply({
                        content: "I couldn't send you a DM. Check your privacy settings and try again.",
                        ephemeral: true
                    });
                }
                break;
            case "export":
                // TODO: this should load the words from the database
                var bad = cmd.message.content.match(/\|\|\w+\|\|/gi).map(a => a.split("||")[1]);
                const filterCSV = new AttachmentBuilder(Buffer.from(bad.join(",")), { name: "badExport.csv" });

                await cmd.reply({
                    ephemeral: true,
                    files: [filterCSV]
                });
                break;
        }

        // NOTE: this command is just handled here, it's a useful button that can be put anywhere on stewbot's responses
        if (cmd.customId?.startsWith("delete-")) {
            if (
                cmd.user.id === cmd.customId.split("-")[1] ||
				cmd.customId === "delete-all" ||
				(cmd.member instanceof GuildMember && cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages))
            ) {
                if (cmd.message?.deletable) {
                    await cmd.message.delete();
                }
                else {
                    await cmd.reply({ content: "I can't delete that message.", ephemeral: true });
                }
            }
            else {
                await cmd.reply({ content: `I can't do that for you just now.`, ephemeral: true });
            }
        }
    }
};
