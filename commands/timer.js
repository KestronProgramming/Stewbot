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
		command: new SlashCommandBuilder().setName('timer').setDescription('Set a timer/reminder').addStringOption(option=>
                option.setName("reminder").setDescription("What is the timer for?").setMaxLength(150)
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours?").setMinValue(0).setMaxValue(24)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes?").setMinValue(0).setMaxValue(59)
            ).addIntegerOption(option=>
                option.setName("seconds").setDescription("How many seconds?").setMinValue(0).setMaxValue(59)
            ).addBooleanOption(option=>
                option.setName("respond_here").setDescription("Should I respond here? If not I'll DM you")
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),
		
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: ["finTimer"],

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
		if(storage[cmd.user.id].hasOwnProperty("timer")){
            cmd.followUp({content:`You already have a timer registered. This timer must be cleared before setting another. Would you like to clear it now?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId(`clearTimer-${cmd.user.id}`).setStyle(ButtonStyle.Danger))]});
            return;
        }
        else{
            var timer=0;
            if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
            if(cmd.options.getInteger("minutes")!==null) timer+=cmd.options.getInteger("minutes")*60000;
            if(cmd.options.getInteger("seconds")!==null) timer+=cmd.options.getInteger("seconds")*1000;
            if(timer<1){
                cmd.followUp(`Please set a valid time for the timer`);
                return;
            }
            var respondHere=cmd.options.getBoolean("respond_here")||false;
            var resp;
            var reminder="";
            if(cmd.options.getString("reminder")!==null){
                reminder=checkDirty(config.homeServer,cmd.options.getString("reminder"),true)[1];
                if(cmd.guildId&&storage[cmd.guildId]?.filter.active){
                    reminder=checkDirty(cmd.guildId,reminder,true)[1];
                }
            }
            if(respondHere&&!cmd.channel?.id){
                respondHere=false;
                resp=await cmd.followUp({content:`Alright, I have set a timer that expires <t:${Math.round((Date.now()+timer)/1000)}:R> at <t:${Math.round((Date.now()+timer)/1000)}:f>. I was asked to ping you here, but I cannot do that in this channel. I will DM you instead.\n\`${reminder}\``,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId(`clearTimer-${cmd.user.id}`).setStyle(ButtonStyle.Danger))]});
            }
            else{
                resp=await cmd.followUp({content:`Alright, I have set a timer that expires <t:${Math.round((Date.now()+timer)/1000)}:R> at <t:${Math.round((Date.now()+timer)/1000)}:f>. I will ${respondHere?`ping you here`:`DM you`} when it finishes.\n\`${reminder}\``,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId(`clearTimer-${cmd.user.id}`).setStyle(ButtonStyle.Danger))]});
            }
            storage[cmd.user.id].timer={
                "time":Date.now()+timer,
                "respLocation":respondHere?`${cmd.channel.id}/${resp.id}`:"DM",
                "reminder":reminder
            };
            setTimeout(()=>{finTimer(cmd.user.id)},timer);
        }
	}
};
