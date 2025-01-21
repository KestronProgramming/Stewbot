// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

async function finHatPull(who,force){
    if(!storage[who].hasOwnProperty("hat_pull")){
        return;
    }
    if(storage[who].hat_pull.closes-Date.now()>10000&&!force){
        if(storage[who].hat_pull.registered){
            setTimeout(()=>{finHatPull(who)},storage[who].hat_pull.closes-Date.now());
        }
        return;
    }
    var winners=[];
    for(var i=0;i<storage[who].hat_pull.winCount;i++){
        winners.push(storage[who].hat_pull.entered[Math.floor(Math.random()*storage[who].hat_pull.entered.length)]);
    }
    var chan=client.channels.cache.get(storage[who].hat_pull.location.split("/")[1]);
    if(chan===null||chan===undefined){
        client.users.cache.get(who).send(`I could not end the hat pull.\nhttps://discord.com/channels/${storage[who].hat_pull.location}${winners.map(a=>`\n- <@${a}>`).join("")}`).catch(e=>{});
        delete storage[who].hat_pull;
        return;
    }
    var cont=`This has ended! ${winners.length===0?`Nobody entered though.`:winners.length>1?`Here are our winners!${winners.map(a=>`\n- <@${a}>`).join("")}`:`Here is our winner: <@${winners[0]}>!`}`;
    var msg=await chan.messages.fetch(storage[who].hat_pull.location.split("/")[2]);
    if(msg===null||msg===undefined){
        chan.send(cont);
    }
    else{
        msg.edit({components:[]});
        msg.reply(cont);
    }
    delete storage[who].hat_pull;
}

module.exports = {
    finHatPull,
    
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

		requiredGlobals: [],

		help: {
			helpCategories: ["Entertainment","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
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
	},

    async daily(context) {
        applyContext(context);

        // Check each server for which need the hat pull done
        Object.keys(storage).forEach(s => {
            // Hat pull, i.e. giveaways
            try {
                if(storage[s]?.hasOwnProperty("hat_pull")){
                    if(storage[s].hat_pull.ends-Date.now()<=60000*60*24){
                        storage[s].hat_pull.registered=true;
                        if(storage[s].hat_pull.ends-Date.now()>0){
                            setTimeout(()=>{finHatPull(s)},storage[s].hat_pull.ends-Date.now());
                        }
                        else{
                            finHatPull(s);
                        }
                    }
                }
            } catch (e) {
                notify(1, "hat_pull timer creating error: " + e.stack);
            }
        });

    },

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/.*HatPull/],
	async onbutton(cmd, context) {
		applyContext(context);

		switch(cmd.customId) {
            case 'enterHatPull':
                await cmd.deferUpdate();
                Object.keys(storage).forEach(key=>{
                    if(storage[key].hasOwnProperty("hat_pull")){
                        if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                            if(!storage[key].hat_pull.entered.includes(cmd.user.id)){
                                storage[key].hat_pull.entered.push(cmd.user.id);
                            }
                            else{
                                cmd.followUp({content:`You've already entered this`,ephemeral:true});
                            }
                        }
                    }
                });
            break;
            
            case 'leaveHatPull':
                await cmd.deferUpdate();
                Object.keys(storage).forEach(key=>{
                    if(storage[key].hasOwnProperty("hat_pull")){
                        if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                            if(storage[key].hat_pull.entered.includes(cmd.user.id)){
                                storage[key].hat_pull.entered.splice(storage[key].hat_pull.entered.indexOf(cmd.user.id),1);
                            }
                            else{
                                cmd.followUp({content:`You haven't entered this`,ephemeral:true});
                            }
                        }
                    }
                });
            break;
            
            case 'closeHatPull':
                await cmd.deferUpdate();
                Object.keys(storage).forEach(key=>{
                    if(storage[key].hasOwnProperty("hat_pull")){
                        if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                            if(key===cmd.user.id||cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){
                                finHatPull(key,true);
                            }
                            else{
                                cmd.followUp({content:`This isn't yours to close`,ephemeral:true});
                            }
                        }
                    }
                });
            break;
            
            case 'cancelHatPull':
                await cmd.deferUpdate();
                Object.keys(storage).forEach(key=>{
                    if(storage[key].hasOwnProperty("hat_pull")){
                        if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                            if(key===cmd.user.id||cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){
                                cmd.message.edit({components:[]});
                                delete storage[key].hat_pull;
                            }
                            else{
                                cmd.followUp({content:`This isn't yours to cancel`,ephemeral:true});
                            }
                        }
                    }
                });
            break;
		}
	}
};
