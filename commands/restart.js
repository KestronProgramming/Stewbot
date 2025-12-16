// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Events } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const fs = require("fs");
const { spawn, exec } = require('child_process');
const config = require("../data/config.json");
const path = require('path');
const os = require('os');
const { launchCommands } = require("../launchCommands.js");
const { notify } = require("../utils");

const PID_FILE = path.join(os.tmpdir(), 'stewbot-maintenance.pid');

function killMaintenanceBot() {
    if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
        try {
            process.kill(pid, 'SIGTERM');
        } catch (err) {
            if (err.code === 'ESRCH') {
                console.log('Maintenance process already exited');
            }
        }
        fs.unlinkSync(PID_FILE);
    }
}

function startMaintenanceHandler() {
    const nodePath = process.argv[0];
    const small = spawn(nodePath, [path.join(__dirname, '../infrastructure/maintenanceMessage.js')], {
        detached: true,
        stdio: 'ignore'
    });
    
    small.on('error', (err) => {
        console.log('Failed to start maintenance:', err);
    });

    small.unref();    
}


module.exports = {    
    killMaintenanceBot,
    
    data: {
        sudo: true,
        
        command: new SlashCommandBuilder()
            .setName('restart')
            .setDescription('Restart the bot')
            .addBooleanOption(option =>
                option.setName("update").setDescription("Update git and npm before restarting").setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName("update_commands").setDescription("Update registered commands on discord").setRequired(false)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        extra: {"contexts": [0], "integration_types": [0]},

        requiredGlobals: [],
        help:{
            helpCategories: [""],//Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        // TODO: move these IDs here and where the command is registered to be pulled from the config.json file
        if (cmd.guild?.id === config.homeServer && cmd.channel.id === config.commandChannel) {
            const updateCode = cmd.options.getBoolean("update")
            const updateCommands = cmd.options.getBoolean("update_commands")

            var infoData = ""
            if (updateCode) infoData += " | Updating code"
            if (updateCommands) infoData += " | Running launchCommands.js"

            // Notify about restart
            notify(`Bot restarted by <@${cmd.user.id}>` + infoData);
            await cmd.followUp("Restarting..." + infoData);

            try {
                // Update code if requested
                if (updateCode) {
                    await new Promise((resolve, reject) => {
                        exec('sh ./update.sh', (error, stdout, stderr) => {
                            let errNotif = "";
                            if (error) {
                                errNotif += `Error: ${error?.message || ""}`;
                            }
                            if (stderr) {
                                errNotif += `\nStderr: ${stderr}`;
                            }

                            if (errNotif.trim()) {
                                notify(errNotif.trim());
                                reject(new Error(errNotif.trim()));
                                return;
                            }

                            if (stdout) notify(stdout);
                            resolve(0);
                        });
                    });
                }

                // Update commands if requested
                if (updateCommands) {
                    notify(await launchCommands());
                }
            } catch (err) {
                notify(String("Caught error while restarting: " + err.stack))
            }

            // Start the maintenance bot to handle commands during this time
            startMaintenanceHandler();

            // Set the reboot time
            const config = await ConfigDB.findOne();
            config.restartedAt = Date.now();
            await config.save();
            
            setTimeout(() => { process.exit(0) }, 500);
        } else {
            await cmd.followUp("This command can only be used by bot administrators.");
        }
    },

    // Kill maintenance bot on bot
    async [Events.ClientReady] () {
    	killMaintenanceBot();
	}
};
