// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const fs = require("node:fs")
const wotdList = fs.readFileSync(`./data/wordlist.txt`,"utf-8").split("\n");
const { notify } = require("../utils");
const config = require("../data/config.json");
const { checkDirty } = require("./filter");

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
			helpCategories: [Categories.Entertainment],
			shortDesc: "Play a word of the game reminiscent of Wordle",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Play a game reminiscent of Wordle but with our own word of the day and from within Discord. A new word is chosen every day at 12 UTC.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:`# WOTD Game${"\n` ` ` ` ` ` ` ` ` `".repeat(6)}\nQ W E R T Y U I O P\nA S D F G H J K L\nZ X C V B N M`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
	},

	async daily(context) {
		applyContext(context);
 
		const wotd = wotdList[Math.floor(Math.random()*wotdList.length)];
		await ConfigDB.updateOne({}, { wotd: wotd });

		notify(`WOTD is now ||${wotd}||, use \`~sudo setWord jerry\` to change it.`)
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["wotdModal", /wotd-./],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		const configDoc = await ConfigDB.findOne()
			.select("wotd")
			.lean({ defaults: true })

		const wotd = configDoc.wotd;

		if (cmd.customId == "wotdModal") {
			var guess=cmd.fields.getTextInputValue("wotdInput").toLowerCase();
			if(!/^[a-z]{5}$/.test(guess)){
				cmd.reply({content:`Please enter a valid word.`,ephemeral:true});
				return;
			}
			if(await checkDirty(config.homeServer,guess)){
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
			if(guess===wotd) won=true;
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
				if(wotd.split("")[i]===char){
					guessAccuracy.push(`**${char.toUpperCase()}** `);
					accuracies[char.toUpperCase()]=`**`;
				}
				else if(wotd.includes(char)){
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
				cmd.update({content:`# WOTD Game\n${priorGuesses.join("\n")}\n\n${`QWERTYUIOP`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ASDFGHJKL`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ZXCVBNM`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n## Word: ||${wotd.toUpperCase()}||`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary).setDisabled(true),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
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
