// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

async function finTempBan(guild,who,force){
    if(!storage[guild].tempBans.hasOwnProperty(who)){
        return;
    }
    if(storage[guild].tempBans[who].ends>Date.now()+10000&&!force){
        if(storage[guild].tempBans[who].ends-Date.now()<60000*60*24){
            setTimeout(()=>{finTempBan(guild,who)},storage[guild].tempBans[who].ends-Date.now());
        }
        return;
    }
    var g=client.guilds.cache.get(guild);
    if(g===null||g===undefined){
        try{
            client.users.cache.get(storage[guild].tempBans[who].invoker).send(`I was unable to unban <@${who}>.`).catch(e=>{});
        }
        catch(e){}
        delete storage[guild].tempBans[who];
        return;
    }
    if(!g.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.BanMembers)){
        try{
            client.users.cache.get(storage[guild].tempBans[who].invoker).send(`I no longer have permission to unban <@${who}>.`).catch(e=>{});
        }
        catch(e){}
        delete storage[guild].tempBans[who];
        return;
    }
    try{
        g.members.unban(who).catch(e=>{});
    }
    catch(e){}
    if(!storage[guild].tempBans[who].private){
        try{
            client.users.cache.get(who).send(`You have been unbanned in ${g.name}.`).catch(e=>{});
        }
        catch(e){}
    }
    delete storage[guild].tempBans[who];
}

module.exports = {
	finTempBan,
	
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("ban").setDescription("Ban a user, temporarily if desired")
			.addUserOption(option=>
				option.setName("target").setDescription("Who to ban?").setRequired(true)
			).addStringOption(option=>
				option.setName("reason").setDescription("What is the reason for this ban?")
			).addIntegerOption(option=>
				option.setName("days").setDescription("How many days until unbanned?").setMinValue(1).setMaxValue(365)
			).addIntegerOption(option=>
				option.setName("hours").setDescription("How many hours until unbanned?").setMinValue(1).setMaxValue(23)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["General","Administration","Server Only"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Ban a user, temporarily if desired",
			detailedDesc: 
				`This command will ban a user. If you specify an amount of days or hours, this ban will automatically revert after that many days and hours. If you do not specify either of those, this ban will be permanent until manually removed.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);

		// OPTIMIZE: the following .fetch is needed so that a cached user can't 
		//   just use mod commands right after being demoted, as I understand it.
		//  In theory we could possible watch for changes and invalidate cache? 
		//  The same goes for /kick
		cmd.guild.members.fetch(cmd.user.id);

		const targetMember = cmd.guild.members.cache.get(cmd.options.getUser("target").id);
		const issuerMember = cmd.guild.members.cache.get(cmd.user.id);
		const reason = cmd.options.getString("reason");	

		if (targetMember.id === cmd.guild.ownerId) {
			return cmd.followUp("I cannot ban the owner of this server.");
		}

		if (issuerMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
			return cmd.followUp("You cannot kick this user because they have a role equal to or higher than yours.");
		}

		if(!cmd.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.BanMembers)){
			cmd.followUp(`I do not have the permission to ban members.`);
			return;
		}
		if(targetMember.id===client.user.id){
			cmd.followUp(`I cannot ban myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement.`);
			return;
		}
		if(cmd.user.id===targetMember.id){
			cmd.followUp(`I cannot ban you as the one invoking the command. If you feel the need to ban yourself, consider changing your actions and mindset instead.`);
			return;
		}
		var b=cmd.guild.members.cache.get(targetMember.id);
		if(b===null||b===undefined){
			cmd.followUp({content:`I couldn't find <@${targetMember.id}>.`,allowedMentions:{parse:[]}});
			return;
		}
		var timer=0;
		var temp=false;
		if(cmd.options.getInteger("days")!==null) timer+=cmd.options.getInteger("days")*60000*60*24;
		if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
		if(timer>0){
			temp=true;
		}
		if(!b.bannable){
			cmd.followUp(`I cannot ban this person. Make sure that I have a role higher than their highest role in the server settings before running this command.`);
			return;
		}
		b.ban({reason:`Instructed to ${temp?`temporarily `:``}ban by ${cmd.user.username}${reason ? ": "+reason: "."}`});
		if(cmd.options.getBoolean("private")===null||!cmd.options.getBoolean("private")){
			try{
				cmd.options.getUser("target").send({content:`## ${temp?`Temporarily b`:`B`}anned in ${cmd.guild.name}.${temp?`\n\nThis ban will expire <t:${Math.round((Date.now()+timer)/1000)}:R>, at <t:${Math.round((Date.now()+timer)/1000)}:f>.`:``}`,embeds:[{
					type: "rich",
					title: checkDirty(config.homeServer,cmd.guild.name.slice(0, 80),true)[1],
					description: reason ? checkDirty(config.homeServer,reason,true)[1]:`They did not specify a reason`,
					color: 0xff0000,
					thumbnail: {
						url: cmd.guild.iconURL(),
						height: 0,
						width: 0,
					},
					footer: {
						text: `Banned in ${cmd.guild.name}`
					}
				}]});
			}
			catch(e){}
		}
		if(temp){
			if(!storage[cmd.guild.id].hasOwnProperty("tempBans")) storage[cmd.guild.id].tempBans={};
			storage[cmd.guild.id].tempBans[b.id]={
				ends:Date.now()+timer,
				reason:reason?checkDirty(config.homeServer,reason,true)[1]:`Unspecified reason.`,
				invoker:cmd.user.id,//If we can't unban the person at the end of the time, try to DM the one who banned them
				private:cmd.options.getBoolean("private")!==null?cmd.options.getBoolean("private"):false
			};
			if(timer<=60000*60*24){
				setTimeout(()=>{finTempBan(cmd.guild.id,b.id)},timer);
			}
		}
		var comps=[];
		if(temp){
			comps=[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Unban Now").setCustomId(`unban-${b.id}`))];
		}
		cmd.followUp({content:`I have ${temp?`temporarily `:``}banned <@${cmd.options.getUser("target").id}>${temp?` until <t:${Math.round((Date.now()+timer)/1000)}:f> <t:${Math.round((Date.now()+timer)/1000)}:R>`:``}.`,components:comps});
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/unban-.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("unban-")){
			if(!cmd.memberPermissions.has(PermissionFlagsBits.BanMembers)){
				cmd.reply({content:`You do not have permission to use this button.`,ephemeral:true});
			}
			else{
				cmd.update({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Danger)
                                .setLabel("Unban Now")
                                .setCustomId(`unban`)
                                .setDisabled(true)
                        ),
                    ],
                });
				finTempBan(cmd.guild.id, cmd.customId.split("-")[1],true);
			}
		}
	},


	async daily(context) {
		applyContext(context);

		// Check all servers, register timers for the tempBans
		Object.keys(storage).forEach(s => {					
			// Removing temp bans / setting timeouts to remove temp bans when it's within 24 hours of them
			try {
				if(storage[s]?.hasOwnProperty("tempBans")){
					Object.keys(storage[s].tempBans).forEach(ban=>{
						if(storage[s].tempBans[ban].ends-Date.now()>0&&!storage[s].tempBans[ban].registered){
							setTimeout(()=>{finTempBan(s,ban)},storage[s].tempBans[ban].ends-Date.now());
						}
						else if(!storage[s].tempBans[ban].registered){
							finTempBan(s,ban);
						}
					});
				}
			} catch (e) {
				notify("Error creating tempBan removing timer: " + e.stack);
			}
		});
	}
};
