// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('temp_slowmode').setDescription('Set a temporary slowmode or lock for this channel').addIntegerOption(option=>
                option.setName("mode").setDescription("How long should there be between a user's posts?").addChoices(
                    {"name":"Slowmode Off","value":0},
                    {"name":"5s","value":5},
                    {"name":"10s","value":10},
                    {"name":"15s","value":15},
                    {"name":"30s","value":30},
                    {"name":"1m","value":60},
                    {"name":"2m","value":120},
                    {"name":"5m","value":300},
                    {"name":"10m","value":600},
                    {"name":"15m","value":900},
                    {"name":"30m","value":1800},
                    {"name":"1h","value":3600},
                    {"name":"2h","value":7200},
                    {"name":"6h","value":21600}
                ).setRequired(true)
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours until reverted?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes until reverted?").setMinValue(1).setMaxValue(59)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
		
		// Optional fields
		
		extra: {"contexts": [0], "integration_types": [0]},

		requiredGlobals: ["finTempSlow"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageChannels)){
            cmd.followUp(`I do not have the \`ManageChannels\` permission, I am unable to set slow mode restrictions.`);
            return;
        }
        var timer=0;
        if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
        if(cmd.options.getInteger("minutes")!==null) timer+=cmd.options.getInteger("minutes")*60000;
        if(timer<=0){
            cmd.followUp(`You need to specify a set of hours or minutes for the slowmode to apply`);
            return;
        }
        if(!storage[cmd.guild.id].hasOwnProperty("tempslow")){
            storage[cmd.guild.id].tempSlow={};
        }
        if(storage[cmd.guild.id].tempSlow.hasOwnProperty(cmd.channel.id)){
            cmd.followUp(`You already have a temp slowmode running in this channel. You must clear it or let it expire before you add a new one. It expires on its own in <>.`);
            return;
        }
        storage[cmd.guild.id].tempSlow[cmd.channel.id]={
            "invoker":cmd.user.id,//If I'm unable to revert the slowmode for any reason, DM the person who set it
            "ends":Date.now()+timer,
            "origMode":cmd.channel.rateLimitPerUser,
            "guild":cmd.guild.id,
            "private":cmd.options.getBoolean("private")===null?false:cmd.options.getBoolean("private")
        };
        setTimeout(()=>{finTempSlow(cmd.guild.id,cmd.channel.id)},timer);
        cmd.channel.setRateLimitPerUser(cmd.options.getInteger("mode"));
        cmd.followUp(`Alright, I have set a temporary slowmode setting for this channel until <t:${Math.round(storage[cmd.guild.id].tempSlow[cmd.channel.id].ends/1000)}:f> <t:${Math.round(storage[cmd.guild.id].tempSlow[cmd.channel.id].ends/1000)}:R>.`);
	}
};
