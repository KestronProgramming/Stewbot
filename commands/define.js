// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

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
			helpCategories: [Categories.Information, Categories.General],
			shortDesc: "Get the definition for a word",
			detailedDesc: 
				`Look up the specified word in the dictionary and view the definitions.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        try {
            const res = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what"));
            let wordDefinition = await res.json();
            
            wordDefinition = wordDefinition[0];
            
            if (wordDefinition?.meanings) {
                if(await checkDirty(cmd.guild?.id,wordDefinition.word)||await checkDirty(config.homeServer,wordDefinition.word)){
                    cmd.followUp({content:"I am not able to provide a definition for that word.",ephemeral:true});
                    return;
                }

                let defs = [];
                for (var i = 0; i < wordDefinition.meanings.length; i++) {
                    for (var j = 0;j < wordDefinition.meanings[i].definitions.length;j++) {
                        // Check definition and example against our filter, for home and main server
                        let foundOne =
                            (await checkDirty(
                                cmd.guild?.id,
                                wordDefinition.meanings[i].definitions[j].example,
                                false,
                                true
                            )) ||
                            (await checkDirty(
                                cmd.guild?.id,
                                wordDefinition.meanings[i].definitions[j].definition,
                                false,
                                true
                            ))
                        
                        defs.push({
                            name:"Type: " +wordDefinition.meanings[i].partOfSpeech,
                            value:foundOne?"Blocked definition":wordDefinition.meanings[i].definitions[j].definition+(wordDefinition.meanings[i].definitions[j].example?"\nExample: " +wordDefinition.meanings[i].definitions[j].example:""),
                            inline: true
                        });
                    }
                }
                cmd.followUp({embeds:[{
                    type: "rich",
                    title: "Definition of "+wordDefinition.word,
                    description: wordDefinition.origin,
                    color: 0x773e09,
                    fields: defs.slice(0,25),
                    footer: {
                        text: wordDefinition.phonetic,
                    }
                }]});
            }
            else { 
                cmd.followUp("I'm sorry, I didn't find a definition for that");
            }
        } catch (e) {
            notify("Dictionary error:\n" + String(e.stack));
            cmd.followUp("I'm sorry, I didn't find a definition for that");
        };
    },
};
