// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("daily-config").setDescription("Configure daily postings")
            .addStringOption(option=>
                option.setName("type").setDescription("What kind of daily post are you configuring?").addChoices(
                    {"name":"Devotionals","value":"devos"},
                    {"name":"Memes","value":"memes"},
                    {"name":"Verse of the Day","value":"verses"}
                ).setRequired(true)
            ).addBooleanOption(option=>
                option.setName("active").setDescription("Should I run this daily type?").setRequired(true)
            ).addChannelOption(option=>
                option.setName("channel").setDescription("The channel for me to post this daily type in").addChannelTypes(ChannelType.GuildText).setRequired(true)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
            "helpCategory": "Administration",
            "helpDesc": "Configure daily devotions (more to come soon!) for your server"
        },
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.guildId].hasOwnProperty("daily")){
            storage[cmd.guildId].daily={
                "memes":{
                    "active":false,
                    "channel":""
                },
                "wyrs":{
                    "active":false,
                    "channel":""
                },
                "jokes":{
                    "active":false,
                    "channel":""
                },
                "devos":{
                    "active":false,
                    "channel":""
                },
                "verses":{
                    "active":false,
                    "channel":""
                },
                "qotd":{
                    "active":false,
                    "channel":""
                }
            };
        }
        storage[cmd.guildId].daily[cmd.options.getString("type")].active=cmd.options.getBoolean("active");
        storage[cmd.guildId].daily[cmd.options.getString("type")].channel=cmd.options.getChannel("channel").id;
        if(!cmd.options.getChannel("channel").permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            cmd.followUp(`I can't send messages in that channel, so I can't run daily ${cmd.options.getString("type")}.`);
            return;
        }
        cmd.followUp(`${storage[cmd.guildId].daily[cmd.options.getString("type")].active?"A":"Dea"}ctivated daily \`${cmd.options.getString("type")}\` for this server in <#${storage[cmd.guildId].daily[cmd.options.getString("type")].channel}>.`);
	}
};
