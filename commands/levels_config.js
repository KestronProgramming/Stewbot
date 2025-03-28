// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const { getLvl } = require("./rank.js")

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("levels_config").setDescription("Configure level ups").addBooleanOption(option=>
				option.setName("active").setDescription("Should level ups be active?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel should level ups go to, if set to a specific channel?")
			).addStringOption(option=>
				option.setName("message").setDescription("What gets sent at a new level. Use ${USER} for ping, ${USERNAME} for username, ${LVL} for level.").setMinLength(1)
			).addStringOption(option=>
				option.addChoices(
					{"name":"Specific Channel",value:"channel"},
					{"name":"DM",value:"DM"},
					{"name":"Inline","value":"inline"}
				).setName("location").setDescription("Where should level up messages be sent?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Administration","Configuration","Entertainment","General","Server Only"],			shortDesc: "Configure level ups",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure a server leveling system where posting gets you an amount of experience points that allow you to level up. Exp points are granted with a cooldown to discourage spamming.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		storage[cmd.guildId].levels.active=cmd.options.getBoolean("active");
		if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].levels.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getString("location")!==null) storage[cmd.guildId].levels.location=cmd.options.getString("location");
		if(cmd.options.getString("message")!==null) storage[cmd.guildId].levels.msg=checkDirty(config.homeServer,cmd.options.getString("message"),true)[1];
		var disclaimers=[];
		if(storage[cmd.guildId].levels.channel===""&&storage[cmd.guildId].levels.location==="channel"){
			storage[cmd.guildId].levels.location="DM";
			disclaimers.push(`No channel was set to post level-ups to, so I have changed the level-up notification location to DMs.`);
		}
		if(storage[cmd.guildId].levels.location!=="DM"&&!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
			storage[cmd.guildId].levels.location="DM";
			disclaimers.push(`I do not have the MANAGE_WEBHOOKS permission for this server, so I cannot post level-up messages. I have set the location for level-up notifications to DMs instead.`);
		}
		cmd.followUp(`Level ups configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	},

	async onmessage(msg, context) {
		applyContext(context);

		// Level-up XP
		if(!msg.author.bot&&storage[msg.guildId]?.levels.active&&storage[msg.guildId]?.users[msg.author.id].expTimeout<Date.now()&&!checkDirty(config.homeServer,msg.content)){
			storage[msg.guildId].users[msg.author.id].expTimeout=Date.now()+60000;
			storage[msg.guildId].users[msg.author.id].exp+=Math.floor(Math.random()*11)+15;//Between 15 and 25
			if(storage[msg.guild.id].users[msg.author.id].exp>getLvl(storage[msg.guild.id].users[msg.author.id].lvl)){
				storage[msg.guild.id].users[msg.author.id].lvl++;
				if(storage[msg.author.id].config.levelUpMsgs){
					if(storage[msg.guild.id].levels.hasOwnProperty("channelOrDM")){
						storage[msg.guild.id].levels.location=storage[msg.guild.id].levels.channelOrDM;
						delete storage[msg.guild.id].levels.channelOrDM;
					}
					if(storage[msg.guild.id].levels.location==="DM"){
						try{
							msg.author.send({embeds:[{
								"type": "rich",
								"title": `Level Up`,
								"description": storage[msg.guild.id].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
								"color": 0x006400,
								"thumbnail": {
									"url": msg.guild.iconURL(),
									"height": 0,
									"width": 0
								},
								"footer": {
									"text": `Sent from ${msg.guild.name}. To disable these messages, use /personal_config.`
								}
							}]}).catch(e=>{});
						}catch(e){}
					}
					else{
						var resp={
							"content":storage[msg.guildId].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
							"avatarURL":msg.guild.iconURL(),
							"username":msg.guild.name
						};
						var c=client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id);
						if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
							var hook=await c.fetchWebhooks();
							hook=hook.find(h=>h.token);
							if(hook){
								hook.send(resp);
							}
							else{
								client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id).createWebhook({
									name:config.name,
									avatar: config.pfp
								}).then(d=>{
									d.send(resp);
								});
							}
						}
						else{
							storage[msg.guild.id].levels.location="DM";
							try{
								msg.author.send({embeds:[{
									"type": "rich",
									"title": `Level Up`,
									"description": storage[msg.guild.id].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
									"color": 0x006400,
									"thumbnail": {
										"url": msg.guild.iconURL(),
										"height": 0,
										"width": 0
									},
									"footer": {
										"text": `Sent from ${msg.guild.name}. To disable these messages, use /personal_config.`
									}
								}]}).catch(e=>{});
							}catch(e){}
						}
					}
				}
			}
			
		}
		
	}
};
