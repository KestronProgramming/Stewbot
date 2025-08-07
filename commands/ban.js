// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, GuildUsers } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Events}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const ms = require("ms")
const config = require("../data/config.json");
const { checkDirty } = require("./filter");

async function finTempBan(guildId, who, force) {
	const guildDB = await guildByID(guildId);

	const bannedUser = guildDB.tempBans.get(who);

	if (!guildDB.tempBans.get(who)) {
		return;
	}

	if (bannedUser.ends > Date.now() + 10000 && !force) {
		if (bannedUser.ends - Date.now() < 60000 * 60 * 24) {
			setTimeout(() => { finTempBan(guildId, who) }, bannedUser.ends - Date.now());
		}
		return;
	}

	var guild = await client.guilds.fetch(guildId);
	if (guild === null || guild === undefined) {
		try {
			client.users.fetch(bannedUser.invoker).then(user=>user.send(`I was unable to unban <@${who}>.`)).catch(e => { });
		} catch (e) { }

		guildDB.tempBans.delete(who);
		guildDB.markModified("tempBans");

		await guildDB.save();
		return;
	}
	if (!guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.BanMembers)) {
		try {
			client.users.fetch(bannedUser.invoker)
				.then(user => user.send(`I no longer have permission to unban <@${who}>.`))
				.catch(e => { });
		} catch (e) { }


		guildDB.tempBans.delete(who);
		guildDB.markModified("tempBans");

		await guildDB.save();
		return;
	}

	try {
		guild.members.unban(who).catch(e => { });
	} catch (e) { }

	if (!bannedUser.private) {
		try {
			client.users.cache.get(who).send(`You have been unbanned in ${guild.name}.`).catch(e => { });
		} catch (e) { }
	}

	guildDB.tempBans.delete(who);
	guildDB.markModified("tempBans");

	// guildDB.tempBans.set(who, undefined);

	await guildDB.save();
}

async function getUnbannedTodayUsers() {
	return await Guilds.aggregate([
		{
			// Get all guilds with temp bans
			'$match': {
				'tempBans': {
					'$exists': true,
					'$ne': {}
				}
			}
		}, {
			// Match just the bans and server ID
			'$project': {
				'tempBans': {
					'$objectToArray': '$tempBans'
				},
				'guildId': '$id' 
			}
		}, {
			// Expand each tempBan into its own item
			'$unwind': {
				'path': '$tempBans'
			}
		}, {
			// Filter to just the tempBans in the next day
			'$match': {
				'tempBans.v.ends': {
					'$lt': Date.now() + ms("1d")
				}
			}
		}, {
			// Return relevant fields
			'$project': {
				'userId': '$tempBans.k', 
				'guildId': 1,
				"ends": "$tempBans.v.ends"
			}
		}
	]);
}

async function scheduleTodaysUnbans() {
	(await getUnbannedTodayUsers()).map( user => 
		setTimeout(() => { 
			finTempBan(user.guildId, user.userId) 
		}, user.ends - Date.now())
	);
}

module.exports = {
	finTempBan,
	scheduleTodaysUnbans,
	
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
			helpCategories: [Categories.General, Categories.Administration, Categories.Server_Only],
			shortDesc: "Ban a user, temporarily if desired",
			detailedDesc: 
				`This command will ban a user. If you specify an amount of days or hours, this ban will automatically revert after that many days and hours. If you do not specify either of those, this ban will be permanent until manually removed.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

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
		var targetInServer=cmd.guild.members.cache.get(targetMember.id);
		if(targetInServer===null||targetInServer===undefined){
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
		if(!targetInServer.bannable){
			cmd.followUp(`I cannot ban this person. Make sure that I have a role higher than their highest role in the server settings before running this command.`);
			return;
		}
		
		targetInServer.ban({reason:`Instructed to ${temp?`temporarily `:``}ban by ${cmd.user.username}${reason ? ": "+reason: "."}`});
		
		if(cmd.options.getBoolean("private")===null||!cmd.options.getBoolean("private")){
			try{
				cmd.options.getUser("target").send({content:`## ${temp?`Temporarily b`:`B`}anned in ${cmd.guild.name}.${temp?`\n\nThis ban will expire <t:${Math.round((Date.now()+timer)/1000)}:R>, at <t:${Math.round((Date.now()+timer)/1000)}:f>.`:``}`,embeds:[{
					type: "rich",
					title: (await checkDirty(config.homeServer,cmd.guild.name.slice(0, 80),true))[1],
					description: reason ? (await checkDirty(config.homeServer,reason,true))[1]:`They did not specify a reason`,
					color: 0xff0000,
					thumbnail: {
						url: cmd.guild.iconURL(),
						height: 0,
						width: 0,
					},
					footer: {
						text: `Banned in ${cmd.guild.name}`
					}
				}]}).catch(_ => {});
			}
			catch(e){}
		}

		if(temp){
			const tempBanData = {
				ends: Date.now() + timer,
				reason: reason ? (await checkDirty(config.homeServer, reason, true))[1] : `Unspecified reason.`,
				invoker: cmd.user.id, //If we can't unban the person at the end of the time, try to DM the one who banned them
				private: cmd.options.getBoolean("private") !== null ? cmd.options.getBoolean("private") : false ?? false
			};

			const guildDoc = await guildByObj(cmd.guild);
			guildDoc.tempBans.set(targetInServer.id, tempBanData);
			guildDoc.markModified("tempBans");
			await guildDoc.save();			
		
			if (timer <= 60000 * 60 * 24) {
				setTimeout(() => { finTempBan(cmd.guild.id, targetInServer.id) }, timer);
			}
		}
		var comps=[];

		if(temp){
			comps=[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Unban Now").setCustomId(`unban-${targetInServer.id}`))];
		}
		cmd.followUp({content:`I have ${temp?`temporarily `:``}banned <@${cmd.options.getUser("target").id}>${temp?` until <t:${Math.round((Date.now()+timer)/1000)}:f> <t:${Math.round((Date.now()+timer)/1000)}:R>`:``}.`,components:comps});
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/unban-.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
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

		scheduleTodaysUnbans()
	},

	async [Events.ClientReady] () {
		await scheduleTodaysUnbans();
	}
};
