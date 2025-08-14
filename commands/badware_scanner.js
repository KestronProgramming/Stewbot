// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { guildByObj, userByObj } = require("./modules/database.js")
const { Events, DiscordAPIError, SlashCommandBuilder, PermissionFlagsBits}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

const ExifReader = require('exifreader');

// Attachment leak-checkers
const filetypeScanners = {
    'image/heic': async (attachment) => {
        try {
            const response = await fetch(attachment.url);
            const buffer = await getBufferFromFetch(response);

            const tags = await ExifReader.load(buffer)
            let tagNames = Object.keys(tags).map(key => key.toLowerCase())

            let leaks = false;
            if (
                tagNames.some(key => key.includes("gps")) || 
                tagNames.some(key => key.includes("location")) || 
                tagNames.some(key => key.includes("longitude")) || 
                tagNames.some(key => key.includes("latitude"))
            ) {
                leaks = true;
            }

            return leaks;
        } catch {
            return null;
        }
    }
};

// URL blockers
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
const { limitLength } = require("../utils.js");
const { censor } = require("./filter");

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
            } catch {
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
            if (!fs.existsSync(blocklistsLocation)) fs.mkdirSync(blocklistsLocation);
			await fs.promises.writeFile(blocklistLoc, blocklistContent);
		}
		else {
			blocklistContent = await fs.promises.readFile(blocklistLoc, 'utf-8');
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
    // Extract markdown embedded links
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

async function getBufferFromFetch(res) {
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
}

module.exports = {
    updateBlocklists: updateBlocklists, // This function will be called in the dailies

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
			helpCategories: [Categories.Administration, Categories.Server_Only, Categories.Safety, Categories.Module],
			shortDesc: "A module that scans links for malicious content.",
			detailedDesc:
				`This is a developing command using public lists and other methods to identify malicious links.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const updates = {};

        if (cmd.options.getBoolean("domain_scanning") !== null) {
            updates["config.domain_scanning"] = cmd.options.getBoolean("domain_scanning");
        }

        if (cmd.options.getBoolean("fake_link_check") !== null) {
            updates["config.fake_link_check"] = cmd.options.getBoolean("fake_link_check");
        }

        // Only update if we have changes to make
        if (Object.keys(updates).length > 0) {
            await guildByObj(cmd.guild, updates);
        }

        cmd.followUp("Badware Scanner configured.");
    },

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {import("./modules/database.js").GuildDoc} guildStore 
     * */
    async [Events.MessageCreate] (msg, context, guildStore) {
		applyContext(context);

        // const guild = await guildByObj(msg.guild);
        const guild = guildStore;

        try {
            const sendable = msg.channel.isSendable();
            const reactable = ("permissionsFor" in msg.channel) && msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AddReactions);

            if (!sendable && !reactable) return;

            
            // Check domain
            if (msg.guild && !(guild.config.domain_scanning === false)) {
                const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                const links = msg.content.match(urlRegex) || [];
                for (const link of links) {
                    const triggerdBlocklist = await checkURL(link);
                    if (triggerdBlocklist) {
                        if (sendable) {
                            return await msg.reply(
                                `## :warning: WARNING :warning:\n` +
                                `The link sent in this message was found in the blocklist [${triggerdBlocklist.title}](${triggerdBlocklist.url})\n` +
                                `\n` +
                                `-# If you need to disable this feature, run ${"`/badware_scanner domain_scanning:false`"}`
                            );
                        } else if (reactable) {
                            await msg.react('⚠️');
                            return await msg.react(scamEmoji);
                        }
                    }
                }
            }

            // Check for link hiding behind fake link
            if (msg.guild && !(guild.config.fake_link_check === false)) {
                const fakeLink = detectMismatchedDomains(msg.content);
                if (fakeLink) {
                    if (sendable) {
                        return await msg.reply({
                            content:
                                `## :warning: WARNING :warning:\n` +
                                `The link in this message links to **${fakeLink.real}**, NOT **${fakeLink.fake}**, which it looks like.\n` +
                                `\n` +
                                `-# If you need to disable this feature, run ${"`/badware_scanner fake_link_check:false`"}`,
                            allowedMentions:{parse:[]}
                        })
                    } else if (reactable) {
                        // await msg.react('🛑');
                        await msg.react('⚠️');
                        return await msg.react(scamEmoji);
                    }
                }
            }

            // Check for the user leaking their address via metadata
            if (msg.attachments.size > 0) {
                const user = await userByObj(msg.author);
                if (user.config.attachmentProtection) {
                    const blacklistedFileTypes = Object.keys(filetypeScanners);
                    const attachments = Array.from(msg.attachments.values());

                    const blacklistedAttachments = attachments.filter(att => blacklistedFileTypes.includes(att.contentType));

                    if (blacklistedAttachments.length === 0) return;

                    const leakedNames = [];

                    for (const attachment of blacklistedAttachments) {
                        const scanner = filetypeScanners[attachment.contentType];
                        let leaks = null;

                        try {
                            leaks = await scanner(attachment);
                        } catch (error) {
                            console.error(`Error scanning attachment ${attachment.name}:`, error);
                        }

                        if (leaks === true) {
                            leakedNames.push(attachment.name);
                        }
                    }

                    const hasLeaked = leakedNames.length > 0;

                    if (!hasLeaked) return;

                    const canDelete = sendable && 
                        ("permissionsFor" in msg.channel) &&
                        msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.ManageMessages);

                    if (canDelete) {
                        await msg.delete().catch(() => {});

                        let message = 
                            `<@${msg.author.id}> I deleted your message because the following attachments contained sensitive metadata (e.g. the GPS/location the photo was taken): \`${leakedNames.join('`, `')}\`\n` +
                            // @ts-ignore
                            `-# You can prevent this feature by running ${cmds.personal_config.mention}\n`;
                        
                        if (msg.content) 
                            message += 
                                `\n` +
                                `Below is the original message from <@${msg.author.id}>:\n` + 
                                `>>> ` + limitLength(await censor(msg.content, msg.guild, true), 2000 - (message.length + 200));

                        await msg.channel.send({
                            content: message,
                            allowedMentions: { users: [msg.author.id] }
                        });
                    } else {
                        await msg.author.send({
                            content: `⚠️ WARNING: \n` +
                                    `The attachments you uploaded in <#${msg.channel.id}> contain sensitive data (e.g., the GPS/location the photo was taken): ${leakedNames.join(', ')}\n` +
                                    `I suggest deleting your message.\n` +
                                    `\n` +
                                    `I tried to delete it myself, but do not have sufficient permissions in the server (\`Manage_Messages\`).\n` +
                                    // @ts-ignore
                                    `-# You can prevent this feature by running ${cmds.personal_config.mention}`
                        }).catch(() => {});
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