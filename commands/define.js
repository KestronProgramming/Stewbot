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
			helpCategory: "Informational",
			helpDesc: "Defines a word",
			helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
        fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what")).then(d=>d.json()).then(d=>{
            d = d[0];
            
            if (d?.meanings) {
                if(checkDirty(cmd.guild?.id,d.word)){
                    cmd.followUp({content:"That word is blocked by this server's filter",ephemeral:true});
                    return;
                }

                let defs = [];
                for (var i = 0; i < d.meanings.length; i++) {
                    for (var j = 0;j < d.meanings[i].definitions.length;j++) {
                        let foundOne=checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].example)||checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].definition);
                        defs.push({
                            name:"Type: " +d.meanings[i].partOfSpeech,
                            value:foundOne?"Blocked by this server's filter":d.meanings[i].definitions[j].definition+(d.meanings[i].definitions[j].example?"\nExample: " +d.meanings[i].definitions[j].example:""),
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
