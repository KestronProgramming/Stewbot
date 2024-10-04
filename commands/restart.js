// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
// #endregion Boilerplate
const fs = require("fs");

module.exports = {
    data: {
        command: null, // TODO: devadmin command globals. Really this is the only one rn

        requiredGlobals: ["launchCommands"],
    },

    async execute(cmd, context) {
        applyContext(context);

        // TODO: move these IDs here and where the command is registered to be pulled from the env.json file
        if (cmd.guild?.id === "983074750165299250" && cmd.channel.id === "986097382267715604") {
            const updateCode = cmd.options.getBoolean("update")
            const updateCommands = cmd.options.getBoolean("update_commands")

            var infoData = ""
            if (updateCode) infoData += " | Updating code"
            if (updateCommands) infoData += " | Running launchCommands.js"

            // Notify about restart
            notify(1, { content: `Bot restarted by <@${cmd.user.id}>` + infoData, allowedMentions: { parse: [] } });
            cmd.followUp("Restarting..." + infoData);

            try {
                // Update code if requested
                if (updateCode) {
                    await new Promise((resolve, reject) => {
                        exec('sh ./update.sh', (error, stdout, stderr) => {
                            if (error || stderr) {
                                var errNotif = `Error: ${error?.message || ""}`
                                errNotif += `\nStderr: ${stderr}`
                                notify(1, errNotif);
                                reject(0);
                            }
                            stdout && notify(1, stdout);
                            resolve(1);
                        });
                    });
                }

                // Update commands if requested
                if (updateCommands) {
                    launchCommands();
                }
            } catch (err) {
                notify(1, String("Caught error while restarting: " + err))
            }

            fs.writeFileSync("./storage.json", process.env.beta ? JSON.stringify(storage, null, 4) : JSON.stringify(storage));
            setTimeout(() => { process.exit(0) }, 5000);
        }
    }
};
