// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

function makeHelp(page, categories, filterMode, forWho) {
    const helpCategories = Object.keys(Categories);

    page = +page;
    if (categories.includes("All")) {
        categories = structuredClone(helpCategories);
    }
    else if (categories.includes("None")) {
        categories = [];
    }
    const buttonRows = [];
    var totalPages = [...chunkArray(helpCommands.filter(command => {
        switch (filterMode) {
            case 'And':
                var ret = true;
                categories.forEach(category => {
                    if (!command.helpCategories.includes(category)) {
                        ret = false;
                    }
                });
                return ret;
                break;
            case 'Or':
                var ret = false;
                categories.forEach(category => {
                    if (command.helpCategories.includes(category)) {
                        ret = true;
                    }
                });
                return ret;
                break;
            case 'Not':
                var ret = true;
                categories.forEach(category => {
                    if (command.helpCategories.includes(category)) {
                        ret = false;
                    }
                });
                return ret;
                break;
        }
    }), 9)].length;
    var pagesArray=[
        new ButtonBuilder().setCustomId(`help-page-0-${forWho}-salt1`).setLabel(`First`).setStyle(ButtonStyle.Primary).setDisabled(page===0),
        new ButtonBuilder().setCustomId(`help-page-${page-1}-${forWho}-salt2`).setLabel(`Previous`).setStyle(ButtonStyle.Primary).setDisabled(page-1<0),
        new ButtonBuilder().setCustomId(`help-page-${page}-${forWho}-salt3`).setLabel(`Page ${page+1}`).setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId(`help-page-${page+1}-${forWho}-salt4`).setLabel(`Next`).setStyle(ButtonStyle.Primary).setDisabled(page+1>=totalPages),
        new ButtonBuilder().setCustomId(`help-page-${totalPages-1}-${forWho}-salt5`).setLabel(`Last`).setStyle(ButtonStyle.Primary).setDisabled(page===totalPages-1&&totalPages>1)
    ];
    buttonRows.push(new ActionRowBuilder().addComponents(...pagesArray));
    buttonRows.push(...chunkArray(helpCategories, 5).map(chunk => 
        new ActionRowBuilder().addComponents(
            chunk.map(a => 
                new ButtonBuilder()
                    .setCustomId(`help-category-${a}-${forWho}`)
                    .setLabel(a)
                    .setStyle(categories.includes(a)?ButtonStyle.Success:ButtonStyle.Secondary)
            )
        )
    ));	
    buttonRows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`help-mode-And-${forWho}`).setLabel("AND Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="And"),new ButtonBuilder().setCustomId(`help-mode-Or-${forWho}`).setLabel("OR Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="Or"),new ButtonBuilder().setCustomId(`help-mode-Not-${forWho}`).setLabel("NOT Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="Not")));	
    
    return {
        content: `## Help Menu\nPage: ${page+1}/${totalPages} | Mode: ${filterMode} | Categories: ${categories.length===0?`None`:categories.length===helpCategories.length?`All`:categories.join(", ")}`, embeds: [{
            "type": "rich",
            "title": `Help Menu`,
            "description": ``,
            "color": 0x006400,
            "fields": helpCommands.filter(command=>{
                switch(filterMode){
                    case 'And':
                        var ret=true;
                        categories.forEach(category=>{
                            if(!command.helpCategories.includes(category)){
                                ret=false;
                            }
                        });
                        return ret;
                    break;
                    case 'Or':
                        var ret=false;
                        categories.forEach(category=>{
                            if(command.helpCategories.includes(category)){
                                ret=true;
                            }
                        });
                        return ret;
                    break;
                    case 'Not':
                        var ret=true;
                        categories.forEach(category=>{
                            if(command.helpCategories.includes(category)){
                                ret=false;
                            }
                        });
                        return ret;
                    break;
                }
            }).slice(page*9,(page+1)*9).map(a => {
                return {
                    "name": limitLength(a.mention, 256),
                    "value": limitLength(a.shortDesc, 1024),
                    "inline": true
                };
            }),
            "thumbnail": {
                "url": config.pfp,
                "height": 0,
                "width": 0
            },
            "footer": {
                "text": `Help Menu for Stewbot. To view a detailed description of a command, run /help and tell it which command you are looking for.`
            }
        }],
        components: buttonRows
    };
}

const Fuse = require('fuse.js');
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

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("help").setDescription("View the help menu").addStringOption(option=>
				option.setName("module").setDescription("Enter a command here to get a more detailed description of it").setAutocomplete(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["helpCommands", "commands"],

		help: {
			helpCategories: [Categories.General, Categories.Bot, Categories.Information],
			shortDesc: "View this help menu",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Open this help menu and descriptions.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		if(cmd.options.getString("module")===null){
			cmd.followUp(makeHelp(0,"All","Or",cmd.user.id));
		}
		else{
			var inp=cmd.options.getString("module").toLowerCase();
			var expandedHelp=helpCommands.filter(a=>a.name===inp);
			if(expandedHelp.length===0){
				cmd.followUp(`I'm sorry, I didn't find that command. Perhaps you spelled it wrong?`);
				return;
			}

			// Only add fields with content
			let description = expandedHelp[0].detailedDesc;
			let fields = []
			if (expandedHelp[0].shortDesc) {
				fields.push({
					"name": "Short Description",
					"value": expandedHelp[0].shortDesc,
					"inline": true
				})
			}
			if (expandedHelp[0].helpCategories?.length > 0) {
				fields.push({
					"name":"Tags",
					"value":expandedHelp[0].helpCategories.join(", "),
					"inline":true
				})
			}

			// Add something if no data is specified
			if (fields.length === 0 && !description) {
				description = "No additional information is available for this command."
			}

			cmd.followUp({content:`## Help Menu for ${expandedHelp[0].mention}`,embeds:[{
				"type": "rich",
				"title": `${expandedHelp[0].mention}`,
				description,
				"color": 0x006400,
				fields,
				"thumbnail": {
					"url": config.pfp,
					"height": 0,
					"width": 0
				},
				"footer": {
					"text": `Expanded Help Menu for ${inp}.`
				}
			}]});
		}
	},

	async autocomplete(cmd, context) {
		applyContext(context);
        const userInput = cmd.options.getFocused() || "";
		var possibleCommands = helpCommands.map(a=>a.name);
        // Get the top matching results
        if (userInput) {
            possibleCommands = sortByMatch(possibleCommands, userInput);
        }

        // Limit to discord max
        possibleCommands = possibleCommands.slice(0, 25);

        // Format for discord
        autocompletes = []
        for (let cmdName of possibleCommands) {
            autocompletes.push({
                name: cmdName,
                value: cmdName
            })
        }

        cmd.respond(autocompletes);
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/help-.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("help-")){
			var opts=cmd.customId.split("-");
			if(opts[3]!==cmd.user.id){
				cmd.reply({content:`This isn't your help command! Use ${cmds.help.mention} to start your own help command.`,ephemeral:true});
			}
			else{
				switch(opts[1]){
					case 'page':
						cmd.update(makeHelp(+opts[2],cmd.message.content.split("Categories: ")[1].split(", "),cmd.message.content.split("Mode: ")[1].split(" |")[0],cmd.user.id));
					break;
					case 'category':
						var cats=cmd.message.content.split("Categories: ")[1]?.split(", ");
						if(cats.length===0) cats=["None"];
						if(cats.includes("All")){
							cats=[opts[2]];
						}
						else if(cats.includes(opts[2])){
							cats.splice(cats.indexOf(opts[2]),1);
						}
						else{
							if(cats.includes("None")) cats=[];
							cats.push(opts[2]);
						}
						cmd.update(makeHelp(0,cats,cmd.message.content.split("Mode: ")[1].split(" |")[0],cmd.user.id));
					break;
					case 'mode':
						cmd.update(makeHelp(0,cmd.message.content.split("Categories: ")[1].split(", "),opts[2],cmd.user.id));
					break;
				}
			}
		}
	}
};
