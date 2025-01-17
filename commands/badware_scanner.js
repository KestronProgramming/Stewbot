const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

const blocklistsLocation = `./data/filterCache/`
const blocklists = [
	{
		title: "Ublock's Badware List",
		url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt",
		filename: "badware.txt"
	}
]

const { URL } = require('url');
const fs = require("node:fs")

async function loadBlocklist(url) {
    const response = await fetch(url);
    const text = await response.text();

    const rules = text.split('\n').filter(line => {
        // Ignore comments and empty lines
        return line.trim() && !line.startsWith('!');
    });

    return rules.join("\n");
}

function getHostname(url) {
    try {
        const parsedUrl = new URL(url);
		// Normalize
        return parsedUrl.hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

function isUrlBlocked(url, blocklist) {
    if (typeof blocklist === 'string') {
        blocklist = blocklist.split('\n');
    }
    const whitelist = [
        "google.com",
        "youtube.com",
        "wikipedia.org",
        "github.com",
        "stackoverflow.com",
        "microsoft.com",
        "apple.com",
        "amazon.com",
        "linkedin.com",
        "twitter.com",
        "facebook.com",
        "bbc.com",
        "nytimes.com",
        "openai.com",
        "cloudflare.com",
        "mozilla.org",
        "paypal.com",
        "spotify.com",
        "zoom.us",
        "netflix.com",
        "discord.com",
        "discord.gg"
    ];

    const hostname = getHostname(url);
    
    // Check whitelist first
    if (whitelist.includes(hostname)) {
        return false;
    }

    // Check blocklist
    for (const rule of blocklist) {
        if (rule.startsWith('||')) {
            // Domain rule (e.g., ||example.com^)
            const domain = rule.slice(2).split('^')[0];
            if (hostname === domain) {
                return true;
            }
        } else if (rule.startsWith('/')) {
            // Parse regex rule and directives
            const [fullRule, regexPattern, directives] = rule.match(/^\/(.+)\/\$(.*)$/) || [];
            if (!fullRule) continue;

            // Parse directives
            const directiveMap = {};
            if (directives) {
                directives.split(',').forEach(directive => {
                    const [key, value] = directive.split('=');
                    directiveMap[key] = value || true;
                });
            }

            // Handle domain/TLD whitelisting
            if (directiveMap.to) {
                const whitelist = directiveMap.to
                    .split('|')
                    .filter(item => item.startsWith('~'))
                    .map(item => item.slice(1));

                // Check if URL matches any whitelisted domain or TLD
                for (const whitelistItem of whitelist) {
                    // Check if whitelistItem is a TLD (doesn't contain dots)
                    if (!whitelistItem.includes('.')) {
                        if (hostname.endsWith(`.${whitelistItem}`)) {
                            return false;
                        }
                    } 
                    // Check if whitelistItem is a domain
                    else if (hostname === whitelistItem || hostname.endsWith(`.${whitelistItem}`)) {
                        return false;
                    }
                }
            }

            // Test the URL against the regex pattern
            try {
                const regex = new RegExp(regexPattern);
                if (regex.test(url)) {
                    return true;
                }
            } catch (e) {
                console.error('Invalid regex pattern:', regexPattern);
            }
        }
    }
    return false;
}

async function checkURL(inputUrl, overrideCache=false) {
	for (const blocklist of blocklists) {
		const blocklistLoc = `${blocklistsLocation}/${blocklist.filename}`;
		let blocklistContent;

		if (overrideCache || !fs.existsSync(blocklistLoc)) {
			// Download if we don't have it already
			blocklistContent = await loadBlocklist(blocklist.url);
            if (!fs.existsSync(blocklistsLocation)) fs.mkdirSync(blocklistsLocation)
			fs.writeFileSync(blocklistLoc, blocklistContent);
		}
		else {
			blocklistContent = fs.readFileSync(blocklistLoc).toString();
		}

		// Now check against it
		const isBlocked = isUrlBlocked(inputUrl, blocklistContent);
		if (isBlocked) return blocklist;
	}
	return false;
}

module.exports = {
	data: {
		command: null,
		
		// Optional fields
		extra: {"contexts": [0], "integration_types": [0]},
        /*
            Contexts
             - 0: Server command
             - 1: Bot's DMs
             - 2: User command

            Integration Types:
             - 0: Installed to servers
             - 1: Installed to users
        */

		// Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
		requiredGlobals: [],

		help: {
			helpCategories: ["Administration", "Server Only"],
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
			shortDesc: "A module that scans links for malicious content",
			detailedDesc:
				`This is a developing command using public lists of malicious links domains to identify bad links.`
		},
	},

	async onmessage(msg, context) {
		// Find URLs and check each one
		const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
		const links = msg.content.match(urlRegex) || [];
		for (const link of links) {
			const triggerdBlocklist = await checkURL(link);
			if (triggerdBlocklist) {
				await msg.reply(
                    `## :warning: WARNING :warning:\n` +
                    `The link sent in this message was found in the blocklist [${triggerdBlocklist.title}](${triggerdBlocklist.url})\n` +
                    `\n` +
                    `-# This module is part of a new Stewbot feature. Use ${cmds.report_problem.mention} to report any issues.\n` +
                    `-# If you need to disable this module, run ${"`/block_command command:/badware_scanner`"}`
				)
			}
		}

	}
};
