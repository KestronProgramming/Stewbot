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
		command: new SlashCommandBuilder().setName("rank").setDescription("View someone's rank for this server's level ups")
            .addUserOption(option=>
                option.setName("target").setDescription("Who's rank are you trying to view?")
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["getLvl"],
        help:{
            helpCategories: ["Information","General","Entertainment","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "View someone's rank for this server's level ups",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Check someone's rank for this server's level ups if this server has them configured.`
        }
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.guildId].levels.active){
            cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config.mention}.`);
            return;
        }
        var usr=cmd.options.getUser("target")?.id||cmd.user.id;
        if(!storage[cmd.guildId].users.hasOwnProperty(usr)){
            cmd.followUp(`I am unaware of this user presently`);
            return;
        }
        cmd.followUp({
            content: `Server rank card for <@${usr}>`, embeds: [{
                "type": "rich",
                "title": `Rank for ${cmd.guild.name}`,
                "description": "",
                "color": 0x006400,
                "fields": [
                    {
                        "name": `Level`,
                        "value": storage[cmd.guildId].users[usr].lvl + "",
                        "inline": true
                    },
                    {
                        "name": `EXP`,
                        "value": `${storage[cmd.guildId].users[usr].exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        "inline": true
                    },
                    {
                        "name": `Server Rank`,
                        "value": `#${Object.keys(storage[cmd.guildId].users).map(a => Object.assign(storage[cmd.guildId].users[a], { "id": a })).sort((a, b) => b.exp - a.exp).map(a => a.id).indexOf(usr) + 1}`,
                        "inline": true
                    }
                ],
                "thumbnail": {
                    "url": cmd.guild.iconURL(),
                    "height": 0,
                    "width": 0
                },
                "author": {
                    "name": client.users.cache.get(usr) ? client.users.cache.get(usr).username : "Unknown",
                    "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                },
                "footer": {
                    "text": `Next rank up at ${(getLvl(storage[cmd.guildId].users[usr].lvl) + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                }
            }], 
            allowedMentions: { parse: [] }
        });
	}
};
