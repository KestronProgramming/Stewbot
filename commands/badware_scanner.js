// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, DiscordAPIError, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

// const exif = require('exif-parser'); // We could check if it has sensitive data before
// const sharp = require("sharp")
const heicConvert = require('heic-convert');

// Attachment leak-checkers
const filetypeCleaners = {
    'image/heic': async (attachment) => {
        try {
            const response = await fetch(attachment.url);
            const buffer = await getBufferFromFetch(response);

            // Sharp doesn't do heic apparently
            // const convertedBuffer = await sharp(buffer)
            //     .jpeg({ quality: 90 })
            //     .toBuffer();

            const convertedBuffer = await heicConvert({
                buffer: buffer,
                format: 'JPEG',
                quality: 0.7
            });
            
            return {
                filename: attachment.name.replace(/\.heic$/i, '.jpg'),
                buffer: convertedBuffer,
                leaked: true, // this needs further support...
            };
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
const { limitLength } = require("../utils.js")
const config = require("../data/config.json");

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
     * @param {import("./modules/database.js").GuildUserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context, guildStore, guildUserStore) {
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
                    const blacklistedFileTypes = Object.keys(filetypeCleaners);
                    const attachments = Array.from(msg.attachments.values());
                
                    const needsStripping = attachments.some(att => 
                        blacklistedFileTypes.includes(att.contentType));
                
                    if (needsStripping) {
                        // If we have permission to delete
                        if (
                            sendable && 
                            ("permissionsFor" in msg.channel) &&
                            msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.ManageMessages) &&
                            msg.channel.permissionsFor(client.user).has(PermissionFlagsBits.AttachFiles)
                        ) {
                            
                            let cleanedAttachments = [];
                            let tooLargeAttachments = [];
                            const MAX_SIZE = 8 * 1024 * 1024; // 8MB in bytes
                    
                            for (const attachment of attachments) {
                                const cleaner = filetypeCleaners[attachment.contentType];
                                let cleaned = null;
                        
                                if (cleaner) {
                                    try {
                                        cleaned = await cleaner(attachment);
                                        
                                        // Check if the cleaned attachment is too large
                                        if (cleaned && cleaned.buffer.length > MAX_SIZE) {
                                            tooLargeAttachments.push(attachment.name);
                                            cleaned = null; // Don't include this attachment
                                        }
                                    } catch (error) {
                                        console.error(`Error cleaning attachment ${attachment.name}:`, error);
                                        tooLargeAttachments.push(attachment.name);
                                    }
                                }

                                if (cleaned) {
                                    cleanedAttachments.push(cleaned);
                                } else if (!blacklistedFileTypes.includes(attachment.contentType)) {
                                    // Pass through non-cleaned or unsupported files that don't need stripping
                                    try {
                                        const res = await fetch(attachment.url);
                                        const buffer = await getBufferFromFetch(res);
                                        
                                        // Check if the non-cleaned attachment is too large
                                        if (buffer.length <= MAX_SIZE) {
                                            cleanedAttachments.push({
                                                buffer,
                                                filename: attachment.name
                                            });
                                        } else {
                                            tooLargeAttachments.push(attachment.name);
                                        }
                                    } catch (error) {
                                        console.error(`Error fetching attachment ${attachment.name}:`, error);
                                        tooLargeAttachments.push(attachment.name);
                                    }
                                }
                            }
                    
                            await msg.delete().catch(e => {});

                            let message = 
                                `<@${msg.author.id}> your attachments contained sensitive data (e.g. the GPS/location the photo was taken), I have cleaned them and reuploaded your attachments.\n` +
                                // @ts-ignore
                                `-# You can prevent this feature by running ${cmds.personal_config.mention}\n`;
                            
                            // Add warning about files that were too large
                            if (tooLargeAttachments.length > 0) {
                                message += `\n⚠️ The following files were too large to process automatically (>8MB) and need to be converted manually: ${tooLargeAttachments.join(', ')}\n`;
                            }
                            
                            if (msg.content) 
                                message += 
                                    `\n` +
                                    `Below is the original message from <@${msg.author.id}>:\n` + 
                                    `>>> ` + limitLength(msg.content, 1700);

                            await msg.channel.send({
                                content: message,
                                files: cleanedAttachments.map(f => ({
                                    attachment: f.buffer,
                                    name: f.filename
                                }))
                            });
                        }

                        // if we can't delete, DM
                        else {
                            await msg.author.send({
                                content: `⚠️ WARNING: \n` +
                                        `The attachments you uploaded in <#${msg.channel.id}> are of a filetype that discord cannot process.\n` +
                                        `These filetypes can contain data (e.g., the GPS/location the photo was taken). I suggest deleting your message and converting to a more standard format.\n` +
                                        `\n` +
                                        `I tried to clean them myself, but do not have sufficient permissions in the server (\`Manage_Messages\`).\n` +
                                        // @ts-ignore
                                        `-# You can prevent this feature by running ${cmds.personal_config.mention}`
                            });
                        }
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
