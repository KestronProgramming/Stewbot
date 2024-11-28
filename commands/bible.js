// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

const bible=require("../data/kjv.json");
var Bible={};
var properNames={};
Object.keys(bible).forEach(book=>{
    properNames[book.toLowerCase()]=book;
    Bible[book.toLowerCase()]=bible[book];//Make everything lowercase for compatibility with sanitizing user input
});

const Fuse = require('fuse.js');
const bookNames = Object.keys(Bible);
const fuseOptions = {
    includeScore: true,
    keys: ['item']
};
function sortByMatch(items, text) {
    const fuse = new Fuse(items.map(item => ({ item })), fuseOptions);            
    const scoredResults = fuse.search(text)
        .filter(result => result.score <= 2) // Roughly similar-ish
        .sort((a, b) => a.score - b.score);
    return scoredResults.map(entry => entry.item.item);
}

function capitalize(name) {
    // return (name[0]?.toUpperCase() || "") + name.substring(1)
    return name.replace(/\b(\w)/g, (match) => match.toUpperCase())
}


module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("bible").setDescription("Look up a verse or verses in the King James version of the Bible")
            .addStringOption(option=>
                option.setName("book").setDescription("What book of the Bible do you wish to look up?").setRequired(true)
                .setMaxLength(20)
                .setAutocomplete(true)
            ).addIntegerOption(option=>
                option.setName("chapter").setDescription("Which chapter do you want to look up?").setRequired(true)
            ).addStringOption(option=>
                option.setName("verse").setDescription("What verse or verses do you want to look up? (Proper format for multiple verses is '1-3')").setRequired(true)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
            "helpCategory":"Informational",
            "helpDesc":"Look up one or more verses in the King James Bible"
        },
	},

	async execute(cmd, context) {
		applyContext(context);

        const verse = cmd.options.getString("verse");
        const chapter = cmd.options.getInteger("chapter");
        const providedBookname = cmd.options.getString("book");
        const book = sortByMatch(bookNames, providedBookname.toLowerCase())?.[0];

        if (!book) {
            return cmd.followUp(`I'm sorry, I couldn't find \`${providedBookname}\`. Are you sure it exists?`);
        }

        if(verse.includes("-")&&+verse.split("-")[1]>+verse[0]){
            try{
                let verses=[];
                for(var v=+verse.split("-")[0];v<+verse.split("-")[0]+5&&v<+verse.split("-")[1];v++){
                    verses.push(Bible[book][chapter][v]);
                }
                if(verses.join(" ")===undefined){ 
                    cmd.followUp(`I'm sorry, I don't think that passage exists - at least, I couldn't find it. Perhaps something is typoed?`);
                }
                else{
                    cmd.followUp({content:`${properNames[book]} ${chapter}:${verse}`,embeds:[{
                        "type": "rich",
                        "title": `${properNames[book]} ${chapter}:${verse}`,
                        "description": verses.join(" "),
                        "color": 0x773e09,
                        "footer": {
                            "text": `King James Version`
                        }
                    }]});
                }
            }
            catch(e){
                cmd.followUp(`I'm sorry, I don't think that passage exists - at least, I couldn't find it. Perhaps something is typoed?`);
            }
        }
        else{
            try{
                if(Bible[book][chapter][+verse]!==undefined){
                    cmd.followUp({content:`${properNames[book]} ${chapter}:${verse}`,embeds:[{
                        "type": "rich",
                        "title": `${properNames[book]} ${chapter}:${verse}`,
                        "description": Bible[book][chapter][+verse],
                        "color": 0x773e09,
                        "footer": {
                            "text": `King James Version`
                        }
                    }]});
                }
                else{
                    cmd.followUp(`I'm sorry, I couldn't find \`${book} ${chapter}:${verse}\`. Are you sure it exists? Perhaps something is typoed.`);
                }
            }
            catch(e){
                cmd.followUp(`I'm sorry, I couldn't find \`${book} ${chapter}:${verse}\`. Are you sure it exists? Perhaps something is typoed.`);
            }
        }   
	},

    async autocomplete(cmd) {
		let allBooks = bookNames;
        const userInput = cmd.options.getFocused() || "";

        // Get the top matching results
        if (userInput) {
            allBooks = sortByMatch(allBooks, userInput);
        }

        // Limit to discord max
        allBooks = allBooks.slice(0, 25)

        // Format for discord
        autocompletes = []
        for (let bookname of allBooks) {
            const sugguest = capitalize(bookname)
            autocompletes.push({
                name: sugguest,
                value: sugguest
            })
        }

        cmd.respond(autocompletes);
	}
};
