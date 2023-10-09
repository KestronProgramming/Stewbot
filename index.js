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
const {Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCOmmandBuilder, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle}=require("discord.js");
const fs=require("fs");
const express=require("express");
const path=require("path");
const site=new express();
site.listen(80);
site.use(express.static(path.join(__dirname,"./static")));
const storage=require("./storage.json");
function save(){
    fs.writeFileSync("./storage.json",JSON.stringify(storage));
}
function objCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

const defaultGuild={
    "filter":{
        "blacklist":[],
        "active":false,
        "censor":true,
        "logOffenses":"",
        "whitelist":[]
    },
    "starboard":{
        "channel":"",
        "emoji":"⭐",
        "active":false,
        "threshold":3
    },
    "logs":{
        "channel":"",
        "active":"",
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
    "plugins":{
        "entertainment":true,
        "social":true,
        "informational":true,
        "miis":true,
        "goombaSquad":true,
        "ai":true
    },
    "users":[]
};
const defaultGuildUser={
    "offenses":0,
    "stars":0
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
    }
};

const client=new Client({intents:Object.keys(GatewayIntentBits).map((a)=>{
    return GatewayIntentBits[a]
})});
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
    console.log(`Logged into ${client.user.tag}`);
    save();
});
client.on("messageCreate",async msg=>{

});
client.on("interactionCreate",async cmd=>{
    switch(cmd.commandName){
        case 'ping':
            cmd.reply(`**Online**\n- Latency: ${client.ws.ping} milliseconds\n- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n- Uptime: ${((Math.round(Date.now()/1000)-uptime)/(1000*60*60)).toFixed(2)} hours`);
        break;
    }
});

client.on("rateLimit",async d=>{
    notify(1,"Ratelimited -\n\n"+d);
});
client.on("guildCreate",async guild=>{
    storage[guild.id]=objCopy(defaultGuild);
    notify(1,"Added to a new server! "+guild.name);
    save();
});

client.login(process.env.token);