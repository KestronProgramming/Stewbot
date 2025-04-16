// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, guildUserByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
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

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);
        if (!cmd.user.id === "724416180097384498") return cmd.deferUpdate();

        const input = cmd.options.getString("input") || "";

        switch (input) {
            // If no input, dump db objects
            case "": 
                const guild = await guildByObj(cmd.guild);
                const guildUser = await guildUserByObj(cmd.guild, cmd.user.id);
                const user = await userByObj(cmd.user);
                
                const guildBuffer = Buffer.from(JSON.stringify(guild.toJSON(), null, 4));
                const guildUserBuffer = Buffer.from(JSON.stringify(guildUser.toJSON(), null, 4));
                const userBuffer = Buffer.from(JSON.stringify(user.toJSON(), null, 4));
                cmd.followUp({ files: [
                    {
                        attachment: guildBuffer,
                        name: 'guild.json'
                    },
                    {
                        attachment: guildUserBuffer,
                        name: 'guildUser.json'
                    },
                    {
                        attachment: userBuffer,
                        name: 'user.json'
                    }
                ]});
                break;

            // Special tests
            case "1":
                const doc1 = await guildByObj(cmd.guild);
                const doc2 = doc1;
                // const doc2 = await guildByObj(cmd.guild);

                // Start two save calls in parallel on the same doc
                Promise.all([
                    (async () => {
                        doc1.testProp = 'Test 1';
                        await doc1.save();
                    })(),
                    (async () => {
                        doc2.testProp = 'Test 2';
                        await doc2.save();
                    })()
                ]);

                break;

            // Eval anything else
            default: 
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
                break;


        }
    },

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {UserDoc} guildUserStore 
     * */
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
