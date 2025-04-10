// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const ms = require("ms");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, guildUserByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const NodeCache = require("node-cache");
const expTimeout = new NodeCache( { stdTTL: 60 } )

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
			helpCategories: [Categories.Administration, Categories.Configuration, Categories.Entertainment, Categories.General, Categories.Server_Only],
			shortDesc: "Configure level ups",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure a server leveling system where posting gets you an amount of experience points that allow you to level up. Exp points are granted with a cooldown to discourage spamming.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);
		
		guild.levels.active=cmd.options.getBoolean("active");
		if(cmd.options.getChannel("channel")!==null) guild.levels.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getString("location")!==null) guild.levels.location=cmd.options.getString("location");
		if(cmd.options.getString("message")!==null) guild.levels.msg=(await checkDirty(config.homeServer,cmd.options.getString("message"),true))[1];
		var disclaimers=[];
		if(guild.levels.channel===""&&guild.levels.location==="channel"){
			guild.levels.location="DM";
			disclaimers.push(`No channel was set to post level-ups to, so I have changed the level-up notification location to DMs.`);
		}
		if(guild.levels.location!=="DM"&&!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
			guild.levels.location="DM";
			disclaimers.push(`I do not have the MANAGE_WEBHOOKS permission for this server, so I cannot post level-up messages. I have set the location for level-up notifications to DMs instead.`);
		}

		await guild.save()
		cmd.followUp(`Level ups configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	},

	/** @param {import('discord.js').Message} msg */
    async onmessage(msg, context) {
		applyContext(context);
		if (!msg.guild) return;

		// TODO_DB: this is run on every server with messages, so optimize.
		const guild = await guildByObj(msg.guild);

		// Level-up XP
		if (
			!msg.author.bot && 
			guild.levels.active && 
			!expTimeout.has(msg.author.id) && 
			!msg.filtered // Messages with bad words don't get XP
		) {
			expTimeout.set(msg.author.id, true);

			const guildUser = await guildUserByObj(msg.guild, msg.author.id);
			
			guildUser.exp += Math.floor(Math.random() * 11) + 15;//Between 15 and 25 XP

			if (guildUser.exp > getLvl(guildUser.lvl)) {
				guildUser.lvl++;

				// Send unless the user disabled for themselves
				const user = await userByObj(msg.author);

				if (user.config.levelUpMsgs) {
					if(guild.levels.location==="DM"){
						try{
							msg.author.send({embeds:[{
								"type": "rich",
								"title": `Level Up`,
								"description": guild.levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",guildUser.lvl),
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
					else {
						var resp={
							"content":guild.levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",guildUser.lvl),
							"avatarURL":msg.guild.iconURL(),
							"username":msg.guild.name
						};
						var c=client.channels.cache.get(guild.levels.location==="channel"?guild.levels.channel:msg.channel.id);
						if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
							var hook=await c.fetchWebhooks();
							hook=hook.find(h=>h.token);
							if(hook){
								hook.send(resp);
							}
							else{
								client.channels.cache.get(guild.levels.location==="channel"?guild.levels.channel:msg.channel.id).createWebhook({
									name:config.name,
									avatar: config.pfp
								}).then(d=>{
									d.send(resp);
								});
							}
						}
						else {
							// Change to DB if we don't have perms over webhooks
							guild.levels.location="DM";
							try{
								msg.author.send({embeds:[{
									"type": "rich",
									"title": `Level Up`,
									"description": guild.levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",guildUser.lvl),
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
			
			guildUser.save();
			guild.save();
		}
		
	}
};
