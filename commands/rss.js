// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate
const crypto = require('crypto');

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("rss").setDescription("Commands relating to RSS feeds")
			.addSubcommand(command=>
				command.setName("follow").setDescription("Follow an RSS feed").addChannelOption(option=>
					option.setName("channel").setDescription("The channel to follow this RSS feed in").setRequired(true)
					.addChannelTypes(ChannelType.GuildText)
				).addStringOption(option=>
					option.setName("feed").setDescription("The feed to follow").setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("unfollow").setDescription("Unfollow an RSS feed").addChannelOption(option=>
					option.setName("channel").setDescription("The channel to unfollow this RSS feed from").setRequired(true)
				).addStringOption(option=>
					option.setName("feed").setDescription("The feed to unfollow (Type 'all' to unfollow all)").setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("check").setDescription("Check the RSS feeds a channel follows").addChannelOption(option=>
					option.setName("channel").setDescription("The channel to check RSS feeds for").setRequired(true)
					.addChannelTypes(ChannelType.GuildText)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["isUrlAllowed", "fetchWithRedirectCheck", "rssParser"],

		help: {
			follow:{
				helpCategories: ["Information","Configuration","Administration","Server Only"],
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
				shortDesc: "Follow an RSS feed",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Specify a channel and an RSS feed, and every day at noon UTC, Stewbot will post any updated from that feed into the channel.`
			},
			unfollow:{
				helpCategories: ["Configuration","Administration","Server Only"],
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
				shortDesc: "Unfollow an RSS feed",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Specify the channel the feed is followed in, and the URL of the feed to unfollow, and Stewbot will no longer post RSS updates for that feed there. You can use ${cmds.rss.check.mention} to get the URL needed for this command.`
			},
			check:{
				helpCategories: ["Information","Administration","Server Only"],
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
				shortDesc: "Check the RSS feeds a channel follows",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Run this command to check which RSS URLs Stewbot is posting from in the specified channel.`
			}
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		switch(cmd.options.getSubcommand()){
			case 'check':
				var feeds=[];
				Object.keys(storage.rss).forEach(feed=>{
					feed=storage.rss[feed];
					if(feed.channels.includes(cmd.options.getChannel("channel").id)){
						feeds.push(feed.url);
					}
				});
				cmd.followUp(feeds.length>0?`The RSS feeds being followed for <#${cmd.options.getChannel("channel").id}> include the following:\n${feeds.map(f=>`- ${f}`).join("\n")}`:`There are no feeds followed in <#${cmd.options.getChannel("channel").id}>`);
			break;
			case 'follow':
				if(!cmd.options.getChannel("channel").permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
					cmd.followUp(`I'm not allowed to send messages in <#${cmd.options.getChannel("channel").id}> so this action cannot be completed.`);
					break;
				}

				// Validate URL
				const url = cmd.options.getString("feed").trim();

				// Validate URL form
				const [urlAllowed, errorText] = await isUrlAllowed(url);
				if (!urlAllowed) {
					cmd.followUp(`This URL is not allowed: ${errorText}`);
					break;
				}

				// Make sure it is a valid link
				let response;
				try {
					response = await fetchWithRedirectCheck(url);
				} catch (error) {
					cmd.followUp(`URL validation failed: ${error.message}`);
					break
				}

				// Final make sure it is valid RSS
				try {
					await rssParser.parseURL(url)
				} catch (error) {
					cmd.followUp(`Error parsing RSS from link.`);
					break
				}

				// At this point, the URL is valid and all
				var hash = crypto.createHash('md5').update(url).digest('hex');
				if(!storage.rss.hasOwnProperty(hash)){
					storage.rss[hash]={
						"hash":hash,
						"url":url,
						"channels":[],
						"lastSent":new Date()
					};
				}
				storage.rss[hash].channels.push(cmd.options.getChannel("channel").id);
				cmd.followUp("I have followed the feed for that channel");
				
			break;
			case 'unfollow':
				if(cmd.options.getString("feed").toLowerCase()!=="all"){
					var hash = crypto.createHash('md5').update(cmd.options.getString("feed").trim()).digest('hex');
					if(storage.rss?.[hash]?.channels?.includes(cmd.options.getChannel("channel").id)){
						storage.rss[hash].channels.splice(storage.rss[hash].channels.indexOf(cmd.options.getChannel("channel").id), 1);
						cmd.followUp("I have unfollowed the feed for that channel");
					}
					else{
						cmd.followUp(`That feed is not in my database`);
					}
				}
				else{
					Object.keys(storage.rss).forEach(feed=>{
						feed=storage.rss[feed];
						if(feed.channels.includes(cmd.options.getChannel("channel").id)){
							feed.channels.splice(feed.channels.indexOf(cmd.options.getChannel("channel").id),1);
						}
					});
					cmd.followUp(`I have unfollowed all feeds for that channel`);
				}
				
			break;
		}
	},

	async daily(context) {
		applyContext(context);
		
		console.beta("Test")
	}
};
