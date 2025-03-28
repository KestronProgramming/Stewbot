// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const nlp = require('compromise');
const mathjs = require('mathjs');

function processForNumber(text) {
    text = text?.toLowerCase() || '';                                                                                     

    const text2MathMap = {
        'plus': '+',
        'minus': '-',
        'times': '*',
        'multiplied by': '*',
        'divided by': '/', 
        'to the power of': '^', 
        'squared': '^2',
        'cubed': '^3',
    };

    // Temporarily replace " - " or "-" with a unique marker
    text = text.replace(/(\s*-\s+)|(\s+-\s*)/g, ' __HYD__ ');  // Replace spaces around hyphen or just hyphen
    text = text.replace(/(\s*minus\s+)|(\s+minus\s*)/g, ' __HYD__ ');

    var doc = nlp(text);
    doc.numbers().toNumber();
    text = doc.text();

    for (let [word, symbol] of Object.entries(text2MathMap)) {
        text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), symbol);
    }

    text = text.replace(/__HYD__/g, '-');

    // Extract equation as far up as is possible
    text = text.match(/^([0-9+\-*/^()\s\.]|sqrt)+/, '')?.[0]?.trim() || '';
    
    try {
        let result = +mathjs.evaluate(text);
        if (result) {
            return +result.toFixed(1)
        }
    } catch (error) {
        return null;
    }
    return null;
}


module.exports = {
	processForNumber,

	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("counting").setDescription("Manage counting functions for this server")
			.addSubcommand(command=>
				command.setName("config").setDescription("Configure counting for this server").addBooleanOption(option=>
					option.setName("active").setDescription("Do counting things in this server?").setRequired(true)
				).addChannelOption(option=>
					option.setName("channel").setDescription("Channel to count in").addChannelTypes(ChannelType.GuildText)
				).addBooleanOption(option=>
					option.setName("reset").setDescription("Reset the count if a wrong number is posted (True to be on leaderboard)")
				).addBooleanOption(option=>
					option.setName("public").setDescription("Do you want this server to show up in the counting leaderboard?")
				).addIntegerOption(option=>
					option.setName("posts_between_turns").setDescription("How many posts do you need to wait between turns?").setMinValue(0)
				).addBooleanOption(option=>
					option.setName("apply-a-fail-role").setDescription("Should I apply a role to users who fail the count?")
				).addRoleOption(option=>
					option.setName("fail-role").setDescription("If fail roles are on, which role should be applied?")
				).addBooleanOption(option=>
					option.setName("apply-a-warn-role").setDescription("Should I apply a role to users who are warned?")
				).addRoleOption(option=>
					option.setName("warn-role").setDescription("If warn roles are on, which role should be applied?")
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("set_number").setDescription("Set the next number to count at (Disqualifies from leaderboard)").addIntegerOption(option=>
					option.setName("num").setDescription("The number to count at next").setRequired(true).setMinValue(0)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			config:{
				helpCategories: ["General","Entertainment","Administration","Server Only"],
				shortDesc: "Configure counting for this server",
				detailedDesc: 
					`Configure the counting game here. To play, simply enter the next number in the sequence without messing up. You can configure that users need to wait a specific number of turns. The goal is to become the highest on the leaderboard.`
			},
			set_number:{
				helpCategories: ["General","Entertainment","Administration","Server Only"],
				shortDesc: "Set the next number to count at",
				detailedDesc: 
					`Sets the next number for you to count at. If the number you choose is greater than one, this will disqualify the server from the leaderboard until a reset.`
			}
		},
	},

	async execute(cmd, context) {
		applyContext(context);

		// Permissions checking for roles:
		for (const role of [cmd.options.getRole("warn-role"), cmd.options.getRole("fail-role")]) {
			if (!role) continue;
			const [ canUse, error ] = await canUseRole(cmd.user, role, cmd.channel);
			if (!canUse) {
				return cmd.followUp(error);
			};
		}
		
		switch (cmd.options.getSubcommand()) {
			case "config":
				storage[cmd.guildId].counting.active=cmd.options.getBoolean("active");
				if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].counting.channel=cmd.options.getChannel("channel").id;
				if(cmd.options.getBoolean("public")!==null) storage[cmd.guildId].counting.public=cmd.options.getBoolean("public");
				if(cmd.options.getInteger("posts_between_turns")!==null) storage[cmd.guildId].counting.takeTurns=cmd.options.getInteger("posts_between_turns");
				if(cmd.options.getBoolean("apply-a-fail-role")!==null) storage[cmd.guildId].counting.failRoleActive=cmd.options.getBoolean("apply-a-fail-role");
				if(cmd.options.getBoolean("apply-a-warn-role")!==null) storage[cmd.guildId].counting.warnRoleActive=cmd.options.getBoolean("apply-a-warn-role");
				if(cmd.options.getRole("fail-role")!==null) storage[cmd.guildId].counting.failRole=cmd.options.getRole("fail-role")?.id;
				if(cmd.options.getRole("warn-role")!==null) storage[cmd.guildId].counting.warnRole=cmd.options.getRole("warn-role")?.id;
				var disclaimers=[];
				if(storage[cmd.guildId].counting.failRoleActive){
					var fr=cmd.guild.roles.cache.get(storage[cmd.guildId].counting.failRole);
					if(!fr){
						disclaimers.push("I was unable to identify the configured fail role, so fail roles have been turned off.");
						storage[cmd.guildId].counting.failRoleActive=false;
					}
					if(!cmd.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
						disclaimers.push("I do not have the MANAGE ROLES permission for this server, so I have turned off the fail roles.");
						storage[cmd.guildId].counting.failRoleActive=false;
					}
					if(cmd.guild.members.cache.get(client.user.id).roles.highest.position<=fr.rawPosition){
						disclaimers.push("I do not have permission to manage the specified fail role, so fail roles have been turned off. Make sure that my highest role is dragged above the roles you want me to manage in the role settings.");
						storage[cmd.guildId].counting.failRoleActive=false;
					}
				}
				if(storage[cmd.guildId].counting.warnRoleActive){
					var wr=cmd.guild.roles.cache.get(storage[cmd.guildId].counting.warnRole);
					if(!wr){
						disclaimers.push("I was unable to identify the configured warn role, so warn roles have been turned off.");
						storage[cmd.guildId].counting.warnRoleActive=false;
					}
					if(!cmd.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
						disclaimers.push("I do not have the MANAGE ROLES permission for this server, so I have turned off the warn roles.");
						storage[cmd.guildId].counting.warnRoleActive=false;
					}
					if(cmd.guild.members.cache.get(client.user.id).roles.highest.position<=wr.rawPosition){
						disclaimers.push("I do not have permission to manage the specified warn role, so warn roles have been turned off. Make sure that my highest role is dragged above the roles you want me to manage in the role settings.");
						storage[cmd.guildId].counting.warnRoleActive=false;
					}
				}
				if(!storage[cmd.guildId].counting.channel){
					storage[cmd.guildId].counting.active=false;
					disclaimers.push(`No channel was set for counting to be active in, so counting is disabled currently.`);
				}
				var c=client.channels.cache.get(storage[cmd.guild.id].counting.channel);
				if(!c?.permissionsFor(client.user.id)?.has(PermissionFlagsBits.SendMessages)){
					storage[cmd.guild.id].counting.active=false;
					disclaimers.push(`I can't send messages in the specified channel, so counting is disabled currently.`);
				}
				if(!c?.permissionsFor(client.user.id)?.has(PermissionFlagsBits.AddReactions)){
					storage[cmd.guild.id].counting.active=false;
					disclaimers.push(`I can't add reactions in the specified channel, so counting is disabled currently.`);
				}
				if(!storage[cmd.guildId].counting.reset||storage[cmd.guildId].counting.takeTurns<1){
					storage[cmd.guildId].counting.legit=false;
				}
				for(let a in storage[cmd.guildId].users){
					storage[cmd.guildId].users[a].countTurns=0;
					storage[cmd.guildId].users[a].beenCountWarned=false;
				}
				cmd.followUp(`Alright, I configured counting for this server.${disclaimers.map(d=>`\n\n${d}`).join("")}${storage[cmd.guildId].counting.legit?"":`\n\n-# Please be aware this server is currently ineligible for the leaderboard. To fix this, make sure that reset is set to true, that the posts between turns is at least 1, and that you don't set the number to anything higher than 1 manually.`}`);
				
			break;
			case "set_number":
				if(!storage[cmd.guildId].counting.active){
					cmd.followUp(`This server doesn't use counting at the moment, configure it with ${cmds["counting config"]}.`);
					break;
				}
				storage[cmd.guildId].counting.nextNum=cmd.options.getInteger("num");
				if(storage[cmd.guildId].counting.nextNum>1){
					storage[cmd.guildId].counting.legit=false;
				}
				else if(storage[cmd.guildId].counting.reset&&storage[cmd.guildId].counting.takeTurns>0){
					storage[cmd.guildId].counting.legit=true;
				}
				cmd.followUp(`Alright, I've set the next number to be counted to \`${storage[cmd.guildId].counting.nextNum}\`.${storage[cmd.guildId].counting.legit?"":`\n\n-# Please be aware that this server is currently ineligible for the leaderboard. To fix this, make sure that the number you start from is less than 2, that the posts between turns is at least 1, and that counting is configured to reset upon any mistakes.`}`);
			break;
		}
	},

	async onmessage(msg, context) {
		applyContext(context);

		// If the server uses counting, but Stewbot cannot add reactions or send messages, don't do counting
		if(!msg.author.bot&&storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel&&(!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.AddReactions)||!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages))){
			storage[msg.guildId].counting.active=false;
		}
		
		// Counting
		if(!msg.author.bot&&storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel){
			var num = processForNumber(msg.content);
			if(num){
				if(num===storage[msg.guild.id].counting.nextNum){
					if(storage[msg.guild.id].users[msg.author.id].countTurns<=0) {
	
						// Discord glitches if the reaction is added too quickly
						setTimeout(_ => {
							try {
								msg.react("✅");
							} catch(e) {} // user could have blocked, a bot could have deleted it faster, etc...
						}, 150);
						
						storage[msg.guild.id].counting.nextNum++;
						if(storage[msg.guild.id].counting.legit&&num>storage[msg.guild.id].counting.highestNum){
							msg.react("🎉");
							storage[msg.guild.id].counting.highestNum=num;
						}
						for(let a in storage[msg.guild.id].users){
							storage[msg.guild.id].users[a].countTurns--;
						}
						storage[msg.guild.id].users[msg.author.id].count++;
						storage[msg.guild.id].users[msg.author.id].countTurns=storage[msg.guild.id].counting.takeTurns;
						
					}
					else{
						msg.react("❌");
						if(storage[msg.guild.id].users[msg.author.id].beenCountWarned&&storage[msg.guild.id].counting.reset){
							msg.reply(`⛔ **Reset**\nNope, you need to wait for ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} to post before you post again!${storage[msg.guild.id].counting.reset?` The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`:""}`);
							if(storage[msg.guild.id].counting.reset){
								storage[msg.guild.id].counting.nextNum=1;
								if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.takeTurns>0) storage[msg.guild.id].counting.legit=true;
								for(let a in storage[msg.guild.id].users){
									storage[msg.guild.id].users[a].countTurns=0;
								}
								if(storage[msg.guild.id].counting.failRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
									var fr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.failRole);
									if(fr===null||fr===undefined){
										storage[msg.guild.id].counting.failRoleActive=false;
									}
									else{
										if(msg.guild.members.cache.get(client.user.id).roles.highest.position>fr.rawPosition){
											try{ await msg.member.roles.add(fr); }catch{}
										}
										else{
											storage[msg.guild.id].counting.failRoleActive=false;
										}
									}
								}
								
							}
						}
						else{
							msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:"```"}`);
							storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
							if(storage[msg.guild.id].counting.warnRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
								var wr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.warnRole);
								if(wr===null||wr===undefined){
									storage[msg.guild.id].counting.warnRoleActive=false;
								}
								else{
									if(msg.guild.members.cache.get(client.user.id).roles.highest.position>wr.rawPosition){
										try{ await msg.member.roles.add(wr); }catch{}
									}
									else{
										storage[msg.guild.id].counting.warnRoleActive=false;
									}
								}
							}
							
						}
					}
				}
				else if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.nextNum!==1){
					msg.react("❌");
					if(storage[msg.guild.id].users[msg.author.id].beenCountWarned&&storage[msg.guild.id].counting.reset){
						msg.reply(`⛔ **Reset**\nNope, that was incorrect! The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`);
						storage[msg.guild.id].counting.nextNum=1;
						if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.takeTurns>0) storage[msg.guild.id].counting.legit=true;
						for(let a in storage[msg.guild.id].users){
							storage[msg.guild.id].users[a].countTurns=0;
						}
						if(storage[msg.guild.id].counting.failRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
							var fr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.failRole);
							if(!fr){
								storage[msg.guild.id].counting.failRoleActive=false;
							}
							else{
								if(msg.guild.members.cache.get(client.user.id).roles.highest.position>fr.rawPosition){
									try{ await msg.member.roles.add(fr); }catch{}								}
								else{
									storage[msg.guild.id].counting.failRoleActive=false;
								}
							}
						}
						
					}
					else{
						msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:"```"}`);
						storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
						if(storage[msg.guild.id].counting.warnRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
							var wr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.warnRole);
							if(wr===null||wr===undefined){
								storage[msg.guild.id].counting.warnRoleActive=false;
							}
							else{
								if(msg.guild.members.cache.get(client.user.id).roles.highest.position>wr.rawPosition){
									try{ await msg.member.roles.add(wr); }catch{}								}
								else{
									storage[msg.guild.id].counting.warnRoleActive=false;
								}
							}
						}
					}
				}
			}
		}
	}
};
