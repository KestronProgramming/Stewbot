const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

const crypto = require('crypto');

module.exports = {
	data: {
		command: null,

		// Not all modules will have help commands, but they can in theory to showcase bot features.
		help: {
			helpCategories: ["Server Only", "Safety"],
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
				- Safety -> Anti-hack, anti-spam, etc
			*/
			shortDesc: "Defend server from hacked accounts.",
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This module watches for spam messages that look like they are from hacked accounts, and times out the user until they complete a ${cmds.captcha.mention}`
		},
	},

	async onmessage(msg, context) {
		applyContext(context);

		// Anti-hack message
		if(msg.guild && !msg.author.bot){
			var hash = crypto.createHash('md5').update(msg.content.slice(0,148)).digest('hex');
			if(!storage[msg.author.id].hasOwnProperty("hashStreak")) storage[msg.author.id].hashStreak=0;
			if(!storage[msg.guild.id].users[msg.author.id].hasOwnProperty("lastMessages")){
				storage[msg.guild.id].users[msg.author.id].lastMessages=[];
			}
			if(storage[msg.author.id].lastHash===hash){
				if(msg.content.toLowerCase().includes("@everyone")||msg.content.toLowerCase().includes("@here")||msg.content.toLowerCase().includes("http")) storage[msg.author.id].hashStreak++;
				if(storage[msg.author.id].hashStreak>=3){
					storage[msg.author.id].captcha=true;
					var botInServer=msg.guild?.members.cache.get(client.user.id);
					if(botInServer?.permissions.has(PermissionFlagsBits.ModerateMembers)&&!storage[msg.guild.id].disableAntiHack&&new Date()-(storage[msg.guild.id].users[msg.author.id].safeTimestamp||0)>60000*60*24*7){
						try{
							msg.member.timeout(60000*60*24,`Detected spam activity of high profile pings and/or a URL of some kind. Automatically applied for safety.`);//One day, by then any automated hacks should've run their course
							if(!storage[msg.author.id].hasOwnProperty("timedOutIn")) storage[msg.author.id].timedOutIn=[];
							storage[msg.author.id].timedOutIn.push(msg.guild.id);
							if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
								var sendRow=[new ButtonBuilder().setCustomId("untimeout-"+msg.author.id).setLabel("Remove Timeout").setStyle(ButtonStyle.Success)];
								if(botInServer.permissions.has(PermissionFlagsBits.BanMembers)&&msg.member.bannable){
									sendRow.push(new ButtonBuilder().setCustomId("ban-"+msg.author.id).setLabel(`Ban`).setStyle(ButtonStyle.Danger));
								}
								if(botInServer.permissions.has(PermissionFlagsBits.KickMembers)&&msg.member.kickable){
									sendRow.push(new ButtonBuilder().setCustomId("kick-"+msg.author.id).setLabel(`Kick`).setStyle(ButtonStyle.Danger));
								}
								if(botInServer.permissions.has(PermissionFlagsBits.ManageMessages)){
									// sendRow.push(new ButtonBuilder().setCustomId("del-"+msg.author.id).setLabel(`Delete the Messages in Question`).setStyle(ButtonStyle.Primary));
	
									// Instead just delete dirrectly
									for(var i=0;i<storage[msg.guild.id].users[msg.author.id].lastMessages.length;i++){
										try{
											var badMess=await client.channels.cache.get(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[0]).messages.fetch(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[1]);
											badMess.delete().catch(e=>{console.log(e)});
											storage[msg.guild.id].users[msg.author.id].lastMessages.splice(i,1);
											i--;
										}
										catch(e){console.log(e)}
									}
								}
								await msg.reply({content:`I have detected unusual activity from <@${msg.author.id}>. I have temporarily applied a timeout. To remove this timeout, <@${msg.author.id}> can use ${cmds.captcha.mention} in a DM with me, or a moderator can remove this timeout manually.\n\nIf a mod wishes to disable this behavior, designed to protect servers from mass spam, ping, and NSFW hacked or spam accounts, run ${cmds.general_config.mention} and specify to disable Anti Hack Protection.`,components:[new ActionRowBuilder().addComponents(...sendRow)]});
								setTimeout(_ => { msg.delete() }, 50)
							}
						}
						catch(e){}
					}
				}
			}
			else{
				storage[msg.author.id].lastHash=hash;
				storage[msg.author.id].hashStreak=0;
				storage[msg.guild.id].users[msg.author.id].lastMessages=[];
			}
			storage[msg.guild.id].users[msg.author.id].lastMessages.push(`${msg.channel.id}/${msg.id}`);
			
		}
		if(storage[msg.guild?.id]?.users[msg.author.id].gone?.active&&storage[msg.guild?.id]?.users[msg.author.id].gone?.autoOff){
			storage[msg.guild.id].users[msg.author.id].gone.active=false;
			
		}
		if(storage[msg.author.id].gone?.active&&storage[msg.author.id].gone?.autoOff){
			storage[msg.author.id].gone.active=false;
		}
	}
};
