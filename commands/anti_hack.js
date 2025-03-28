// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const crypto = require('crypto');

module.exports = {
	data: {
		command: null,

		// Not all modules will have help commands, but they can in theory to showcase bot features.
		help: {
			helpCategories: ["Server Only", "Safety"],
			shortDesc: "Defend server from hacked accounts.",
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This module watches for spam messages that look like they are from hacked accounts, and times out the user until they complete a captcha verification`
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
	
									// Instead just delete directly
									for(var i=0;i<storage[msg.guild.id].users[msg.author.id].lastMessages.length;i++){
										try{
											var badMess=await client.channels.cache.get(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[0]).messages.fetch(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[1]);
											badMess.delete().catch(e=>{});
											// storage[msg.guild.id].users[msg.author.id].lastMessages.splice(i,1);
											// i--;
										}
										catch(e){ console.log(e) }
									}
									// Since they are deleted, now ignore them
									storage[msg.guild.id].users[msg.author.id].lastMessages = []
								}

								// Warn, then delete the message afterwards so they see it was deleted
								await msg.reply({content:`I have detected unusual activity from <@${msg.author.id}>. I have temporarily applied a timeout. To remove this timeout, <@${msg.author.id}> can use ${cmds.captcha.mention} in a DM with me, or a moderator can remove this timeout manually.\n\nIf a mod wishes to disable this behavior, designed to protect servers from mass spam, ping, and NSFW hacked or spam accounts, run ${cmds.general_config.mention} and specify to disable Anti Hack Protection.`,components:[new ActionRowBuilder().addComponents(...sendRow)]});
								setTimeout(_ => { msg.delete().catch(e=>{}) }, 100)
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
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/ban-.*/, /kick-.*/, /untimeout-.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("ban-")) {
			if(cmd.member.permissions.has(PermissionFlagsBits.BanMembers)){
				var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
				if(target){
					target.ban({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to ban by ${cmd.user.username}.`});
					cmd.message.delete();
				}
				else{
					cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
				}
				if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
					for(var i=0;i<storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
						try{
							var badMess=await client.channels.cache.get(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[0]).messages.fetch(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[1]);
							badMess.delete().catch(e=>{console.log(e)});
							storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
							i--;
						}
						catch(e){ console.log(e) }
					}
				}
			}
			else{
				cmd.reply({content:`You do not have sufficient permissions to ban members.`,ephemeral:true});
			}
		}

		if(cmd.customId?.startsWith("untimeout-")){
			if(cmd.member.permissions.has(PermissionFlagsBits.ModerateMembers)){
				storage[cmd.guild.id].users[cmd.customId.split("-")[1]].safeTimestamp=new Date();
				var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
				if(target){
					target.timeout(null);
					cmd.message.delete();
				}
				else{
					cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
				}
			}
			else{
				cmd.reply({content:`You do not have sufficient permissions to timeout members.`,ephemeral:true});
			}
		}

		if(cmd.customId?.startsWith("kick-")){
			if(cmd.member.permissions.has(PermissionFlagsBits.KickMembers)){
				var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
				if(target){
					target.kick({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to kick by ${cmd.user.username}.`});
					// await cmd.reply({content:`Done. Do you wish to delete the messages in question as well?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("del-"+target.id).setLabel("Yes").setStyle(ButtonStyle.Success))],ephemeral:true});
					await cmd.reply({content:`Attempted to kick.`, ephemeral:true});
					cmd.message.delete();
				}
				else{
					cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
				}
				if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
					for(var i=0;i<storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
						try{
							var badMess=await client.channels.cache.get(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[0]).messages.fetch(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[1]);
							badMess.delete().catch(e=>{console.log(e)});
							storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
							i--;
						}
						catch(e){console.log(e)}
					}
				}
			}
			else{
				cmd.reply({content:`You do not have sufficient permissions to kick members.`,ephemeral:true});
			}
		}
	}
};
