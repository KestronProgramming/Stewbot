// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

const { createCanvas } = require('canvas');
const fs = require("node:fs")
const pieCols=require("../data/pieCols.json");

function parsePoll(c, published){
    try{
        var ret={};
        ret.title=c.split("**")[1];
        ret.options=c.match(/(?<=^\d\.\s|\d\d\.\s).+(?:$)/gm)||[];
        if(published){
            var temp={};
            ret.choices=[];
            ret.options.forEach(a=>{
                var t=+a.split("**")[a.split("**").length-1];
                a=a.split("**")[0].trim();
                ret.choices.push(a);
                temp[a]=t;
            });
            ret.options=structuredClone(temp);
            ret.starter=c.split("<@")[1].split(">")[0];
        }
        return ret;
    }
    catch(e){}
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("poll").setDescription("Make a poll with automatically tracked options").addStringOption(option=>
			option.setName("prompt").setDescription("The prompt (We'll set options in a minute)").setRequired(true)
		),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		deferEphemeral: true,

		requiredGlobals: [],

		help: {
			helpCategories: ["Entertainment","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Make a poll with automatically tracked options",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Posts a poll with an automatically updated pie chart representing the response density.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(checkDirty(cmd.guild?.id,cmd.options.getString("prompt"))){
			cmd.followUp({content:"This server doesn't want me to process that prompt.","ephemeral":true});
			return;
		}
		cmd.followUp({ "content": `**${checkDirty(config.homeServer, cmd.options.getString("prompt"), true)[1]}**`, "ephemeral": true, "components": [new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary), 
			new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger), 
			new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success)
		)] });
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/poll-.+/, /voted.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		switch (cmd.customId) {
			case 'poll-addOption':
				await cmd.showModal(
                    new ModalBuilder()
                        .setCustomId("poll-added")
                        .setTitle("Add a poll option")
                        .addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("poll-addedInp").setLabel("What should the option be?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(70).setRequired(true),)
                        )
                );
			break;

			case 'poll-delOption':
				cmd.showModal(
                    new ModalBuilder()
                        .setCustomId("poll-removed")
                        .setTitle("Remove a poll option")
                        .addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("poll-removedInp").setLabel("Which # option should I remove?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true))
                        )
                );
			break;

			case 'poll-voters':
				cmd.reply({content:limitLength(`**Voters**\n${Object.keys(storage[cmd.guildId].polls[cmd.message.id].options).map(opt=>`\n${opt}${storage[cmd.guildId].polls[cmd.message.id].options[opt].map(a=>`\n- <@${a}>`).join("")}`).join("")}`),ephemeral:true,allowedMentions:{parse:[]}});
			break;

			case 'poll-removeVote':
				var poll=parsePoll(cmd.message.content,true);
				var keys=Object.keys(storage[cmd.guildId].polls[cmd.message.id].options);
				for(var i=0;i<keys.length;i++){
					if(storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].includes(cmd.user.id)){
						storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].splice(storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].indexOf(cmd.user.id),1);
						i--;
					}
				}
				var finalResults={};
				var totalVotes=0;
				keys.forEach(a=>{
					totalVotes+=storage[cmd.guildId].polls[cmd.message.id].options[a].length;
				});
				keys.forEach(a=>{
					if(storage[cmd.guildId].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guildId].polls[cmd.message.id].options[a].length);
				});
				let canvas = createCanvas(600, 600);
				let ctx = canvas.getContext('2d');
				ctx.fillStyle = "black";
				ctx.strokeStyle = "black";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				var t=0;
				Object.keys(finalResults).forEach((key,i)=>{
					ctx.beginPath();
					ctx.fillStyle="#"+pieCols[poll.choices.indexOf(key)][0];
					ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2-50,(t)*(Math.PI/180),(finalResults[key]+t)*(Math.PI/180));
					ctx.lineTo(300, 300);
					t+=finalResults[key];
					ctx.fill();
					if(Object.keys(finalResults).length>1) ctx.stroke();
				});
				fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
				cmd.update({content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guildId].polls[cmd.message.id].options[a].length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,files:["./tempPoll.png"]});
			break;

			case 'poll-publish':
				if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
					cmd.reply({content:`I can't send messages in this channel.`,ephemeral:true});
					break;
				}
				var poll=parsePoll(cmd.message.content);
				var comp=[];
				var comp2=[];
				for(var i=0;i<poll.options.length;i++){
					comp2.push(new ButtonBuilder().setCustomId("voted"+i).setLabel(poll.options[i]).setStyle(ButtonStyle.Primary));
					if(comp2.length===5){
						comp.push(new ActionRowBuilder().addComponents(...comp2));
						comp2=[];
					}
				}
				if(comp2.length>0) comp.push(new ActionRowBuilder().addComponents(...comp2));
				cmd.channel.send({
                        content: `<@${cmd.user.id}> asks: **${poll.title}**${poll.options.map((a, i) => `\n${i}. ${a} **0**`).join("")}`,
                        components: [
                            ...comp,
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId("poll-removeVote")
                                    .setLabel("Remove vote")
                                    .setStyle(ButtonStyle.Danger),
									new ButtonBuilder().setCustomId("poll-voters").setLabel("View voters").setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(
                                        "poll-closeOption" + cmd.user.id
                                    )
                                    .setLabel("Close poll")
                                    .setStyle(ButtonStyle.Danger)
                            ),
                        ],
                        allowedMentions: { users: [] },
                    })
                    .then((msg) => {
                        var t = {};
                        poll.options.forEach((option) => {
                            t[option] = [];
                        });
                        poll.options = structuredClone(t);
                        storage[cmd.guildId].polls[msg.id] =
                            structuredClone(poll);
                    });
				cmd.update({"content":"\u200b",components:[]});
			break;

			// Modals
			case 'poll-added':
				var poll=parsePoll(cmd.message.content);
				if(poll.options.length>=20){
					cmd.reply({content:"It looks like you've already generated the maximum amount of options!",ephemeral:true});
					break;
				}
				if(checkDirty(cmd.guild?.id,cmd.fields.getTextInputValue("poll-addedInp"))){
					cmd.reply({ephemeral:true,content:"I have been asked not to add this option by this server"});
					break;
				}
				poll.options.push(cmd.fields.getTextInputValue("poll-addedInp"));
				cmd.update(checkDirty(config.homeServer,`**${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a}`).join("")}`,true)[1]);
			break;
			
			case 'poll-removed':
				var i=cmd.fields.getTextInputValue("poll-removedInp");
				if(!/^\d+$/.test(i)){
					cmd.deferUpdate();
					return;
				}
				var poll=parsePoll(cmd.message.content);
				if(+i>poll.options.length||+i<1){
					cmd.deferUpdate();
					return;
				}
				poll.options.splice(+i-1,1);
				cmd.update(`**${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a}`).join("")}`);
			break;
			
		}

		if(cmd.customId?.startsWith("poll-closeOption")){
			if(cmd.user.id===cmd.customId.split("poll-closeOption")[1]||cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
				var poll=parsePoll(cmd.message.content,true);
				var keys=Object.keys(storage[cmd.guildId].polls[cmd.message.id].options);
				var finalResults={};
				var totalVotes=0;
				keys.forEach(a=>{
					totalVotes+=storage[cmd.guildId].polls[cmd.message.id].options[a].length;
				});
				keys.forEach(a=>{
					if(storage[cmd.guildId].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guildId].polls[cmd.message.id].options[a].length);
				});
				let canvas = createCanvas(600, 600);
				let ctx = canvas.getContext('2d');
				ctx.fillStyle = "black";
				ctx.strokeStyle = "black";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				var t=0;
				Object.keys(finalResults).forEach((key,i)=>{
					ctx.beginPath();
					ctx.fillStyle="#"+pieCols[poll.choices.indexOf(key)][0];
					ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2-50,(t)*(Math.PI/180),(finalResults[key]+t)*(Math.PI/180));
					ctx.lineTo(300, 300);
					t+=finalResults[key];
					ctx.fill();
					if(Object.keys(finalResults).length>1) ctx.stroke();
				});
				fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
				cmd.update({content:limitLength(`**Poll Closed**\n<@${poll.starter}> asked: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guildId].polls[cmd.message.id].options[a].length}** - ${pieCols[i][1]}`).join("")}\n\n**Voters**${Object.keys(storage[cmd.guildId].polls[cmd.message.id].options).map(opt=>`\n${opt}${storage[cmd.guildId].polls[cmd.message.id].options[opt].map(a=>`\n- <@${a}>`).join("")}`).join("")}`),components:[],allowedMentions:{"parse":[]},files:["./tempPoll.png"]});
				delete storage[cmd.guildId].polls[cmd.message.id];
				
			}
			else{
				cmd.reply({"ephemeral":true,"content":"You didn't start this poll and you don't have sufficient permissions to override this."});
			}
		}
		
		if(cmd.customId?.startsWith("voted")){
			var poll=parsePoll(cmd.message.content,true);
			var choice=poll.choices[+cmd.customId.split('voted')[1]];
			var keys=Object.keys(storage[cmd.guildId].polls[cmd.message.id].options);
			for(var i=0;i<keys.length;i++){
				if(storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].includes(cmd.user.id)){
					storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].splice(storage[cmd.guildId].polls[cmd.message.id].options[keys[i]].indexOf(cmd.user.id),1);
					i--;
				}
			}
			storage[cmd.guildId].polls[cmd.message.id].options[choice].push(cmd.user.id);
	
			var finalResults={};
			var totalVotes=0;
			keys.forEach(a=>{
				totalVotes+=storage[cmd.guildId].polls[cmd.message.id].options[a].length;
			});
			keys.forEach(a=>{
				if(storage[cmd.guildId].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guildId].polls[cmd.message.id].options[a].length);
			});
			let canvas = createCanvas(600, 600);
			let ctx = canvas.getContext('2d');
			ctx.fillStyle = "black";
			ctx.strokeStyle="black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			var t=0;
			Object.keys(finalResults).forEach((key,i)=>{
				ctx.beginPath();
				ctx.fillStyle="#"+pieCols[poll.choices.indexOf(key)][0];
				ctx.arc(canvas.width/2,canvas.height/2,canvas.width/2-50,(t)*(Math.PI/180),(finalResults[key]+t)*(Math.PI/180));
				ctx.lineTo(300, 300);
				t+=finalResults[key];
				ctx.fill();
				if(Object.keys(finalResults).length>1) ctx.stroke();
			});
			fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
			cmd.update({content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guildId].polls[cmd.message.id].options[a].length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,files:["./tempPoll.png"]});
			
		}
		
	}
};
