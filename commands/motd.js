// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");

let statusCycleInterval;

async function refreshStatusHandler() {
    let { statuses, delay } = (
        await ConfigDB.findOne({}).select("MOTD")
    ).MOTD;

    if (statusCycleInterval) clearInterval(statusCycleInterval);

    if (statuses.length > 1) {
        let statusIndex = 0;
        statusCycleInterval = setInterval(() => {
            let thisStatus = statuses[statusIndex % statuses.length];
            client.user.setActivity(
                thisStatus,
                { type: ActivityType.Custom }
            );
            statusIndex++;
        }, Math.max(delay, 1000))
    } else {
        client.user.setActivity(
            statuses?.[0],
            { type: ActivityType.Custom }
        );
    }
}

module.exports = {
    data: {
        command: new SlashCommandBuilder()
			.setName('motd')
			.setDescription(`Change the bot's status`)
			.addSubcommand(subcommand =>
				subcommand
					.setName("add")
					.setDescription("Add a new status message")
					.addStringOption(option => 
						option
							.setName("status")
							.setDescription("The status message")
							.setRequired(true)
					)
			)
			.addSubcommand(subcommand => 
				subcommand
					.setName("remove")
					.setDescription("Remove a status message")
					.addStringOption(option => 
						option
							.setName("status")
							.setDescription("The status message")
							.setRequired(true)
							.setAutocomplete(true)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName("delay")
					.setDescription("Set the cycle delay")
					.addNumberOption(option => 
						option
							.setName("milliseconds")
							.setDescription("The time in milliseconds between statuses")
							.setRequired(true)
					)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            
        requiredGlobals: [],
        help: {
            helpCategories: [""],//Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only",//Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
                `Stewbot's Admins Only`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        if (cmd.guild?.id === config.homeServer && cmd.channel.id === config.commandChannel) {

            const subcommand = cmd.options.getSubcommand();
            let delay = cmd.options.getNumber("milliseconds");
            let status = cmd.options.getString("status")?.normalize()?.trim();

            let config = await ConfigDB.findOne();

            switch (subcommand) {
                case "add": 
                    config.MOTD.statuses.push(status)
                    break

                case "remove": 
                    config.MOTD.statuses = config.MOTD.statuses.filter( s =>
                        s.normalize().trim() !== status
                    )
                    break

                case "delay": 
                    config.MOTD.delay = Math.max(delay, 1000);
                    break;
            }

            await config.save();
            await refreshStatusHandler();
            cmd.followUp("Done.");

        } else {
            cmd.followUp("This command is for bot administrators only.");
        }
    },

    async autocomplete(cmd) {
        let allStatues = await ConfigDB.findOne({}).distinct("MOTD.statuses")
        let autocompletes = allStatues.map(status => ({
            name: status,
            value: status
        }))

        cmd.respond(autocompletes);
    },

    async [Events.ClientReady] () {
        setTimeout(refreshStatusHandler, 500);
        setInterval(refreshStatusHandler, 60000 * 5)
    }
};
