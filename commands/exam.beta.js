// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (key in context) {
        this[key] = context[key];
    }
}
// #endregion CommandBoilerplate

const sugar = require("sugar")

function formatMilliseconds(milliseconds) {
    const date = sugar.Date.create(milliseconds);
    return date.format('{duration}');
}
  

// 
// TEMPLATE.js is an exhaustive template showcasing every feature available to modules.
//  Any module/command can be derived from these.
// 


module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel, // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName('exam').setDescription('Beta code testing playground').addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ).addStringOption(option =>
                option.setName("input").setDescription("Input")
            ),

        ////// Optional fields below this point //////

        // For breaking discord API changes, inject extra command metadata here
        // extra: {},

        // When this command defers, should it be ephemeral? (if the private option is defined, it can override this)
        // deferEphemeral: false,

        // A priority calling system for handlers like onmessage, only use when required. Smaller = loaded sooner, default = 100
        // priority: 100,

        // Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
        requiredGlobals: [],

        help: {
            helpCategories: [],
            shortDesc: "Beta playground",//Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
                `Beta playground`,

            // If this module can't be blocked, specify a reason
            // block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",
        },
    },

    /** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        if (!cmd.user.id === "724416180097384498") return cmd.deferUpdate();

        const input = cmd.options.getString("input");
        if (input) {
            try {
                await eval(
                    `(async () => { 
                        const result = (${input});
                        await cmd.followUp(result);
                    })()`
                );
            } catch (e) {
                cmd.followUp(e.stack);
            }
        }
        else {
            const guild = await guildByObj(cmd.guild);
            cmd.followUp(JSON.stringify(guild.toJSON(), null, 4));
        }
    },

    /** @param {import('discord.js').Message} msg */
    async onmessage(msg, context) {
        applyContext(context);
        // `context` currently does not respect requested globals
    },

    async autocomplete(cmd) {

    },

    async daily(context) {
        applyContext(context);

    },

    // Only button subscriptions matched will be sent to the handler 
    subscribedButtons: ["example", /example/],

    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
        applyContext(context);


    }
};
