const { ContextMenuCommandBuilder, DiscordAPIError, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}



const blocklistsLocation = `./data/filterCache/`
const blocklists = [
	{
		title: "uBlock Origin's Badware List",
		url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt",
		filename: "badware.txt"
	}
]

const scamEmoji = process.env.beta ? "<:This_Post_May_Contain_A_Scam:1330320295357055067>" : '<:This_Post_May_Contain_A_Scam:1330318400668565534>'

const { URL } = require('url');
const fs = require("node:fs")

// Functions for ublock list checker
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
        "x.com",
        "twitter.com",
        "facebook.com",
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

function updateBlocklists() {
    // A quick an easy way
    checkURL("https://google.com", true);
}

// Functions for hidden URL alert
function detectMismatchedDomains(markdown) {
    // Extract markdown embeded links
    // const markdownRegex = /\[([^\s]+)\]\(([^\)]+)\)/;
    const markdownRegex = /\[<?([^\s\[\]]+)>?\]\(<?([^()\s]+)>?\)/;


    const match = markdown.match(markdownRegex);
    if (!match) return null; // No valid Markdown link found

    const displayText = match[1];
    const realUrl = match[2];

    // Match anything designed to look like a domain
    const fakeDomainRegex = /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

    const fakeDomain = displayText.match(fakeDomainRegex)?.[0];
    if (!fakeDomain) return;

    let realDomain;
    try {
        const url = new URL(realUrl);
        realDomain = url.hostname;
        realDomain = realDomain.replace("www.", "")
        if (!realDomain) {
            return null;
        }
    } catch {
        return null;
    }

    // Finally, see if this link is hiding behind a fake link
    if (fakeDomain.toLowerCase() !== realDomain.toLowerCase()) {
        return { fake: fakeDomain, real: realDomain };
    }

    return null;
}

module.exports = {
    updateBlocklists, // This function will be called in the dailies

	data: {
		command: new SlashCommandBuilder().setName("badware_scanner").setDescription("Configure the Badware Scanner for this server")
        .addBooleanOption(option=>
            option.setName("domain_scanning").setDescription("Check domains against uBlock's Badware list?")
        ).addBooleanOption(option=>
            option.setName("fake_link_check").setDescription("Check if a link uses markdown to look like it leads somewhere else?")
        ).addBooleanOption(option=>
            option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
        ).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
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
			helpCategories: ["Administration", "Server Only", "Safety","Module"],
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
                - Safety -> Anti-hack, anti-spam, etc
			*/
			shortDesc: "A module that scans links for malicious content.",
			detailedDesc:
				`This is a developing command using public lists and other methods to identify malicious links.`
		},
	},

    async execute(cmd, context) {
		applyContext(context);
		
		if(cmd.options.getBoolean("domain_scanning")!==null) storage[cmd.guildId].config.domain_scanning=cmd.options.getBoolean("domain_scanning");
		if(cmd.options.getBoolean("fake_link_check")!==null) storage[cmd.guildId].config.fake_link_check=cmd.options.getBoolean("fake_link_check");
		
		cmd.followUp("Badware Scanner configured.");
	},

	async onmessage(msg, context) {
		applyContext(context);

        try {


            // Check domain
            if (msg.guild && !(storage[msg.guild.id].config.domain_scanning === false)) {
                const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                const links = msg.content.match(urlRegex) || [];
                for (const link of links) {
                    const triggerdBlocklist = await checkURL(link);
                    if (triggerdBlocklist) {
                        if (msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                            return await msg.reply(
                                `## :warning: WARNING :warning:\n` +
                                `The link sent in this message was found in the blocklist [${triggerdBlocklist.title}](${triggerdBlocklist.url})\n` +
                                `\n` +
                                `-# This module is part of a new Stewbot feature. Use ${cmds.report_problem.mention} to report any issues.\n` +
                                `-# If you need to disable this feature, run ${"`/badware_scanner domain_scanning:false`"}`
                            );
                        } else if (msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AddReactions)) {
                            await msg.react('⚠️');
                            return await msg.react(scamEmoji);
                        }
                    }
                }
            }

            // Check for link hiding behind fake link
            if (msg.guild && !(storage[msg.guild.id].config.fake_link_check === false)) {
                const fakeLink = detectMismatchedDomains(msg.content);
                if (fakeLink) {
                    if (msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                        return await msg.reply({
                            content:
                                `## :warning: WARNING :warning:\n` +
                                `The link in this message links to **${fakeLink.real}**, NOT **${fakeLink.fake}**, which it looks like.\n` +
                                `\n` +
                                `-# This module is part of a new Stewbot feature. Use ${cmds.report_problem.mention} to report any issues.\n` +
                                `-# If you need to disable this feature, run ${"`/badware_scanner fake_link_check:false`"}`,
                            allowedMentions:{parse:[]}
                        })
                    } else if (msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AddReactions)) {
                        // await msg.react('🛑');
                        await msg.react('⚠️');
                        return await msg.react(scamEmoji);
                    }
                }
            }

        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                error.code === 50035 && // Invalid Form Body
                error.message.includes('MESSAGE_REFERENCE_UNKNOWN_MESSAGE') // Specific error message check
            ) {
                // This will happen when it was deleted before (likely by ourselves) before we could reply. 
            } else {
                throw error;
            }
        }
	},


    async daily(context) {
        applyContext(context);

        // Update badware blocklists
        updateBlocklists()
    }
};
