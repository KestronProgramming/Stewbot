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
		command: new SlashCommandBuilder().setName('hat_pull').setDescription('Draw (a) name(s) from a hat, like a raffle or giveaway').addStringOption(option=>
                option.setName("message").setDescription("Message to display? (Use \\n for a newline)").setMinLength(1)
            ).addIntegerOption(option=>
                option.setName("limit").setDescription("Is there a limit to how many people can enter?").setMinValue(2)
            ).addIntegerOption(option=>
                option.setName("winners").setDescription("How many names should I pull when it is time? (Default: 1)").setMinValue(1)
            ).addIntegerOption(option=>
                option.setName("days").setDescription("How many days to enter before closing?").setMinValue(1).setMaxValue(30)
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours to enter before closing?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes to enter before closing?").setMinValue(1).setMaxValue(59)
            ),
		
		// Optional fields
		
		extra: {"contexts": [0], "integration_types": [0]},

		requiredGlobals: ["finHatPull"],

		help: {
			helpCategories: ["Entertainment","Server Only"],
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
			shortDesc: "Draw (a) name(s) from a hat, like a raffle or giveaway",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Have Stewbot help manage a raffle or giveaway like event, including automatic handling of entering and picking the winner(s) after a set amount of time.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		// Code
        if(storage[cmd.user.id].hasOwnProperty("hat_pull")){
            cmd.followUp(`You already have a hat pull running. You must close that one before starting another.\nhttps://discord.com/channels/${storage[cmd.user.id].hat_pull.location}`);
            return;
        }

        var timer=0;
        if(cmd.options.getInteger("days")!==null) timer+=cmd.options.getInteger("days")*60000*60*24;
        if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
        if(cmd.options.getInteger("minutes")!==null) timer+=cmd.options.getInteger("minutes")*60000;
        if(timer<=0){
            cmd.followUp(`You need to specify an amount of time for people to enter`);
            return;
        }
        var resp=await cmd.followUp({content:`${cmd.options.getString("message")!==null?cmd.options.getString("message").replaceAll("\\n","\n"):`**Hat Pull**\nEnter by pressing the button below!`}\n\nThis ends <t:${Math.round((timer+Date.now())/1000)}:f> <t:${Math.round((timer+Date.now())/1000)}:R>.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel("Enter").setCustomId("enterHatPull"),new ButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel("Leave").setCustomId("leaveHatPull"),new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Close").setCustomId("closeHatPull"),new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("cancelHatPull").setLabel("Cancel"))],allowedMentions:{parse:[]}});
        storage[cmd.user.id].hat_pull={
            "limit":cmd.options.getInteger("limit")!==null?cmd.options.getInteger("limit"):0,
            "winCount":cmd.options.getInteger("winners")!==null?cmd.options.getInteger("winnners"):1,
            "closes":Date.now()+timer,
            "location":`${cmd.guild.id}/${cmd.channel.id}/${resp.id}`,
            "registered":timer<=60000*60*24,
            "user":cmd.user.id,
            "entered":[]
        };
        if(timer<=60000*60*24){
            setTimeout(()=>{finHatPull(cmd.user.id)});
        }
	}
};
