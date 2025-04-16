// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, AttachmentBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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

const { createCanvas } = require('canvas');
const fs = require("node:fs")
const pieCols=require("../data/pieCols.json");


/**
 * Parses a poll message content and extracts poll details.
 *
 * @param {string} c - The content of the poll message.
 * @param {boolean} published - Indicates whether the poll is published.
 * @returns {Object|undefined} An object containing the parsed poll details:
 * - `title` {string}: The title of the poll.
 * - `options` {Array<string>|Object<string, number>}: The poll options. If `published` is true, this will be an object mapping options to their vote counts.
 * - `choices` {Array<string>}: The list of poll choices (only if `published` is true).
 * - `starter` {string}: The ID of the user who started the poll (only if `published` is true).
 * Returns `undefined` if an error occurs during parsing.
 */
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
			helpCategories: [Categories.Entertainment, Categories.Server_Only],
			shortDesc: "Make a poll with automatically tracked options",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Posts a poll with an automatically updated pie chart representing the response density.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		if(await checkDirty(cmd.guild?.id,cmd.options.getString("prompt"))){
			cmd.followUp({content:"This server doesn't want me to process that prompt.","ephemeral":true});
			return;
		}
		cmd.followUp({ "content": `**${(await checkDirty(config.homeServer, cmd.options.getString("prompt"), true))[1]}**`, "ephemeral": true, "components": [new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary), 
			new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger), 
			new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success)
		)] });
	},

	subscribedButtons: [/poll-.+/, /voted.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);
		const pollDB = guild.polls.get(cmd.message.id);

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
				cmd.reply({
					content: limitLength(`**Voters**\n${
						Array.from(pollDB.options.keys())
							.map(opt=>`\n${opt}${
								pollDB.options.get(opt)
									.map(a=>`\n- <@${a}>`)
									.join("")
						}`)
						.join("")}`),
					ephemeral:true,
					allowedMentions:{ parse:[] }
				});
			break;

			case 'poll-removeVote':
				var poll=parsePoll(cmd.message.content,true);
				var options=Array.from(pollDB.options.keys());
				for(var i=0;i<options.length;i++){
					if(pollDB.options.get(options[i]).includes(cmd.user.id)){
						pollDB.options.get(options[i]).splice(pollDB.options.get(options[i]).indexOf(cmd.user.id),1);
						i--;
					}
				}
				var finalResults={};
				var totalVotes=0;
				options.forEach(a=>{
					totalVotes+=pollDB.options.get(a).length;
				});
				options.forEach(a=>{
					if(pollDB.options.get(a).length>0) finalResults[a]=((360/totalVotes)*pollDB.options.get(a).length);
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
				const pollImage = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "poll.png" });

				cmd.update({
					content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${pollDB.options.get(a).length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,
					files:[pollImage]
				});
			break;

			case 'poll-publish':
				if (!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					cmd.reply({ content: `I can't send messages in this channel.`, ephemeral: true });
					break;
				}
				var poll = parsePoll(cmd.message.content);
				var comp = [];
				var comp2 = [];
				for (var i = 0; i < poll.options.length; i++) {
					comp2.push(new ButtonBuilder().setCustomId("voted" + i).setLabel(poll.options[i]).setStyle(ButtonStyle.Primary));
					if (comp2.length === 5) {
						comp.push(new ActionRowBuilder().addComponents(...comp2));
						comp2 = [];
					}
				}
				if (comp2.length > 0) comp.push(new ActionRowBuilder().addComponents(...comp2));
				
				const msg = await cmd.channel.send({
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

				// Compile these options on top of the poll object or smth like that
				var t = {};
				poll.options.forEach((option) => {
					t[option] = [];
				});
				poll.options = structuredClone(t);

				// Finally save the poll
				guild.polls.set(msg.id, poll);
				guild.save();
				
				// Clear original poll
				cmd.update({ "content": "\u200b", components: [] });
				break;

			// Modals
			case 'poll-added':
				var poll=parsePoll(cmd.message.content);
				if(poll.options.length>=20){
					cmd.reply({content:"It looks like you've already generated the maximum amount of options!",ephemeral:true});
					break;
				}
				if(await checkDirty(cmd.guild?.id,cmd.fields.getTextInputValue("poll-addedInp"))){
					cmd.reply({ephemeral:true,content:"I have been asked not to add this option by this server"});
					break;
				}
				poll.options.push(cmd.fields.getTextInputValue("poll-addedInp"));
				cmd.update((await checkDirty(
					config.homeServer,
					`**${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a}`).join("")}`,
					true
				))[1]);
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
				var options=Array.from(pollDB.options.keys());
				var finalResults={};
				var totalVotes=0;
				options.forEach(a=>{
					totalVotes+=pollDB.options.get(a).length;
				});
				options.forEach(a=>{
					if(pollDB.options.get(a).length>0) finalResults[a]=((360/totalVotes)*pollDB.options.get(a).length);
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

				const pollImage = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "poll.png" });

				cmd.update({
					content:limitLength(`**Poll Closed**\n<@${poll.starter}> asked: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${pollDB.options.get(a).length}** - ${pieCols[i][1]}`).join("")}\n\n**Voters**${Array.from(pollDB.options.keys()).map(opt=>`\n${opt}${pollDB.options.get(opt).map(a=>`\n- <@${a}>`).join("")}`).join("")}`),
					components:[],
					allowedMentions:{"parse":[]},
					files:[pollImage]
				});
				
				guild.polls.delete(cmd.message.id);				
			}
			else{
				cmd.reply({"ephemeral":true,"content":"You didn't start this poll and you don't have sufficient permissions to override this."});
			}
		}
		
		if(cmd.customId?.startsWith("voted")){
			var poll=parsePoll(cmd.message.content,true);
			var choice=poll.choices[+cmd.customId.split('voted').slice(1).join("")];
			var options = Array.from(pollDB.options.keys());
			for(var i=0;i<options.length;i++){
				if(pollDB.options.get(options[i]).includes(cmd.user.id)){
					pollDB.options.get(options[i]).splice(pollDB.options.get(options[i]).indexOf(cmd.user.id),1);
					i--;
				}
			}
			pollDB.options.get(choice).push(cmd.user.id);
	
			var finalResults={};
			var totalVotes=0;
			options.forEach(a=>{
				totalVotes+=pollDB.options.get(a).length;
			});
			options.forEach(a=>{
				if(pollDB.options.get(a).length>0) finalResults[a]=((360/totalVotes)*pollDB.options.get(a).length);
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

			// fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));

			const pollImage = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "poll.png" });

			cmd.update({
				content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${pollDB.options.get(a).length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,
				files:[ pollImage ]
			});

		}
		
		// Save if changed
		await guild.save();
	}
};
