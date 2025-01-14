// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("define").setDescription("Get the definition for a word").addStringOption(option=>
                option.setName("what").setDescription("What to define").setRequired(true)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ),
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},
		
		// Optional fields
		requiredGlobals: [],

		help: {
			helpCategories: ["Information","General"],
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
			shortDesc: "Get the definition for a word",
			detailedDesc: 
				`Look up the specified word in the dictionary and view the definitions.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
        fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what")).then(d=>d.json()).then(d=>{
            d = d[0];
            
            if (d?.meanings) {
                if(checkDirty(cmd.guild?.id,d.word)||checkDirty(config.homeServer,d.word)){
                    cmd.followUp({content:"I am not able to provide a definition for that word.",ephemeral:true});
                    return;
                }

                let defs = [];
                for (var i = 0; i < d.meanings.length; i++) {
                    for (var j = 0;j < d.meanings[i].definitions.length;j++) {
                        let foundOne=checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].example)||checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].definition)||checkDirty(config.homeServer,d.meanings[i].definitions[j].example)||checkDirty(config.homeServer,d.meanings[i].definitions[j].definition);
                        defs.push({
                            name:"Type: " +d.meanings[i].partOfSpeech,
                            value:foundOne?"Blocked definition":d.meanings[i].definitions[j].definition+(d.meanings[i].definitions[j].example?"\nExample: " +d.meanings[i].definitions[j].example:""),
                            inline: true
                        });
                    }
                }
                cmd.followUp({embeds:[{
                    type: "rich",
                    title: "Definition of "+d.word,
                    description: d.origin,
                    color: 0x773e09,
                    fields: defs.slice(0,25),
                    footer: {
                        text: d.phonetic,
                    }
                }]});
            }
            else { 
                cmd.followUp("I'm sorry, I didn't find a definition for that");
            }
        }).catch(e=>{
            notify(1, "Dictionary error: " + String(e));
            cmd.followUp("I'm sorry, I didn't find a definition for that");
        });
    },
};
