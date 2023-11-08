process.env=require("./env.json");
const twilioClient = require('twilio')(process.env.twilioSid, process.env.twilioToken);
function sendText(toWhom,what){
    twilioClient.messages.create({
        body: what.replaceAll("<","\\<"),
        from: twilio.num,
        to: toWhom
    });
}
function makeCall(toWhom,what){
    fs.writeFileSync("./static/msg.xml",`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="man">${what.replaceAll("<","\\<")}</Say>
</Response>`);
    twilioClient.calls.create({
        url:process.env.hostedUrl+"/msg.xml",
        method:"GET",
        to:toWhom,
        from:twilio.num
    })
}
const {Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, EmbedBuilder}=require("discord.js");
const fs=require("fs");
const express=require("express");
const path=require("path");
const site=new express();
site.listen(80);
site.use(express.static(path.join(__dirname,"./static")));
var storage=require("./storage.json");
function save(){
    fs.writeFileSync("./storage.json",JSON.stringify(storage));
}
function ll(s){
    return s.length>1999?s.slice(0,1996)+"...":s;
}

const defaultMii={
    info: {
      creatorName: '',
      name: 'Default',
      gender: 'Male',
      mingle: true,
      birthMonth: 0,
      birthday: 0,
      favColor: 'Red',
      favorited: false,
      height: 64,
      weight: 64,
      downloadedFromCheckMiiOut: false,
      type:"Normal"
    },
    face: { shape: 0, col: 'White', feature: 'None' },
    nose: { type: 0, size: 4, vertPos: 9 },
    mouth: { type: '111', col: 'Peach', size: 4, yPos: 13 },
    mole: { on: false, size: 4, xPos: 2, yPos: 20 },
    hair: { type: '111', col: 'Brown', flipped: false },
    eyebrows: {
      type: '111',
      rotation: 6,
      col: 'Brown',
      size: 4,
      yPos: 10,
      distApart: 2
    },
    eyes: {
      type: '111',
      rotation: 4,
      yPos: 12,
      col: 'Black',
      size: 4,
      distApart: 2
    },
    glasses: { type: 0, col: 'Grey', size: 4, yPos: 10 },
    facialHair: {
      mustacheType: 0,
      beardType: 0,
      col: 'Black',
      mustacheSize: 4,
      mustacheYPos: 10
    },
    name: 'Default',
    creatorName: ''
};
const defaultInvite={//Indexed under inviteId
    "uses":0,
    "createdBy":""
};
const defaultGuild={
    "filter":{
        "blacklist":[],
        "active":false,
        "censor":true,
        "log":false,
        "channel":"",
        "whitelist":[]
    },
    "starboard":{
        "channel":"",
        "emoji":"⭐",
        "active":false,
        "threshold":3,
        "posted":{}
    },
    "logs":{
        "channel":"",
        "active":false,
        "events":{
            "channel":false,
            "user":false,
            "server":false,
            "pins":false,
            "emojis":false,
            "events":false,
            "invites":false,
            "roles":false
        }
    },
    "counting":{
        "active":false,
        "channel":"",
        "nextNum":1,
        "highestNum":0,
        "legit":true, //If manually setting the next number, disqualify from the overarching leaderboard
        "reset":true
    },
    "users":{},
    "reactionRoles":[],
    "invites":[],
    "polls":{}
};
const defaultGuildUser={
    "infractions":0,
    "stars":0,
    "invited":0
};
const defaultUser={
    "offenses":0,
    "goombaSquad":{
        "wins":0,
        "losses":0,
        "draws":0,
        "cards":[],
        "chose":null,
        "playing":null
    },
    "mii":structuredClone(defaultMii),
    "config":{
        "dmOffenses":true,
        "returnFiltered":true,
        "dmNotifs":true
    }
};
var kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(cs|computer-programming)\/[a-z,\d,-]+\/\d{1,16}(?!>)\b/gi;
var discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d{1,25})\/\d{1,25}\d{1,25}(?!>)\b/gi;

const client=new Client({
    intents:Object.keys(GatewayIntentBits).map(a=>{return GatewayIntentBits[a]}),
    partials:Object.keys(Partials).map(a=>{return Partials[a]})
});
function notify(urgencyLevel,what){
    switch(urgencyLevel){
        default:
        case 0:
            client.users.cache.get(process.env.ownerId).send(what);//Notify Kestron06 directly
        break;
        case 1:
            client.channels.cache.get(process.env.noticeChannel).send(what);//Notify the staff of the Kestron Support server
        break;
        case 2:
            sendText(what);//Text Kestron06
        break;
        case 3:
            makeCall(what);//Call Kestron06
        break;
    }
}
var uptime=0;
client.once("ready",()=>{
    uptime=Math.round(Date.now()/1000);
    notify(0,`Started <t:${uptime}:R>`);
    console.log(`Logged Stewbot handles into ${client.user.tag}`);
    save();
    client.user.setActivity("S omething T o E xpedite W ork",{type:ActivityType.Custom},1000*60*60*24*31*12);
});
client.on("messageCreate",async msg=>{
    if(msg.content==="clearStorage"&&msg.author.username==="kestron06"){
        storage={
            "0":{
                "filter":{
                    "active":"false"
                }
            }
        };
        save();
        msg.reply("Cleared");
        return;
    }
    if(msg.author.id===client.user.id) return;
    msg.guildId=msg.guildId||"0";
    if(msg.guildId!=="0"){
        if(!storage.hasOwnProperty(msg.guildId)){
            storage[msg.guildId]=structuredClone(defaultGuild);
            save();
        }
        if(!storage[msg.guildId].users.hasOwnProperty(msg.author.id)){
            storage[msg.guildId].users[msg.author.id]=structuredClone(defaultGuildUser);
            save();
        }
    }
    if(!storage.hasOwnProperty(msg.author.id)){
        storage[msg.author.id]=structuredClone(defaultUser);
        save();
    }
    if(storage[msg.guildId].filter.active===true){
        var foundWords=[];
        storage[msg.guildId].filter.blacklist.forEach(blockedWord=>{
            if(new RegExp(`([^\\D]|\\b)${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?([^\\D]|\\b)`,"ig").test(msg.content)){
                foundWords.push(blockedWord);
                if(foundWords.length===1){
                    msg.ogContent=msg.content;
                }
                msg.content=msg.content.replace(new RegExp(`([^\\D]|\\b)${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?([^\\D]|\\b)`,"ig"),"[\\_]");
            }
        });
        if(foundWords.length>0){
            storage[msg.guildId].users[msg.author.id].infractions++;
            msg.delete();
            if(storage[msg.guildId].filter.censor){
                msg.channel.send(ll(`\`\`\`\nThe following message from ${msg.author.username} has been censored by Stewbot.\`\`\`${msg.content}`));
            }
            if(storage[msg.author.id].config.dmOffenses){
                msg.author.send(ll(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to the following word${foundWords.length>1?"s":""} being in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.ogContent.replaceAll("`","\\`")+"```":""}`));
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                client.channels.cache.get(ll(storage[msg.guildId].filter.channel).send(`I have ${storage[msg.guildId].filter.censor?"censored":"deleted"} a message from **${msg.author.username}** in <#${msg.channel.id}> for the following blocked word${foundWords.length>1?"s":""}": ||${foundWords.join("||, ||")}||\`\`\`\n${msg.ogContent.replaceAll("`","\\`")}\`\`\``));
            }
            save();
            return;
        }
    }
});
client.on("interactionCreate",async cmd=>{
    try{
        if(cmd.guild.id!==0){
            if(!storage.hasOwnProperty(cmd.guild.id)){
                storage[cmd.guild.id]=structuredClone(defaultGuild);
                save();
            }
            if(!storage[cmd.guild.id].users.hasOwnProperty(cmd.user.id)){
                storage[cmd.guild.id].users[cmd.user.id]=structuredClone(defaultGuildUser);
                save();
            }
        }
    }
    catch(e){
        cmd.guild={"id":"0"};
    }
    if(!storage.hasOwnProperty(cmd.user.id)){
        storage[cmd.user.id]=structuredClone(defaultUser);
        save();
    }

    //Slash Commands
    switch(cmd.commandName){
        case 'ping':
            cmd.reply(`**Online**\n- Latency: ${client.ws.ping} milliseconds\n- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n- Uptime: ${((Math.round(Date.now()/1000)-uptime)/(1000*60*60)).toFixed(2)} hours`);
        break;
        case "filter":
            switch(cmd.options.getSubCommand()){
                case "add":
                    if(storage[cmd.guild.id].filter.blacklist.includes(cmd.options.getString("word"))){
                        cmd.reply({"ephemeral":true,"content":`The word ||${cmd.options.getString("word")}|| is already in the blacklist.${storage[cmd.guild.id].filter.active?"":"To begin filtering in this server, use `/filter_config`."}`});
                    }
                    else{
                        storage[cmd.guild.id].filter.blacklist.push(cmd.options.getString("word"));
                        cmd.reply(`Added ||${cmd.options.getString("word")}|| to the filter for this server.${storage[cmd.guild.id].filter.active?"":`\n\nThe filter for this server is currently disabled. To enable it, use \`/filter_config\`.`}`);
                        save();
                    }
                break;
                case "remove":
                    if(storage[cmd.guild.id].filter.blacklist.includes(cmd.options.getString("word"))){
                        storage[cmd.guild.id].filter.blacklist.splice(storage[cmd.guild.id].filter.blacklist.indexOf(cmd.options.getString("word")),1);
                        cmd.reply(`Alright, I have removed ||${cmd.options.getString("word")}|| from the filter.`);
                        save();
                    }
                    else{
                        cmd.reply(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use \`/view_filter\` to see all filtered words.`);
                    }
                break;
                case "config":
                    storage[cmd.guild.id].filter.active=cmd.options.getBoolean("active");
                    if(cmd.options.getBoolean("censor")!==null) storage[cmd.guild.id].filter.censor=cmd.options.getBoolean("censor");
                    if(cmd.options.getBoolean("log")!==null) storage[cmd.guild.id].filter.log=cmd.options.getBoolean("log");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].filter.log=cmd.options.getChannel("channel");
                    if(storage[cmd.guild.id].filter.channel==="") storage[cmd.guild.id].filter.log=false;
                    cmd.reply(`Filter configured.${(cmd.options.getBoolean("log")&&!storage[cmd.guild.id].filter.log)?"\n\nNo channel was set to log summaries of deleted messages to, so logging these is turned off. To reenable this, run the command again and set `log` to true and specify a `channel`.":""}`);
                    save();
                break;
            }
        break;
        case 'view_filter':
            if(storage[cmd.guild.id].filter.blacklist.length>0){
                cmd.reply({"content":`**Warning!** There is no guarantee what kinds of words may be in the blacklist. There is a chance it could be heavily dirty. To continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
            }
            else{
                cmd.reply(`This server doesn't have any words blacklisted at the moment. To add some, you can use \`/no_swear\`.`);
            }
        break;
        case 'starboard_config':
            storage[cmd.guild.id].starboard.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].starboard.channel=cmd.options.getChannel("channel");
            if(cmd.options.getInteger("threshold")!==null) storage[cmd.guild.id].starboard.threshold=cmd.options.getInteger("threshold");
            if(cmd.options.getString("emoji")!==null) storage[cmd.guild.id].starboard.emoji=cmd.options.getString("emoji");
            if(storage[cmd.guild.id].starboard.channel==="") storage[cmd.guild.id].starboard.active=false;
            cmd.reply(`Starboard configured.${cmd.options.getBoolean("active")&&!storage[cmd.guild.id].starboard.active?`\n\nNo channel has been set for this server, so starboard is inactive. To enable starboard, run the command again setting \`active\` to true and specify a \`channel\`.`:""}`);
            save();
        break;
        case 'fun':
            switch(cmd.options.getSubcommand()){
                case 'dne':
                    fetch("https://thispersondoesnotexist.com").then(d=>d.arrayBuffer()).then(d=>{
                        fs.writeFileSync("./tempDne.jpg",Buffer.from(d));
                        cmd.reply({content:`Image courtesy of <https://thispersondoesnotexist.com>`,files:["./tempDne.jpg"]});
                    });
                break;
                case 'wyr':
                    fetch("https://would-you-rather.p.rapidapi.com/wyr/random", {
                        method: "GET",
                        headers: {
                            "X-RapidAPI-Key": "7bd6392ac6mshceb99882c34c39cp16b90cjsn985bc49d5ae1",
                            "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
                        },
                    }).then(d=>d.json()).then(async d=>{
                        let firstQues=d[0].question.split("Would you rather ")[1];
                        let firstQuest=firstQues[0].toUpperCase()+firstQues.slice(1,firstQues.length).split(" or ")[0];
                        let nextQues=firstQues.split(" or ")[1];
                        let nextQuest=nextQues[0].toUpperCase()+nextQues.slice(1,nextQues.length).split("?")[0];
                        cmd.reply(`**Would you Rather**\n🅰️: ${firstQuest}\n🅱️: ${nextQuest}`);
                        let msg = await cmd.fetchReply();
                        msg.react("🅰️").then(msg.react("🅱️"));
                    });
                break;
                case 'craiyon':
                    await cmd.reply({content:`Your request is now loading. Expected finish time <t:${Math.round(Date.now()/1000)+60}:R>`,files:["./loading.gif"]});
                    try{
                        fetch("https://api.craiyon.com/v3", {
                            "headers": {
                                "accept": "*/*",
                                "accept-language": "en-US,en;q=0.9",
                                "content-type": "application/json",
                                "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Opera GX\";v=\"102\"",
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": "\"Windows\"",
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-site"
                            },
                            "referrerPolicy": "same-origin",
                            "body": `{\"prompt\":\"${cmd.options.getString("prompt")}\",\"version\":\"c4ue22fb7kb6wlac\",\"token\":null,\"model\":\"${cmd.options.getString("type")?cmd.options.getString("type"):"photo"}\",\"negative_prompt\":\"${cmd.options.getString("negative")?cmd.options.getString("negative"):""}\"}`,
                            "method": "POST",
                            "mode": "cors",
                            "credentials": "omit"
                        }).then(d=>d.json()).then(d=>{
                            cmd.editReply({"content":`<@${cmd.user.id}>, your prompt has been completed. Images courtesy of <https://www.craiyon.com/>.`,files:d.images.map(i=>`https://img.craiyon.com/${i}`)});
                            if(storage[cmd.user.id].config.dmNotifs) cmd.user.send(`Your craiyon prompt \`${cmd.options.getString("prompt")}\` has completed. https://discord.com/channels/${cmd.guildId?cmd.guildId:"@me"}/${cmd.channelId}/${cmd.id}`);
                        });
                    }
                    catch(e){
                        cmd.editReply({"content":"Uh oh, something went wrong."});
                    }
                break;
            }
        break;
        case 'delete_message':
            if(cmd.guildId!==null&&cmd.guildId!=="0"){
                cmd.targetMessage.delete();
                if(storage[cmd.guildId].filter.log&&storage[cmd.guildId].filter.channel){
                    client.channels.cache.get(storage[cmd.guildId]).send(`Message from **${cmd.targetMessage.author.id}** deleted by **${cmd.user.username}**.\n\n${cmd.targetMessage.content}`);
                }
                cmd.reply({"content":"Success","ephemeral":true});
            }
            else if(cmd.targetMessage.author.id===client.user.id){
                cmd.targetMessage.delete();
                cmd.reply({"content":"Success","ephemeral":true});
            }
        break;
    }
    //Buttons
    switch(cmd.customId){
        case "view_filter":
            cmd.user.send({"content":`The following is the blacklist for **${cmd.guild.name}** as requested.\n\n||${storage[cmd.guild.id].filter.blacklist.join("||, ||")}||`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Success))]});
            cmd.deferUpdate();
        break;
        case "delete-all":
            cmd.message.delete();
        break;
    }
});
client.on("messageReactionAdd",async (react,user)=>{
    if(react.message.guildId===null) return;
    if(react.message.guildId!=="0"){
        if(!storage.hasOwnProperty(react.message.guildId)){
            storage[react.message.guildId]=structuredClone(defaultGuild);
            save();
        }
        if(!storage[react.message.guildId].users.hasOwnProperty(user.id)){
            storage[react.message.guildId].users[user.id]=structuredClone(defaultGuildUser);
            save();
        }
    }
    if(!storage.hasOwnProperty(user.id)){
        storage[user.id]=structuredClone(defaultUser);
        save();
    }
    if((storage[react.message.guildId].starboard.emoji===react._emoji.name||storage[react.message.guildId].starboard.emoji===react._emoji.id)&&storage[react.message.guildId].starboard.active&&storage[react.message.guildId].starboard.channel&&react.count>=storage[react.message.guildId].starboard.threshold&&!storage[react.message.guildId].starboard.posted.hasOwnProperty(react.message.id)){
        react.message.reply("I think I'm supposed to do starboard things here, huh?");
    }
});

client.on("rateLimit",async d=>{
    notify(1,"Ratelimited -\n\n"+d);
});
client.on("guildCreate",async guild=>{
    storage[guild.id]=structuredClone(defaultGuild);
    notify(1,`Added to a new server! ${guild.name}`);
    save();
});
client.on("guildDelete",async guild=>{
    notify(1,`Removed from **${guild.name}**.`);
    save();
});

client.login(process.env.token);