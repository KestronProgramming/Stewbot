// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const fs = require("node:fs")
const wotdList = fs.readFileSync(`./data/wordlist.txt`,"utf-8").split("\n");


module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('wotd').setDescription('Play a word of the day game reminiscent of Wordle').addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),
		
		// Optional fields
		
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Entertainment"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Play a word of the game reminiscent of Wordle",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Play a game reminiscent of Wordle but with our own word of the day and from within Discord. A new word is chosen every day at 12 UTC.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`# WOTD Game${"\n` ` ` ` ` ` ` ` ` `".repeat(6)}\nQ W E R T Y U I O P\nA S D F G H J K L\nZ X C V B N M`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
	},

	async daily(context) {
		applyContext(context);

		storage.wotd=wotdList[Math.floor(Math.random()*wotdList.length)];
		notify(`WOTD is now ||${storage.wotd}||, use \`~sudo setWord jerry\` to change it.`)
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["wotdModal", /wotd-./],
	async onbutton(cmd, context) {
		applyContext(context);

		if (cmd.customId == "wotdModal") {
			var guess=cmd.fields.getTextInputValue("wotdInput").toLowerCase();
			if(!/^[a-z]{5}$/.test(guess)){
				cmd.reply({content:`Please enter a valid word.`,ephemeral:true});
				return;
			}
			if(checkDirty(config.homeServer,guess)){
				cmd.reply({content:`I am not willing to process this word.`,ephemeral:true});
				return;
			}
			if(!wotdList.includes(guess)){
				cmd.reply({content:`This is not a valid word.`,ephemeral:true});
				return;
			}
			var priorGuesses=cmd.message.content.split("\n").slice(1,7);
			var nextInp=-1;
			var accuracies={};
			var won=false;
			if(guess===storage.wotd) won=true;
			`ABCDEFGHIJKLMNOPQRSTUVWXYZ`.split("").forEach(letter=>{
				accuracies[letter]="";
			});
			for(var i=0;i<priorGuesses.length;i++){
				if(nextInp===-1){
					var t;
					if(priorGuesses[i].includes("*")){
						t=priorGuesses[i].match(/(?<=\*)[A-Z]/ig)
						if(t){
							t.forEach(match=>{
								accuracies[match]=`**`;
							});
						}
					}
					if(priorGuesses[i].includes("_")){
						t=priorGuesses[i].match(/(?<=\_)[A-Z]/ig);
						if(t){
							t.forEach(match=>{
								if(accuracies[match]!=="**") accuracies[match]=`__`;
							});
						}
					}
					if(priorGuesses[i].includes("`")){
						t=priorGuesses[i].match(/(?<=\`)[A-Z]/ig)
						if(t){
							t.forEach(match=>{
								accuracies[match]=`~~`;
							});
						}
					}
				}
				if(priorGuesses[i]==="` ` ` ` ` ` ` ` ` `"&&nextInp===-1){
					nextInp=i;
				}
			}
			var guessAccuracy=[];
			guess.split("").forEach((char,i)=>{
				if(storage.wotd.split("")[i]===char){
					guessAccuracy.push(`**${char.toUpperCase()}** `);
					accuracies[char.toUpperCase()]=`**`;
				}
				else if(storage.wotd.includes(char)){
					guessAccuracy.push(`__${char.toUpperCase()}__ `);
					if(accuracies[char.toUpperCase()]!=="**") accuracies[char.toUpperCase()]=`__`;
				}
				else{
					guessAccuracy.push(`\`${char.toUpperCase()}\``);
					accuracies[char.toUpperCase()]=`~~`;
				}
			});
			priorGuesses[nextInp]=guessAccuracy.join(" ");//guess.split("").map(a=>`${guessAccuracies[a]}${a.toUpperCase()}${guessAccuracies[a]}${guessAccuracies[a]==="`"?``:` `}`).join(" ");
			if(nextInp===5||won){
				cmd.update({content:`# WOTD Game\n${priorGuesses.join("\n")}\n\n${`QWERTYUIOP`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ASDFGHJKL`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ZXCVBNM`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n## Word: ||${storage.wotd.toUpperCase()}||`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary).setDisabled(true),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
			}
			else{
				cmd.update(`# WOTD Game\n${priorGuesses.join("\n")}\n\n${`QWERTYUIOP`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ASDFGHJKL`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ZXCVBNM`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}`);
			}

		}

		if (cmd.customId?.startsWith("wotd-")) {
			if(cmd.user.id!==cmd.customId.split("-")[1]){
				cmd.reply({content:`This is not your game.`,ephemeral:true});
			}
			else{
				await cmd.showModal(
                    new ModalBuilder()
                        .setCustomId("wotdModal")
                        .setTitle("WOTD - Make a Guess")
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("wotdInput")
                                    .setLabel("Guess")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(5)
                                    .setMaxLength(5)
                                    .setRequired(true)
                            )
                        )
                );
			}
		}
	
	}
};
