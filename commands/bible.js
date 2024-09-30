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
		command: new SlashCommandBuilder().setName("bible").setDescription("Look up a verse or verses in the King James version of the Bible")
            .addStringOption(option=>
                option.setName("book").setDescription("What book of the Bible do you wish to look up?").setRequired(true)
            ).addIntegerOption(option=>
                option.setName("chapter").setDescription("Which chapter do you want to look up?").setRequired(true)
            ).addStringOption(option=>
                option.setName("verse").setDescription("What verse or verses do you want to look up? (Proper format for multiple verses is '1-3')").setRequired(true)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["getClosest", "Bible", "properNames"],

		help: {
            "helpCategory":"Informational",
            "helpDesc":"Look up one or more verses in the King James Bible"
        },
	},

	async execute(cmd, context) {
		applyContext(context);
		
        let book=getClosest(cmd.options.getString("book").toLowerCase());
        if(cmd.options.getString("verse").includes("-")&&+cmd.options.getString("verse").split("-")[1]>+cmd.options.getString("verse")[0]){
            try{
                let verses=[];
                for(var v=+cmd.options.getString("verse").split("-")[0];v<+cmd.options.getString("verse").split("-")[0]+5&&v<+cmd.options.getString("verse").split("-")[1];v++){
                    verses.push(Bible[book][cmd.options.getInteger("chapter")][v]);
                }
                if(verses.join(" ")===undefined){ 
                    cmd.followUp(`I'm sorry, I don't think that passage exists - at least, I couldn't find it. Perhaps something is typoed?`);
                }
                else{
                    cmd.followUp({content:`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,embeds:[{
                        "type": "rich",
                        "title": `${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,
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
                if(Bible[book][cmd.options.getInteger("chapter")][+cmd.options.getString("verse")]!==undefined){
                    cmd.followUp({content:`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,embeds:[{
                        "type": "rich",
                        "title": `${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,
                        "description": Bible[book][cmd.options.getInteger("chapter")][+cmd.options.getString("verse")],
                        "color": 0x773e09,
                        "footer": {
                            "text": `King James Version`
                        }
                    }]});
                }
                else{
                    cmd.followUp(`I'm sorry, I couldn't find \`${book} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
                }
            }
            catch(e){
                cmd.followUp(`I'm sorry, I couldn't find \`${book} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
            }
        }   
	}
};
