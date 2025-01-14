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
		requiredGlobals: ["finTimer"],

		help: {
            config:{
                helpCategories: ["General","Administration","Configuration","Server Only"],
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
                    `Import a .csv file containing a list of words seperated by commas to block. You can generate one from another server's filter using the /view_filter command.`
            }
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
                if(storage[cmd.guildId].filter.blacklist.includes(cmd.options.getString("word"))){
                    cmd.followUp({"ephemeral":true,"content":`The word ||${cmd.options.getString("word")}|| is already in the blacklist.${storage[cmd.guildId].filter.active?"":`To begin filtering in this server, use ${cmds.filter.config.mention}.`}`});
                }
                else{
                    storage[cmd.guildId].filter.blacklist.push(cmd.options.getString("word"));
                    cmd.followUp(`Added ||${cmd.options.getString("word")}|| to the filter for this server.${storage[cmd.guildId].filter.active?"":`\n\nThe filter for this server is currently disabled. To enable it, use ${cmds.filter.config.mention}.`}`);
                    
                }
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
};
