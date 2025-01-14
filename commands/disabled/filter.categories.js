
// This was meant as a way to filter words based on context and other NLP stuff but seemed like there wasn't much use to it
// besides not filtering abbreviations, which I already kinda fixed in the filter now



// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

// Dev into:
/* 
Filter is stored as an array at "storage[cmd.guildId].filter.blacklist"
Filter accepts string objects for straight words to filter,
 or json objects in the format of {word:"...", whitelist_categories:[...], blacklist_categories:[...]}
Whitelist and blacklist should not be defined together, only one works at a time
*/

const Fuse = require('fuse.js');
const compromise = require("compromise")
const fuseOptions = {
    includeScore: true,
    keys: ['item']
};
const maxShownItems = 25

function normalizeSplit(stringList) {
    // Split categories into arrays
    if (!stringList) return null;
    try {
        let categories = stringList.split(",");
        categories = categories.map(cat => {
            cat = cat
                .toLowerCase()
                .match(/\w/g)
                ?.join("");
            cat = (cat?.[0]?.toUpperCase() || "") + (cat?.slice(1) || "");
            return cat
        })
        categories = categories.filter(c => c && filterTypes.includes(c))
        return categories;
    } catch (e) {
        return null;
    }
}

function filterSettingsContains(settings, word) {
    // Check if the filter object contains a word - either as json or directly
    for (const [index, item] of settings.entries()) {
        if (typeof(item) == 'object') {
            if (item.word == word) return [item, index]
        }
        else {
            if (item == word) return [item, index]
        }
    }
    return [null, null]
}

// Available tags per   `console.log(Object.keys(require('compromise').model().one.tagSet))`
// Start line with // remove as options (this way you can ctrl+/ it)

const filterTypes = [
    // "Hyphenated",
    // "Prefix",
    // "There",
    // "Condition",
    // "Negative",
    "Acronym",
    // "Email",
    // "SlashedTerm",
    "Emoticon",
    "Emoji",
    // "HashTag",
    // "PhoneNumber",
    "Url",
    "Abbreviation",
    "Expression",
    // "QuestionWord",
    "Preposition",
    "Conjunction",
    // "Determiner",
    "Adverb",
    // "NumberRange",
    "Adjective",
    // "Superlative",
    // "Comparative",
    // "Comparable",
    // "Date",
    // "Duration",
    // "Time",
    // "Timezone",
    // "Season",
    // "Holiday",
    // "FinancialQuarter",
    // "Year",
    // "WeekDay",
    // "Month",
    // "Value",
    // "Percent",
    // "NumericValue",
    // "TextValue",
    // "Multiple",
    // "Fraction",
    // "Cardinal",
    // "Money",
    // "RomanNumeral",
    // "Ordinal",
    "Verb",
    // "Passive",
    // "PhrasalVerb",
    // "Particle",
    // "Auxiliary",
    // "Modal",
    // "Copula",
    // "FutureTense",
    // "PastTense",
    // "Participle",
    // "Imperative",
    // "PresentTense",
    // "Gerund",
    // "Infinitive",
    // "Address",
    "Noun",
    // "AtMention", // <-- Interesting 
    // "Currency",
    // "Possessive",
    "Demonym",
    // "Unit",
    // "Activity",
    "Actor",
    "Pronoun",
    // "Reflexive",
    // "Uncountable",
    // "Plural",
    "ProperNoun",
    "Organization",
    // "Company",
    // "School",
    // "SportsTeam",
    // "Singular",
    // "Place",
    // "Region",
    "City",
    "Country",
    "Person",
    // "Honorific",
    // "LastName",
    // "FirstName",
    // "FemaleName",
    // "MaleName",
];

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
                ).addStringOption(option=>
                    option.setName("blacklist_categories").setDescription("Only filter the word when used in this context (comma-separated list)").setAutocomplete(true).setRequired(false)
                ).addStringOption(option=>
                    option.setName("whitelist_categories").setDescription("Filter the word except when it is used in this context (comma-separated list)").setAutocomplete(true).setRequired(false)
                ).addBooleanOption(option=>
                    option.setName("remove_category_filter").setDescription("Remove a previously set whitelist/blacklist from this command?").setRequired(false)
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
		requiredGlobals: ["finTimer"],

		help: {
			helpCategory: "Administration",
			helpDesc: "Configure different options for the filter, which will remove configurably blacklisted words",
			helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);        
		
        if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
            storage[cmd.guildId].filter.active=false;
            cmd.followUp(`I cannot run a filter for this server. I need the MANAGE_MESSAGES permission first, otherwise I cannot delete messages.`);
            return;
        }
        switch(cmd.options.getSubcommand()){
            case "add":
                const blacklist_categories = normalizeSplit(cmd.options.getString("blacklist_categories"));
                const whitelist_categories = normalizeSplit(cmd.options.getString("whitelist_categories"));
                const filterWord = cmd.options.getString("word");
                const removingCategoryFilter = cmd.options.getBoolean("remove_category_filter") || false;
                let addResponse = "";

                if (blacklist_categories && whitelist_categories) {
                    return cmd.followUp(`You cannot specify a blacklist and a whitelist at the same time.\nA blacklist allows *all* but specified categories, a whitelist allows *none* but specified categories`);
                }

                // Check if it exists + grab reference for later
                let [currentFilterItem, currentFilterItemIndex] = filterSettingsContains(storage[cmd.guildId].filter.blacklist, filterWord);

                // TODO: I feel like this code is extremely repetitive but I'm doing too much else to bother fixing rn
                if (currentFilterItem) {
                    // If this is a string turn it into the new json object form
                    if (typeof(currentFilterItem) == 'string') {
                        storage[cmd.guildId].filter.blacklist.splice(currentFilterItemIndex, 1);
                        currentFilterItem = {word: currentFilterItem} // replace with json reference
                        storage[cmd.guildId].filter.blacklist.push(currentFilterItem);
                    }

                    // If we're updating the category filter 
                    if ((blacklist_categories || whitelist_categories) && (blacklist_categories || whitelist_categories).length > 0) {
                        // Check if we are overriding a former whitelist with a blacklist or vice versa, or just updating the categories
                        if (currentFilterItem?.whitelist_categories && blacklist_categories) {
                            addResponse += `Previously this word had this whitelist: \`${currentFilterItem?.whitelist_categories.join(", ")}\`, which is now being overwritten with a blacklist.`
                        }
                        else if (currentFilterItem?.blacklist_categories && whitelist_categories) {
                        } else if (currentFilterItem?.blacklist_categories || currentFilterItem?.whitelist_categories) {
                            addResponse += `Updated this word's categories filter from \`${(currentFilterItem?.blacklist_categories || currentFilterItem?.whitelist_categories).join(", ")}\` to \`${(blacklist_categories || whitelist_categories).join(", ")}\` `
                        } else {
                            addResponse += `Added the category filter of \`${(blacklist_categories || whitelist_categories).join(", ")}\` this this word.`
                        }
                        delete currentFilterItem["whitelist_categories"];
                        delete currentFilterItem["blacklist_categories"];
                        currentFilterItem[whitelist_categories?"whitelist_categories":"blacklist_categories"] = (whitelist_categories || blacklist_categories);    
                    }
                    // If we're taking off the category filter
                    else if (removingCategoryFilter) {
                        previousFilterType = currentFilterItem["whitelist_categories"] 
                            ? "whitelist"
                            : currentFilterItem["blacklist_categories"]
                                ? "blacklist"
                                : null
                        if (!previousFilterType) {
                            addResponse += `No category filters were set on this word.`
                        } else {
                            addResponse += `Removing the category ${previousFilterType} for this word, which was previously set to: \`${currentFilterItem[previousFilterType+"_categories"].join(", ")}\``
                            delete currentFilterItem[previousFilterType+"_categories"];
                        }
                    }
                    // No action preformed...
                    else {
                        addResponse += `This word is already in the filter.`
                    }
                }
                // Adding new word to filter
                else {
                    const newData = {word:filterWord}
                    storage[cmd.guildId].filter.blacklist.push(newData)

                    addResponse += `Added ||${filterWord.replaceAll("|", "\\|")}|| to the filter for this server`

                    if (whitelist_categories || blacklist_categories) {
                        newData[whitelist_categories?"whitelist_categories":"blacklist_categories"] = (whitelist_categories || blacklist_categories);
                        addResponse += ` with those category limitations`
                    }
                    addResponse += `.`
                }
                
                // Add inactive filter warning
                if (!storage[cmd.guildId].filter.active) {
                    addResponse += `\n\nThe filter for this server is currently **disabled**. To enable it, use ${cmds.filter.config.mention}.`
                }
                cmd.followUp({content: addResponse})

            break;
            case "remove":
                if(storage[cmd.guildId].filter.blacklist.includes(cmd.options.getString("word"))){
                    storage[cmd.guildId].filter.blacklist.splice(storage[cmd.guildId].filter.blacklist.indexOf(cmd.options.getString("word")),1);
                    cmd.followUp(`Alright, I have removed ||${cmd.options.getString("word")}|| from the filter.`);
                    
                }
                else{
                    cmd.followUp(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use ${cmds.view_filter.mention} to see all filtered words.`);
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

    async autocomplete(cmd) {
        // TODO: this should auto-fetch categories belonging to a word if the word has been entered into the word field yet and is known in this server

        const inputSoFar = cmd.options.getFocused() || ""

        // Extract tag info for filtering
        const nextTagIndex = inputSoFar.match(/(?<=(,|^))(\w|\s)*$/)?.index || 0;
        const otherTags = inputSoFar.substring(0,nextTagIndex).split(",");
        // const lastTag = otherTags?.slice(-1)?.[0] || "";
        const thisTagTyped = inputSoFar.substring(nextTagIndex).trim();

        let options = [...filterTypes]; // clone

        // Code from another bot of mine using autocomplete I am working on porting:

        // Filter if they've started typing on this tag (after ",")
        if (thisTagTyped) {
            // Fuzzy match
            const fuse = new Fuse(options.map(item => ({ item })), fuseOptions);            
            const scoredResults = fuse.search(thisTagTyped).sort((a, b) => a.score - b.score);
            options = scoredResults.map(entry => entry.item.item);
            // Remove currently select tags from options
            options = options.filter(cat => !otherTags.includes(cat))
        }

        // Format for discord
        autocompletes = []
        for (const [index, category] of options.entries()) {
            const data = otherTags.join(", ") + category + ", ";
            autocompletes.push({
                name: data,
                value: data
            })
            if (index == maxShownItems && options.length > maxShownItems) {
                autocompletes.push({ name: `... (${options.length-(maxShownItems-1)} more not shown)`, value: ""})
                break
            }
        }

        // console.log(autocompletes);
        cmd.respond(autocompletes);
    }
};
