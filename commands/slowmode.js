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
		command: new SlashCommandBuilder().setName('slowmode').setDescription('Set a slowmode for this channel, temporarily if desired').addIntegerOption(option=>
                option.setName("preset_mode").setDescription("Some presets for slowmode lengths").addChoices(
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
                )
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours in between posts?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes in between posts?").setMinValue(1).setMaxValue(59)
            ).addIntegerOption(option=>
                option.setName("seconds").setDescription("How many seconds in between posts?").setMinValue(1).setMaxValue(59)
            ).addIntegerOption(option=>
                option.setName("hours_until_reverted").setDescription("Should I revert this setting? In how many hours?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes_until_reverted").setDescription("Should I revert this setting? In how many minutes?").setMinValue(1).setMaxValue(59)
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
        var temp=false;
        if(cmd.options.getInteger("hours_until_reverted")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
        if(cmd.options.getInteger("minutes_until_reverted")!==null) timer+=cmd.options.getInteger("minutes")*60000;
        if(timer>0){
            temp=true;
        }
        var time=0;
        if(cmd.options.getInteger("preset_mode")!==null) time=cmd.options.getInteger("preset_mode");
        if(cmd.options.getInteger("hours")!==null) time+=cmd.options.getInteger("hours")*60000*60;
        if(cmd.options.getInteger("minutes")!==null) time+=cmd.options.getInteger("minutes")*60000;
        if(time<1){
            time=30000;
        }

        if(!storage[cmd.guild.id].hasOwnProperty("tempslow")&&temp){
            storage[cmd.guild.id].tempSlow={};
        }
        if(temp&&storage[cmd.guild.id].tempSlow.hasOwnProperty(cmd.channel.id)){
            cmd.followUp({content:`You already have a temp slowmode running in this channel. You must clear it or let it expire before you add a new one. It expires on its own <t:${Math.round(storage[cmd.guild.id].tempSlow[cmd.channel.id].ends/1000)}:R>.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Revert Now").setCustomId(`revertTempSlow`))]});
            return;
        }
        if(temp){
            storage[cmd.guild.id].tempSlow[cmd.channel.id]={
                "invoker":cmd.user.id,//If I'm unable to revert the slowmode for any reason, DM the person who set it
                "ends":Date.now()+timer,
                "origMode":cmd.channel.rateLimitPerUser,
                "guild":cmd.guild.id,
                "private":cmd.options.getBoolean("private")===null?false:cmd.options.getBoolean("private")
            };
            setTimeout(()=>{finTempSlow(cmd.guild.id,cmd.channel.id)},timer);
        }
        cmd.channel.setRateLimitPerUser(time);
        cmd.followUp({content:`Alright, I have set a${temp?` temporary`:``} slowmode setting for this channel ${temp?`until <t:${Math.round(storage[cmd.guild.id].tempSlow[cmd.channel.id].ends/1000)}:f> <t:${Math.round(storage[cmd.guild.id].tempSlow[cmd.channel.id].ends/1000)}:R>`:``}.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Revert Now").setCustomId(`revertTempSlow`))]});
	}
};
