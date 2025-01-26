// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

const crypto = require('crypto');
const Turndown = require('turndown');
const dns = require('dns');
const { URL } = require('url');

const RSSParser = require("rss-parser");
var turndown = new Turndown();
const cheerio = require('cheerio');

// Setup RSS parser
const rssParser=new RSSParser({
	customFields: {
	  item: ['description'],
	}
});

// Setup turndown parser
turndown.addRule('ignoreAll', {
	filter: ['img'], // Ignore image tags in description
	replacement: function () {
		return '';
	}
});


// Utility functions for RSS security
function isPrivateIP(ip) {
    const privateRanges = [
        /^127\./,      // Loopback
        /^10\./,       // Private
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private
        /^192\.168\./, // Private
        /^169\.254\./  // Link-local
    ];
    return privateRanges.some((range) => range.test(ip));
};
async function isUrlAllowed(inputUrl) {
    try {
        let url;
        try {
            url = new URL(inputUrl);
        } catch {
            return [false, "that is not a valid url."];
        }

        // Only allow http/https protocols
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return [false, "only http and https are allowed."];
        }

        const addresses = await new Promise((resolve, reject) => {
            dns.lookup(url.hostname, { all: true }, (err, addresses) => {
                if (err) return reject(err);
                resolve(addresses);
            });
        });

        for (const { address } of addresses) {
            if (isPrivateIP(address)) {
                return [false, "private IPs are not allowed"];
            }
        }

        // URL is safe
        return [true, "valid"];

    } catch (error) {
        return [false, "URL validation failed - general failure"];
    }
}
const validateDNSForPrivateIP = async (hostname) => {
    return new Promise((resolve, reject) => {
        dns.lookup(hostname, { all: true }, (err, addresses) => {
            if (err) return reject(err);
            for (const { address } of addresses) {
                if (isPrivateIP(address)) {
                    return reject(new Error('Redirected to restricted IP address'));
                }
            }
            resolve();
        });
    });
};
const fetchWithRedirectCheck = async (inputUrl, maxRedirects = 5) => {
    let url = new URL(inputUrl);
    let redirects = 0;

    while (redirects < maxRedirects) {
        const response = await fetch(url.href, { redirect: 'manual' });
        if (response.status < 300 || response.status >= 400) {
            return response;
        }
        const location = response.headers.get('location');
        if (!location) {
            throw new Error('Redirect response without Location header');
        }
        // Resolve the new URL relative to the original
        url = new URL(location, url);

        // Perform DNS validation to prevent redirecting to private IPs
        await validateDNSForPrivateIP(url.hostname);
        redirects += 1;
    }

    throw new Error('Too many redirects');
};
async function checkRSS() {
	if(!storage.hasOwnProperty("rss")) storage.rss={};
	Object.keys(storage.rss).forEach(async feed=>{
		feed=storage.rss[feed];
		if(feed.channels.length===0){
			delete storage.rss[feed.hash];
		}
		else{
			var cont=true;
			var parsed;
			try {
				// Get the URL myself to prevent local IP redirects
				const data = await (await fetchWithRedirectCheck(feed.url)).text();
				parsed = await rssParser.parseString(data);
				feed.fails = 0;
			} catch (error) {
				cont = false;

				// Track fails
				if (feed.fails) {
					feed.fails++;
				} 
				else {
					feed.fails = 1;
				}

				// Remove failing URLs
				if (feed.fails > 7) {
					delete storage.rss[feed.hash];
				}
			}
			if(cont){
				let lastSentDate = new Date(feed.lastSent);
				let mostRecentArticle = lastSentDate;

				for (item of parsed.items.reverse()) {
					let thisArticleDate = new Date(item.isoDate);
					if(lastSentDate < thisArticleDate){
						// Keep track of most recent
						if (mostRecentArticle < thisArticleDate) {
							mostRecentArticle = thisArticleDate;
						}

						// Parse before sending to each channel
						try {
							// Extract theoretically required fields per https://www.rssboard.org/rss-specification
							const link = item.link || parsed.link; // default to channel URL
							let baseUrl = '';
							if (link) { // Attempt to get baseURL for turndown parsing
								try {
									baseUrl = new URL(link).origin;
								} catch (e) {
									baseUrl = ''; // fallback if URL is invalid
								}
							}

							let parsedDescription = turndown.turndown(item.description?.replace?.(/href="\/(.*?)"/g, `href="${(baseUrl)}/$1"`) || "");
							let content =  parsedDescription || item.contentSnippet || turndown.turndown(item.content || "") || 'No Summary Available';
							content = content.replace(/&quot;/g, '"')
								.replace(/&amp;/g, '&')
								.replace(/&lt;/g, '<')
								.replace(/&gt;/g, '>');

							const embed = new EmbedBuilder()
								.setColor(0x5faa66)
								.setTitle(limitLength(item.title || parsed.description || 'No Title', 256)) // If no title, grab the feed description
								.setDescription(limitLength(content, 1000));
							if (link) embed.setURL(link)
							
							// Optional fields
							const creator = item.creator || item["dc:creator"] || parsed.title || "Unknown Creator"; // 
							const imageUrl = item?.image?.url || parsed?.image?.url;
							if (creator) embed.setAuthor({ name: creator })
							if (imageUrl) embed.setThumbnail(imageUrl);

							// If the description has an image, attempt to load it as a large image (image *fields* are usually thumbnails / logos)
							const $ = cheerio.load(item.description || "");
							const contentImage = $('img').attr('src');
							if (contentImage) embed.setImage(contentImage);

							// Send this feed to everyone following it
							for (chan of feed.channels) {
								let c=client.channels.cache.get(chan);
								if(c===undefined||c===null||!c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
									feed.channels.splice(feed.channels.indexOf(chan),1);
								}
								else{
									try {
										c.send({ 
											content: `-# New notification from [a followed RSS feed](${item.link})`,
											embeds: [ embed ]
										})
									} catch (e) {
										notify("RSS channel error: " + e.message + "\n" + e.stack);
									}
								}
							}

						} catch (e) {
							notify("RSS feed error: " + e.message + "\n" + e.stack);
						}
					}
				};
				// Update feed most recent now after sending all new ones since last time
				feed.lastSent = mostRecentArticle.toISOString();
			}
		}
	});
}

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

		requiredGlobals: [],

		help: {
			follow:{
				helpCategories: ["Information","Configuration","Administration","Server Only"],
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
					- Administration -> A command that needs moderator privileges
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
					- Administration -> A command that needs moderator privileges
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

		if (!storage.rss) storage.rss = storage.rss || {};
		
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
		
		checkRSS();
	}
};
