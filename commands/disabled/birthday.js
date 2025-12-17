// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");

module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName("birthday")
            .setDescription(`Celebrate the bot's birthday with us!`)
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),

        ////// Optional fields below this point //////

        // For breaking discord API changes, inject extra command metadata here
        // extra: {},

        // When this command defers, should it be ephemeral? (if the private option is defined, it can override this)
        // deferEphemeral: false,

        // A priority calling system for handlers like MessageCreate, only use when required. Smaller = loaded sooner, default = 100
        // priority: 100,

        // Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
        requiredGlobals: [],

        help: {
            helpCategories: ["General", "Bot", "Information", "Entertainment"],
            shortDesc: "Celebrate the bot's birthday with us!", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`We're running a giveaway to celebrate the bot's birthday! Run this command for some more details!`

            // If this module can't be blocked, specify a reason
            // block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",
        }
    },
    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        cmd.followUp({ content: `**Celebrate Stewbot's Birthday with us!**`, embeds: [{
            title: "Stewbot is turning 3!!!",
            description: "Stewbot is turning 3!!! We're celebrating by running a giveaway! On Stewbot's birthday (April 19th), we'll be giving away free Nitro to 3 different users!",
            url: "https://stewbot.kestron.com",
            fields: [
                {
                    name: "How to Enter",
                    value: `You'll need to be in Stewbot's home server to enter: [Kestron Central](${config.invite}). Once there, check the #announcements channel!`,
                    inline: true
                },
                {
                    name: "Getting Extra Entries",
                    value: "You'll get **1** extra entry for every server you share with Stewbot with **50** or more non-bot members! Tell your friends about what Stewbot can do!",
                    inline: true
                },
                {
                    name: "Stewbot's Invite Link",
                    value: "The invite link is https://discord.com/oauth2/authorize?client_id=966167746243076136, and the website for more info is https://stewbot.kestron.com. Hint! If you install Stewbot to your profile to use everywhere, you can access these links and more at any time by running /links!",
                    inline: true
                }
            ],
            thumbnail: {
                url: "https://stewbot.kestron.com/stewbot.jpg"
            },
            color: 0x006400,
            footer: {
                text: "Stewbot",
                icon_url: "https://stewbot.kestron.com/stewbot.jpg"
            }
        }] });
    },
    /**
     * @param {import('discord.js').Message} msg
     * @param {GuildDoc} guildStore
     * @param {GuildUserDoc} guildUserStore
     * */
    async [Events.MessageCreate](msg, context) {
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
    async onbutton(cmd, context) {
        applyContext(context);


    }
};
