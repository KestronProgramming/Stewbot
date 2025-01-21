// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

const fs = require("fs");

// RaC utilities
let rac = { // TODO: move this into fun.js module
    board: [],
    lastPlayer: "Nobody",
    timePlayed: 0,
    players: [],
    icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789",
};
function getRACBoard(localRac) {
    rac = localRac || rac; // Handle calls from inside modules and outside using the above global
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let mess = [];
    let temp = "  ";
    for (var i=0; i<rac.board.length;i++) {
        mess.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp += ` ${racChars[i]}`;
    }
    mess.unshift(temp);
    const lastMoveStr = rac.lastPlayer === "Nobody" ? "None" : `<@${rac.lastPlayer}>`
    mess=`Last Moved: ${lastMoveStr} ${(rac.timePlayed!==0?`<t:${Math.round(rac.timePlayed/1000)}:R>`:"")}\`\`\`\n${mess.join("\n")}\`\`\`\nPlayers: `;
    for (var i=0;i<rac.players.length;i++) {
        mess+=`\n<@${rac.players[i]}>: \`${rac.icons[i]}\``;
    }
    return `**Rows & Columns**\n${mess}`;
}
function readRACBoard(toRead) {
    rac.lastPlayer=toRead.split("<@")[1].split(">")[0];
    try {
        rac.timePlayed=Math.round(+toRead.split("<t:")[1].split(":R>")[0]*1000);
    }
    catch(e){
        rac.timePlayed=0;
    }
    let board=toRead.split("```\n")[1].split("```")[0];
    let rows=board.split("\n");
    rac.rowsActive=rows[0].replaceAll(" ","");
    rows.splice(0, 1);
    for(var i=0; i<rows.length;i++) {
        rows[i]=rows[i].slice(3, rows[i].length).replaceAll("|", "").split("");
    }
    rac.board=rows;
    let tmpPlayers=toRead.split("Players: \n")[1].split("<@");
    rac.players = [];
    for(var i=1;i<tmpPlayers.length;i++) {
        rac.players.push(tmpPlayers[i].split(">")[0]);
    }
}
function scoreRows(game,char) {
    var score = 0;
    game.forEach((row)=>{
        row = row.join(""); // row is an array of chars, this function expects a string
        var search=char.repeat(row.length);
        while (search.length>2&&row) {
            if (row.includes(search)) {
                row=row.substring(0,row.indexOf(search))+row.substring(row.indexOf(search)+search.length);
                score+=search.length-2;
            }
            else{
                search=search.substring(1);
            }
        }
    });
    return score;
}
function rotateGame(game) {
    var newGame=[];
    for (var i=0;i<game.length;i++) {
        var newCol = [];
        for (var j=0;j<game.length;j++) {
            newCol.push(game[j][i]);
        }
        newGame.push(newCol);
    }
    return newGame;
}
function score(game,char) {
    var score=scoreRows(game,char);
    score+=scoreRows(rotateGame(game),char);
    return score;
}
function tallyRac() {
    let scores=[];
    let playerObjects = []; // we're gonna manage this the right way
    for (var i = 0; i < rac.players.length; i++) {
        const playerScore = score(rac.board, rac.icons[i]);
        playerObjects.push({
            playerID: rac.players[i],
            score: playerScore
        })
    }
    // Build the board
    let resultsMessage=[];
    let temp="  ";
    let racChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i=0;i<rac.board.length;i++) {
        resultsMessage.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp+=` ${racChars[i]}`;
    }
    resultsMessage.unshift(temp);
    playerObjects.sort((a, b) => b.score - a.score);
    const highestScore = playerObjects[0].score;
    const winningPlayers = playerObjects.filter(player => player.score === highestScore);
    
    const winnersMention = `<@${winningPlayers.map(obj => obj.playerID).join(">, <@")}>`
    resultsMessage=`Winner${winningPlayers.length>1?"s":''}: ${winnersMention} :trophy:\`\`\`\n${resultsMessage.join("\n")}\`\`\`\nPlayers: `;
    
    // Now add everybody else
    const positionEmojis = [
        ":first_place:",
        ":second_place:",
        ":third_place:",
    ]

    let currentRank = 0;
    let previousScore = null;
    playerObjects.forEach((player, index) => {
        if (player.score !== previousScore) {
            currentRank = index;
        }
        const emoji = positionEmojis[currentRank] || "";
        resultsMessage += `\n<@${player.playerID}>: \`${rac.icons[rac.players.indexOf(player.playerID)]}\` - score ${player.score} ${emoji}`;
        previousScore = player.score;
    });

    return `**Rows & Columns**\n${resultsMessage}`;
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("fun").setDescription("Posts something fun to enjoy")
			.addSubcommand(command=>
				command.setName("meme").setDescription("Posts a meme").addIntegerOption(option=>
					option.setName("number").setDescription("Specific meme # to post (optional)").setMinValue(0)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("joke").setDescription("Posts a joke").addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("wyr").setDescription("Posts a Would-You-Rather question")
			).addSubcommand(command=>
				command.setName("dne").setDescription("Posts a picture of a person - who never existed! (AI Person generation)").addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("rac").setDescription("Play a game of Rows & Columns").addBooleanOption(option=>
					option.setName("help").setDescription("View the rules instead of playing?")
				).addIntegerOption(option=>
					option.setName("size").setDescription("Set your amount of rows and start playing!").setMinValue(process.env.beta ? 1 : 3).setMaxValue(26)
				)
			).addSubcommand(command=>
				command.setName("rock_paper_scissors").setDescription("Play Rock Paper Scissors with the bot").addStringOption(option=>
					option.setName("choice").setDescription("Rock, Paper, Scissors, Shoot!").addChoices(
						{"name":"Rock","value":"Rock"},
						{"name":"Paper","value":"Paper"},
						{"name":"Scissors","value":"Scissors"}
					).setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			"dne": {
				helpCategories: ["Entertainment"],
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
				shortDesc: "Posts a picture of a person who never existed using AI",
				detailedDesc: 
					`Uses https://thispersondoesnotexist.com/ to display a picture of a completely fake human face.`
			},
			"rac": {
				helpCategories: ["Entertainment"],
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
				shortDesc: "Play a game of Rows & Columns",
				detailedDesc: 
					`**Rows & Columns**\n
					\n
					In this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n
					\n
					To join the game, press the Join Game button.\n
					To make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type \`AC\`).\n
					\n
					This is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.`
			},
			"wyr": {
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
				shortDesc: "Posts a Would-You-Rather question",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts a would you rather question. Disclaimer: This command uses a third party API, and has no quality guarantee.`
			},
			"joke": {
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
				shortDesc: "Posts a joke",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts a joke. Disclaimer: This command uses a third party API, and has no quality guarantee.`
			},
			"meme": {
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
				shortDesc: "Posts a meme",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts one of the memes Stewbot's staff have approved for the bot to display. You can use the /submit_meme context menu command (holding down the message on mobile, right clicking on desktop, and then pressing Apps) to submit a meme for the Stewbot staff to review.`
			},
			// helpSortPriority: 1
		},
		
	},

	async execute(cmd, context) {
		applyContext(context);
		
		switch(cmd.options.getSubcommand()){
			case 'dne':
				fetch("https://thispersondoesnotexist.com").then(d=>d.arrayBuffer()).then(d=>{
					fs.writeFileSync("./tempDne.jpg",Buffer.from(d));
					cmd.followUp({content:`Image courtesy of <https://thispersondoesnotexist.com>`,files:["./tempDne.jpg"]});
				});
			break;
			case 'wyr':
				fetch("https://would-you-rather.p.rapidapi.com/wyr/random", {
					method: "GET",
					headers: {
						"X-RapidAPI-Key": process.env.wyrKey,
						"X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
					},
				}).then(d=>d.json()).then(async d=>{
					if (d?.message?.startsWith?.("You have exceeded the ")) {
						cmd.followUp("I'm sorry, I need to wait a little bit before I can run this command again.");
						return;
					}
					let firstQues=d[0].question.split("Would you rather ")[1];
					let firstQuest=firstQues[0].toUpperCase()+firstQues.slice(1,firstQues.length).split(" or ")[0];
					let nextQues=firstQues.split(" or ")[1];
					let nextQuest=nextQues[0].toUpperCase()+nextQues.slice(1,nextQues.length).split("?")[0];
					cmd.followUp(`**Would you Rather**\n🅰️: ${firstQuest}\n🅱️: ${nextQuest}\n\n-# *\\*Disclaimer: All WYRs are provided by a third party API*`);
					if(cmd.channel?.permissionsFor?.(client.user.id).has(PermissionFlagsBits.AddReactions)){
						let msg = await cmd.fetchReply();
						msg.react("🅰️").then(msg.react("🅱️"));
					}
				});
			break;
			case 'joke':
				fetch("https://v2.jokeapi.dev/joke/Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&safe-mode").then(d=>d.json()).then(d=>{
					cmd.followUp(d.type==="single"?`${d.joke}`:`${d.setup}\n\n||${d.delivery}||`);
				});
			break;
			case 'meme':
				var memes=fs.readdirSync("./memes");
				if(memes.length===0){
					cmd.followUp("I'm sorry, but I don't appear to have any at the moment.");
					break;
				}
				var meme;
				try{
					// meme = cmd.options.getInteger("number") ? memes.filter(m=>m.split(".")[0] === cmd.options.getInteger("number").toString())[0] : memes[Math.floor(Math.random()*memes.length)];
					meme = memes.filter(m=>m.split(".")[0] === cmd.options.getInteger("number").toString())[0];
					if (!meme) meme = memes[Math.floor(Math.random()*memes.length)];
				}
				catch(e) { // Give a random meme if it fails becaues there is no number. OPTIMIZE: check if there were options passed rather than try-catching
					meme=memes[Math.floor(Math.random()*memes.length)];
				}
				cmd.followUp({content:`Meme #${meme.split(".")[0]}`,files:[`./memes/${meme}`]});
			break;
			case 'rac':
				if(cmd.options.getBoolean("help")){
					cmd.followUp("**Rows & Columns**\n\nIn this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n\nTo join the game, press the Join Game button.\nTo make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type `AC`).\n\nThis is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.");
					break;
				}
				var size=cmd.options.getInteger("size")||5;
				rac={
					board: [],
					lastPlayer: "Nobody",
					timePlayed: 0,
					players: [],
					icons: "!@$%^&()+=[]{};':~,./<>?0123456789",
				};
				for(var k=0;k<size;k++){
					rac.board.push([]);
					for(var j=0;j<size;j++){
						rac.board[k].push("-");
					}
				}
				rac.players=[cmd.user.id];
				await cmd.followUp({content:getRACBoard(rac),components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin").setLabel("Join Game").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("racMove").setLabel("Make a Move").setStyle(ButtonStyle.Success))]});
			break;
			case 'rock_paper_scissors':
				var humanChoice=cmd.options.getString("choice");
				var computerChoice=["Rock","Paper","Scissors"][Math.floor(Math.random()*3)];
				var won=0;
				if(humanChoice==="Rock"&&computerChoice==="Paper"||humanChoice==="Paper"&&computerChoice==="Scissors"||humanChoice==="Scissors"&&computerChoice==="Rock"){
					won=1;
				}
				else if(humanChoice!==computerChoice){
					won=2;
				}
				let emojified = {
					"Rock": ":rock:",
					"Scissors": ":scissors:",
					"Paper": ":newspaper2:",
				}
				const result =
					`You played: ${humanChoice} ${emojified[humanChoice]}\n` +
					`I played: ${computerChoice} ${emojified[computerChoice]}\n` +
					`\n${won==0?`We`:`You`} ${won==0?`tied`:won==1?`lost`:`won`}! ${won==1?":stew:":""}`
				cmd.followUp(result);
			break;
		}
	},

	subscribedButtons: ["racMove", "racJoin", "moveModal"],
	async onbutton(cmd, context) {
		applyContext(context);

		switch(cmd.customId) {
			case "racMove":
				let moveModal=new ModalBuilder().setCustomId("moveModal").setTitle("Rows & Columns Move");
				let moveModalInput=new TextInputBuilder().setCustomId("moveMade").setLabel("Where would you like to move? (Example: AC)").setStyle(TextInputStyle.Short).setMaxLength(2).setRequired(true);
				let row=new ActionRowBuilder().addComponents(moveModalInput);
				moveModal.addComponents(row);
				await cmd.showModal(moveModal);
			break;

			case "racJoin":
				readRACBoard(cmd.message.content);
				var bad=false;
				for(var i=0;i<rac.players.length;i++) {
					if(rac.players[i]===cmd.user.id){
						cmd.reply({
							content: "You can't join more than once!",
							ephemeral: true,
						});
						bad=true;
					}
				}
				if(bad) break;
				rac.players.push(cmd.user.id);
				if(rac.players.length>rac.icons.length){
					cmd.reply({content:"I'm sorry, but this game has hit the limit of players. I don't have any more symbols to use.",ephemeral:true});
					return;
				}
				if(getRACBoard().length>1999) {
					rac.players.splice(rac.players.length-1,1);
					cmd.reply({content:"Sadly the board can't handle any more players. This is a Discord character limit, and you can add more players by using less rows.",ephemeral:true});
					let row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin").setLabel("Join Game").setStyle(ButtonStyle.Danger).setDisabled(true),new ButtonBuilder().setCustomId("racMove").setLabel("Make a Move").setStyle(ButtonStyle.Success));
					cmd.message.edit({content:getRACBoard(),components:[row]});
					return;
				}
				cmd.update(getRACBoard());
			break;

			// Modal
			case "moveModal":
				let cont=cmd.fields.getTextInputValue("moveMade").toUpperCase();
				readRACBoard(cmd.message.content);
				let foundOne=-1;
				for(var i=0;i<rac.players.length;i++){
					if(rac.players[i]===cmd.user.id){
						foundOne=i;
					}
				}
				if(foundOne===-1){
					cmd.reply({content:"I didn't find you in the player list, use the `Join Game` button first.",ephemeral: true});
					break;
				}
				if(!rac.rowsActive.includes(cont[0])||!rac.rowsActive.includes(cont[1])){
					cmd.reply({content:"That location isn't on the board",ephemeral:true});
					break;
				}
				if((Date.now()-+rac.timePlayed)<900000&&cmd.user.id===rac.lastPlayer){
					cmd.reply({content:`I'm sorry, you can make another move after somebody else does OR <t:${Math.round((rac.timePlayed+900000)/1000)}:R>`,ephemeral:true});
					break;
				}
				if (rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])]!=="-"){
					cmd.reply({content: "That location is occupied.",ephemeral:true});
					break;
				}
				rac.lastPlayer=cmd.user.id;
				rac.timePlayed=Date.now();
				rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])]=rac.icons[foundOne];
				await cmd.update(getRACBoard());

				let foundZero=false;
				for (var i=0;i<rac.board.length;i++) {
					for(var j=0;j<rac.board[i].length;j++) {
						if(rac.board[i][j]==="-") {
							foundZero=true;
						}
					}
				}
				if(!foundZero){
					let row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin").setLabel("Join Game").setStyle(ButtonStyle.Danger).setDisabled(true),new ButtonBuilder().setCustomId("racMove").setLabel("Make a Move").setStyle(ButtonStyle.Success).setDisabled(true));
					cmd.message.edit({content:tallyRac(),components:[row]});
				}
			break;

		}
	}
};
