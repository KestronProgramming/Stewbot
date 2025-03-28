// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("ticket").setDescription("Set up a ticket system here for users to contact mods").addChannelOption(option=>
				option.setName("channel").setDescription("The channel for tickets to be opened in on the staff end").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Administration","Configuration","Server Only"],
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
			shortDesc: "Set up a ticket system here for users to contact mods",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Use this command in the channel you would like Stewbot to post the ticket message in. This message will contain a button that will connect the user's DMs with Stewbot to a thread in the channel specified during command setup.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({embeds:
			[{
				"type": "rich",
				"title": `${cmd.guild.name} Moderator Tickets`,
				"description": `Press the button below to open up a private ticket with ${cmd.guild.name} moderators.`,
				"color": 0x006400,
				"thumbnail": {
					"url": cmd.guild.iconURL(),
					"height": 0,
					"width": 0
				},
				"footer": {
					"text": `Tickets will take place over DMs, make sure to have DMs open to ${client.user.username}.`
				}
			}], 
			components:	[
				new ActionRowBuilder()
				.addComponents(new ButtonBuilder().setCustomId(`ticket-${cmd.options.getChannel("channel").id}`)
				.setLabel("Create private ticket with staff")
				.setStyle(ButtonStyle.Success))
			]
		});
	},

	async onmessage(msg, context) {
		applyContext(context);

		// Ticket system
		if(msg.channel.ownerId === client.user.id && msg.channel.name?.startsWith("Ticket with ")&&!msg.author.bot){
			var resp={files:[],content:`Ticket response from **${msg.guild.name}**. To respond, make sure to reply to this message.\nTicket ID: ${msg.channel.name.split("Ticket with ")[1].split(" in ")[1]}/${msg.channel.id}`};
			msg.attachments.forEach((attached,i) => {
				let url=attached.url.toLowerCase();
				if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg"))){
					resp.files.push(attached.url);
				}
			});
			resp.embeds=[new EmbedBuilder()
				.setColor(0x006400)
				.setTitle(`Ticket Message from ${msg.guild.name}`)
				.setAuthor({
					name: msg.author.globalName||msg.author.username,
					iconURL:msg.author.displayAvatarURL(),
					url:`https://discord.com/users/${msg.author.id}`
				})
				.setDescription(msg.content?msg.content:"⠀")
				.setTimestamp(new Date(msg.createdTimestamp))
				.setThumbnail(msg.guild.iconURL())
				.setFooter({
					text: "Make sure to reply to this message to respond",
				})
				.setImage(msg.attachments.first()?msg.attachments.first().url:null)
			];
			try{client.users.cache.get(msg.channel.name.split("Ticket with ")[1].split(" in ")[0]).send(resp).catch(e=>{});}catch(e){}
		}
		if(msg.reference&&msg.channel instanceof DMChannel&&!msg.author.bot){
			var rmsg=await msg.channel.messages.fetch(msg.reference.messageId);
			if(rmsg.author.id===client.user.id&&rmsg.content.includes("Ticket ID: ")){
				var resp={
					content:msg.content,
					username:msg.member?.nickname||msg.author.globalName||msg.author.username,
					avatar_url:msg.author.displayAvatarURL()
				};
				var c=client.channels.cache.get(rmsg.content.split("Ticket ID: ")[1].split("/")[0]);
				if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
					var hook=await c.fetchWebhooks();
					hook=hook.find(h=>h.token);
					if(hook){
						fetch(`https://discord.com/api/webhooks/${hook.id}/${hook.token}?thread_id=${rmsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify(resp),
						}).then(d=>d.text());
					}
					else{
						client.channels.cache.get(rmsg.content.split("Ticket ID: ")[1].split("/")[0]).createWebhook({
							name: config.name,
							avatar: config.pfp
						}).then(d=>{
							fetch(`https://discord.com/api/webhooks/${d.id}/${d.token}?thread_id=${rmsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(resp),
							});
						});
					}
				}
				return;
			}
		}
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/ticket-.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("ticket-")){
			client.channels.cache.get(cmd.customId.split("-")[1]).send(`Ticket opened by **${cmd.member.nickname||cmd.user.globalName||cmd.user.username}**.`).then(msg=>{
				msg.startThread({
					name:`Ticket with ${cmd.user.id} in ${cmd.customId.split("-")[1]}`,
					autoArchiveDuration:60,
					type:"GUILD_PUBLIC_THREAD",
					reason:`Ticket opened by ${cmd.user.username}`
				});
				cmd.user.send(`Ticket opened in **${cmd.guild.name}**. You can reply to this message to converse in the ticket. Note that any messages not a reply will not be sent to the ticket.\n\nTicket ID: ${cmd.customId.split("-")[1]}/${msg.id}`);
			});
			cmd.deferUpdate();
		}
	}
};
