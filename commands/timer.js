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

		help: {
			helpCategories: ["General","Information","Entertainment"],
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
			shortDesc: "Set a timer/reminder",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Set a timer that will notify you after the specified amount of time in a configurable location.`
		},
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
                resp=await cmd.followUp({content:`Alright, I have set a timer that expires <t:${Math.round((Date.now()+timer)/1000)}:R> at <t:${Math.round((Date.now()+timer)/1000)}:f>. I was asked to ping you here, but I cannot do that in this channel. I will DM you instead.${reminder.length>0?`\n\`${reminder}\``:``}`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId(`clearTimer-${cmd.user.id}`).setStyle(ButtonStyle.Danger))]});
            }
            else{
                resp=await cmd.followUp({content:`Alright, I have set a timer that expires <t:${Math.round((Date.now()+timer)/1000)}:R> at <t:${Math.round((Date.now()+timer)/1000)}:f>. I will ${respondHere?`ping you here`:`DM you`} when it finishes.${reminder.length>0?`\n\`${reminder}\``:``}`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId(`clearTimer-${cmd.user.id}`).setStyle(ButtonStyle.Danger))]});
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
