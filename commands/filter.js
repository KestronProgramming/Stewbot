// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

// NOTE:
// This is a PRIORITY module. 
// That means this module will be run before any others
// 
// Impacts:
//  1. This module's onmessage handler sets a msg.filtered attribute on the msg object
//     that can be used elsewhere in the code.


const leetMap = require("../data/filterLeetmap.json");

// This is a function built to support regex filters, which are currently not implemented
function verifyRegex(regexStr) {
    // returns: [isValid, error]

    // Check for backtracing
    if (!safe(regexStr)) {
        return [false, "This regex has catastrophic backtracking, please improve the regex and try again"]
    }

    // Check for RE2 compatibility
    try {
        new RE2(regexStr, 'ui');
    } catch {
        return [false, "This regex is invalid or uses features unsupported by [RE2](https://github.com/google/re2-wasm)"]
    }
    return [true, "Added to the filter."];

    // TODO evaluate user regexes like this:
    // const regex = new RE2(userProvidedRegex, 'ui'); // TODO: figure out some system for flags - i should default on but some uses cases may need it off
    // const result = regex.exec(msg.content);
    // console.beta(result);
}

function escapeRegex(input) {
    return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function defangURL(message) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlPattern, (url) => {
        return url.replace(/:\/\//g, '[://]').replace(/\./g, '[.]');
    });
}

global.checkDirty = function(guildID, what, filter=false, applyGlobalFilter=false) { // This function is important enough we can make it global
    // If filter is false, it returns: hasBadWords
    // If filter is true, it returns [hadBadWords, censoredMessage, wordsFound]

    const originalContent = what; // Because we're preprocessing content, if the message was clean allow the original content without preprocessing 

    if (!guildID || !what) 
        if (!filter) return false
        else [false, what, []]

    // Preprocessing - anything here is destructive and will be processed this way if filtered
    what = String(what).replace(/<:(\w+):[0-9]+>/g, ":$1:") // unsnowflake emojis
    what = what.replace(/[\u200B-\u200D\u00AD]/g, ""); // strip 0-widths
    what = what.normalize("NFKD"); // unicode variants
    what = what.replace(/(\s)\s+/g, "$1"); // collapse spacing

    let dirty = false;
    let foundWords = []; // keep track of all filtered words to later tell the user what was filtered

    // Mostly for stewbot-created content (like AI), filter from both our and their server
    let blacklist = storage[guildID]?.filter?.blacklist;
    if (applyGlobalFilter) {
        const globalBlacklist = storage[config.homeServer]?.filter?.blacklist || [];
        blacklist = [...new Set([...(blacklist || []), ...globalBlacklist])];
    }

    if (blacklist) for (blockedWord of blacklist) {
        // Ignore the new beta json format for now
        if (typeof(blockedWord) !== 'string') {
            continue
        }

        // Unsnowflake blocked word to match unsnowflaked message
        blockedWord = blockedWord.replace(/<:(\w+):[0-9]+>/g, ":$1:");
        
        let blockedWordRegex;
        try {
            let word = escapeRegex(blockedWord)

            // More flexible matching
            if (word.length > 3) {
                for (let key in leetMap) { // Leet processing
                    if (leetMap.hasOwnProperty(key)) {
                        const replacement = leetMap[key];
                        word = word.replaceAll(key, replacement)
                    }
                }
                
                // This rule needs a ton more work, things like '(A|4|@|\\()\\(B\\|C\\+\\)\\+D' break it
                // word = word.replace(/(?:\\\S)|(?:\([^()]+\))|./g, '$1.{0,1}');

                word = word+"(ing|s|ed|er|ism|ist|es|ual)?" // match variations
            }
            blockedWordRegex = new RegExp(`(\\b|^)${word}(\\b|$)`, "ig")
        } catch (e) {
            // This should only ever be hit on old servers that have invalid regex before the escapeRegex was implemented
            if (!e?.message?.includes?.("http")) notify(1, "Caught filter error:\n" + JSON.stringify(e.message) + "\n" + e.stack);
            // We can ignore this filter word
            continue
        }

        // Check for the word 
        if (blockedWordRegex.test(what) || what === blockedWord) {
            dirty = true;
            if (!filter) {
                return true;
            }
            else {
                foundWords.push(blockedWord)
                what = what.replace(blockedWordRegex, "[\\_]");
            }
        }
    }

    if (!filter) {
        // If we passed the check without exiting, it's clean
        return false;
    } 
    else {
        // If we're filtering, it needs a more structured output

        // Additional sanitization content
        if (dirty) {
            what = defangURL(what)
        } else {
            what = originalContent; // Put snowflakes back how they were
        }
        
        return [dirty, what, foundWords];
    }
};


module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("filter").setDescription("Manage the filter for this server").addSubcommand(command=>
            command.setName("config").setDescription("Configure the filter for this server").addBooleanOption(option=>
                    option.setName("active").setDescription("Should I remove messages that contain words configured in the blacklist?").setRequired(true)
                ).addBooleanOption(option=>
                    option.setName("censor").setDescription("Should I remove the filtered words from the message (true), or delete the message entirely (false)?")
                ).addBooleanOption(option=>
                    option.setName("log").setDescription("Post a summary of filtered messages to a staff channel? (Must set 'channel' on this command if true)")
                ).addChannelOption(option=>
                    option.setName("channel").setDescription("Which channel should I post summaries of deleted messages to?").addChannelTypes(ChannelType.GuildText)
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                )
            ).addSubcommand(command=>
                command.setName("add").setDescription('Add a word to the filter').addStringOption(option=>
                    option.setName("word").setDescription("The word to blacklist").setRequired(true)
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                )
            ).addSubcommand(command=>
                command.setName("remove").setDescription('Remove a word from the filter').addStringOption(option=>
                    option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                )
            ).addSubcommand(command=>
                command.setName("import").setDescription("Import a CSV wordlist").addAttachmentOption(option=>
                    option.setName("file").setDescription("A .csv with comma seperated words you'd like to block").setRequired(true)
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                )
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        
        extra: {"contexts":[0],"integration_types":[0],"cat":6},
            
		// Optional fields
		requiredGlobals: [],

        priority: 0,

		help: {
            config:{
                helpCategories: ["General","Administration","Configuration","Server Only","Safety"],
                /*
                    - General
                    - Information
                    - Bot
                    - Administration
                    - Configuration
                    - Entertainment
                    - Context Menu
                    - Other/Misc
                    - Server Only
                    - User Install Only
                */
                shortDesc: "Manage the filter for this server",
                detailedDesc: 
                    `Configure an automatic filter for this server, Stewbot allows you to censor messages without deleting them all the way.`
            },
            add:{
                helpCategories: ["Administration","Configuration","Server Only"],
                /*
                    - General
                    - Information
                    - Bot
                    - Administration
                    - Configuration
                    - Entertainment
                    - Context Menu
                    - Other/Misc
                    - Server Only
                    - User Install Only
                */
                shortDesc: "Add a word to the filter",
                detailedDesc: 
                        `Add the specified word to the filter for Stewbot to delete or censor on sight`
            },
            remove:{
                helpCategories: ["Administration","Configuration","Server Only"],
                /*
                    - General
                    - Information
                    - Bot
                    - Administration
                    - Configuration
                    - Entertainment
                    - Context Menu
                    - Other/Misc
                    - Server Only
                    - User Install Only
                */
                shortDesc: "Remove a word from the filter",
                detailedDesc: 
                    `Remove the specified from the filter and allow posts to contain that word once more`
            },
            import:{
                helpCategories: ["Administration","Configuration","Server Only"],
                /*
                    - General
                    - Information
                    - Bot
                    - Administration
                    - Configuration
                    - Entertainment
                    - Context Menu
                    - Other/Misc
                    - Server Only
                    - User Install Only
                */
                shortDesc: "Import a CSV wordlist",
                detailedDesc: 
                    `Import a .csv file containing a list of words seperated by commas to block. You can generate one from another server's filter using the ${cmds.view_filter.mention} command.`
            }
		},
	},

	async execute(cmd, context) {
		applyContext(context);

        const word = cmd.options.getString("word");
		
        if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
            storage[cmd.guildId].filter.active=false;
            cmd.followUp(`I cannot run a filter for this server. I need the MANAGE_MESSAGES permission first, otherwise I cannot delete messages.`);
            return;
        }
        switch(cmd.options.getSubcommand()){
            case "add":
                if (storage[cmd.guildId].filter.blacklist.includes(word)) {
                    cmd.followUp({
                        "ephemeral": true,
                        "content": `The word ||${word}|| is already in the blacklist.${storage[cmd.guildId].filter.active ? "" : `To begin filtering in this server, use ${cmds.filter.config.mention}.`}`
                    });
                } else {
                    storage[cmd.guildId].filter.blacklist.push(word);
                    cmd.followUp(`Added ||${word}|| to the filter for this server.${storage[cmd.guildId].filter.active ? "" : `\n\nThe filter for this server is currently disabled. To enable it, use ${cmds.filter.config.mention}.`}`);
            
                    try {
                        const existingRules = await cmd.guild.autoModerationRules.fetch();
                        let profileRule = existingRules.find(rule => rule.triggerType === 6);
            
                        // Try blocking this word from member profiles with AutoMod
                        if (!profileRule) {
                            await cmd.guild.autoModerationRules.create({
                                name: `Stewbot Profile Filter`,
                                creatorId: client.user.id,
                                enabled: true,
                                eventType: 2,
                                triggerType: 6,
                                triggerMetadata: {
                                    keywordFilter: [word],
                                },
                                actions: [{
                                    type: 4,
                                }]
                            });
                        } else {
                            // Rebrand the rule to us if they already have one
                            if (profileRule.name !== 'Stewbot Profile Filter') {
                                await profileRule.edit({
                                    name: 'Stewbot Profile Filter',
                                    enabled: true,
                                    actions: [{
                                        type: 4,
                                    }]
                                });
                            }
            
                            // Update existing rule
                            const updatedKeywords = new Set([
                                ...(profileRule.triggerMetadata.keywordFilter || []),
                                word,
                            ]);
            
                            await profileRule.edit({
                                triggerMetadata: {
                                    keywordFilter: Array.from(updatedKeywords),
                                },
                                enabled: true,
                            });
                        }
                    } catch (error) {
                        if (error.code !== 50001) {
                            throw error;
                        }
                    }
                }
                break;
            case "remove":
                if(storage[cmd.guildId].filter.blacklist.includes(word)){
                    storage[cmd.guildId].filter.blacklist.splice(storage[cmd.guildId].filter.blacklist.indexOf(word),1);
                    cmd.followUp(`Alright, I have removed ||${word}|| from the filter.`);
                }
                else{
                    cmd.followUp(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use ${cmds.view_filter.mention} to see all filtered words.`);
                }

                // Remove the word from our username profile filter
                try {
                    const existingRules = await cmd.guild.autoModerationRules.fetch();
                    let profileRule = existingRules.find(rule => rule.triggerType === 6 && rule.name === 'Stewbot Profile Filter');
                    if (profileRule) {
                        const updatedKeywords = new Set(profileRule.triggerMetadata.keywordFilter || []);
                        updatedKeywords.delete(word);

                        await profileRule.edit({
                            triggerMetadata: {
                                keywordFilter: Array.from(updatedKeywords),
                            }
                        });
                    }
                } catch (error) {
                    if (error.code !== 50001) {
                        throw error;
                    }
                }

            break;
            case "config":
                var disclaimers=[];
                storage[cmd.guildId].filter.active=cmd.options.getBoolean("active");
                if(cmd.options.getBoolean("censor")!==null) storage[cmd.guildId].filter.censor=cmd.options.getBoolean("censor");
                if(cmd.options.getBoolean("log")!==null) storage[cmd.guildId].filter.log=cmd.options.getBoolean("log");
                if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].filter.channel=cmd.options.getChannel("channel").id;
                
                if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)&&storage[cmd.guildId].filter.censor){
                    storage[cmd.guildId].filter.censor=false;
                    disclaimers.push(`I cannot run censoring for this server, I need the MANAGE_WEBHOOKS permission first, otherwise I can't post a censored version.`);
                }
                if(storage[cmd.guildId].filter.channel===""&&storage[cmd.guildId].filter.log){
                    storage[cmd.guildId].filter.log=false;
                    disclaimers.push(`No channel was set to log summaries of deleted messages to, so logging these is turned off.`);
                }
                else if(storage[cmd.guildId].filter.log&&!client.channels.cache.get(storage[cmd.guildId].filter.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    storage[cmd.guildId].filter.log=false;
                    disclaimers.push(`I cannot send messages to the specified log channel for this server, so logging deleted messages has been turned off.`);
                }
                cmd.followUp(`Filter configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
            break;
            case "import":
                fetch(cmd.options.getAttachment("file").attachment).then(d=>d.text()).then(d=>{
                    var badWords=d.split(",");
                    let addedWords=[];
                    badWords.forEach(word=>{
                        if(!storage[cmd.guildId].filter.blacklist.includes(word)){
                            storage[cmd.guildId].filter.blacklist.push(word);
                            addedWords.push(word);
                        }
                    });
                    cmd.followUp(addedWords.length>0?limitLength(`Added the following words to the blacklist:\n- ||${addedWords.join("||\n- ||")}||`):`Unable to add any of the words to the filter. Either there aren't any in the CSV, it's not formatted right, or all of the words are in the blacklist already.`);
                    
                });
            break;
        }
    },

    async onmessage(msg, context) {
		applyContext(context);

        // Filter
        if(storage[msg.guildId]?.filter.active){
            let [filtered, filteredContent, foundWords] = checkDirty(msg.guildId, msg.content, true)

            if(filtered && msg.webhookId===null){
                msg.ogContent = msg.content;
                msg.content = filteredContent;

                storage[msg.guildId].users[msg.author.id].infractions++;
                msg.delete();
                if(storage[msg.guildId].filter.censor){
                    var replyBlip="";
                    if(msg.type===MessageType.Reply){
                        var rMsg=await msg.fetchReference();
                        replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"").replace(/\@/ig,"[@]")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_\n`;
                    }

                    const filteredMessageData = {
                        "username": msg.member?.nickname||msg.author.globalName||msg.author.username,
                        "avatarURL": msg.member?.displayAvatarURL(),
                        "content": limitLength(`\`\`\`\nThe following message from ${msg.author.username} has been censored by Stewbot.\`\`\`${replyBlip}${msg.content.slice(0,1800)}`),
                    }

                    sendHook(filteredMessageData, msg);
                }
                if(storage[msg.author.id].config.dmOffenses&&msg.webhookId===null){
                    try{msg.author.send(limitLength(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to the following word${foundWords.length>1?"s":""} being in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.ogContent.replaceAll("`","\\`")+"```":""}`)).catch(e=>{});}catch(e){}
                }
                if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                    var c=client.channels.cache.get(storage[msg.guildId].filter.channel);
                    if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send(limitLength(`I have ${storage[msg.guildId].filter.censor?"censored":"deleted"} a message from **${msg.author.username}** in <#${msg.channel.id}> for the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.ogContent.replaceAll("`","\\`").replaceAll(/(?<=https?:\/\/[^(\s|\/)]+)\./gi, "[.]").replaceAll(/(?<=https?):\/\//gi, "[://]")}\`\`\``));
                    }
                    else{
                        storage[msg.guildId].filter.log=false;
                    }
                }
                
                return;
            }
        }

        // Set a flag for other modules to reference
        const messageFiltered = Boolean(msg.ogContent);
        msg.filtered = messageFiltered;
    }
};
