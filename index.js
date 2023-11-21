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
var client;
const translate=require("@vitalets/google-translate-api").translate;
const { createCanvas } = require('canvas');
const { InworldClient, SessionToken, status } = require("@inworld/nodejs-sdk");
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType}=require("discord.js");
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
function parsePoll(c,published){
    var ret={};
    ret.title=c.split("**")[1];
    ret.options=c.match(/(?:^\d\d?\.\s).+(?:$)/gm)?.map(a=>a.slice(2).trim())||[];
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
var pieCols=[
    ["00ff00","Green"],
    ["00d7ff","Cyan"],
    ["ff0000","Red"],
    ["964b00","Brown"],
    ["ff6400","Orange"],
    ["ffffff","White"],
    ["ffff00","Yellow"],
    ["0000ff","Blue"],
    ["640064","Purple"],
    ["c0c0c0","Gray"],
    ["ff6464","Light Red"],
    ["054605","Dark Green"],
    ["ff00ff","Light Purple"],
    ["00008b","Dark Blue"],
    ["9370db","Lavender"],
    ["fa8072","Salmon"],
    ["808080","Dark Gray"],
    ["8b0000","Dark Red"],
    ["f5deb3","Wheat"],
    ["daa520","Goldenrod"]
];

//Inworld AI stuff
var curText={};
var conns = {};
var msgs={};
var lastChannels={};
var sessions=[];
function generateSessionToken(key) {
    return async () => {
        const inClient = new InworldClient().setApiKey({
            key: process.env.inworldKey,
            secret: process.env.inworldSecret
        }).setScene(process.env.inworldScene);
        const token = await inClient.generateSessionToken();
        const sessionId = sessions[key];
        const actualToken = new SessionToken({
            expirationTime: token.expirationTime,
            token: token.token,
            type: token.type,
            sessionId: sessionId || token.sessionId
        });
        if (!sessionId) {
            sessions[key] = actualToken.sessionId;
        }
        return actualToken;
    };
}
function createInWorldClient(args) {
    var inClient = new InworldClient()
        .setGenerateSessionToken(generateSessionToken(`${args.msg.author.id}`))
        .setConfiguration({
            capabilities: { audio: false },
            ...(args.dm ? {} : { connection: { disconnectTimeout: 60000 } })
        })
        .setUser({ fullName: args.msg.author.globalName||args.msg.author.username})
        .setScene(process.env.inworldScene)
        .setOnError(handleError(args.msg))
        .setOnMessage((packet) => {
            if (packet.isText() && packet.text.final) {
                curText[args.msg.author.username].push(packet.text.text.startsWith(" ")?packet.text.text.slice(1,packet.text.text.length):packet.text.text);
            }
            if(packet.control){
                if(packet.control.type==="INTERACTION_END"){
                    if(curText[args.msg.author.username].length>0){
                        msgs[args.msg.author.id].reply(curText[args.msg.author.username].join("\n").replaceAll("@","\\@"));
                    }
                    else{
                        msgs[args.msg.author.id].reply("No comment");
                    }
                    inClient.close();
                }
            }
        })
        .build();
    return inClient;
}
async function sendMessage(msg, dm) {
    curText[msg.author.username]=[];
    if (conns[msg.author.id] === null || conns[msg.author.id] === undefined || lastChannels[msg.author.id]!==msg.channel.id) {
        console.log("Made new connection for " + msg.author.tag);
        conns[msg.author.id] = createInWorldClient({ dm: dm, msg: msg });
        lastChannels[msg.author.id]=msg.channel.id;
    }
    conns[msg.author.id].sendText(`Message from ${msg.author.globalName||msg.author.username}: ${msg.content.replaceAll("<@" + client.user.id + ">", "")}`);
    msgs[msg.author.id]=msg;
}
const handleError = (msg, dm) => {
    return (err) => {
        switch (err.code) {
            case status.ABORTED:
            case status.CANCELLED:
                break;
            case status.FAILED_PRECONDITION:
                sendMessage(msg, dm);
                break;
            default:
                console.error(err);
                break;
        }
    }
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
        "posted":{},
        "messType":"0"
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
        "reset":true,
        "public":true,
        "takeTurns":1
    },
    "users":{},
    "reactionRoles":[],
    "invites":[],
    "polls":{},
    "config":{
        "embedPreviews":true,
        "ai":true
    },
    "ajm":{
        "message":"",
        "dm":true,
        "channel":"",
        "active":false
    }
};
const defaultGuildUser={
    "infractions":0,
    "stars":0,
    "invited":0
};
const defaultUser={
    "offenses":0,
    "countTurns":0,
    "config":{
        "dmOffenses":true,
        "returnFiltered":true,
        "dmNotifs":true,
        "embedPreviews":true
    }
};
const cmds=require("./commands.json");
const inps={
    "pollAdd":new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary),
    "pollDel":new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger),
    "pollLaunch":new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success),

    "pollInp":new TextInputBuilder().setCustomId("poll-addedInp").setLabel("What should the option be?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(70).setRequired(true),
    "pollNum":new TextInputBuilder().setCustomId("poll-removedInp").setLabel("Which # option should I remove?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),

    "roleAdd":new RoleSelectMenuBuilder().setCustomId("role-addOption").setMinValues(1).setMaxValues(20).setPlaceholder("Select all the roles you would like to offer"),
    "channels":new ChannelSelectMenuBuilder().setCustomId("move-message").setChannelTypes(ChannelType.GuildText).setMaxValues(1).setMinValues(1),

    "delete":new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Danger),

    "approve":new ButtonBuilder().setCustomId("save_meme").setLabel("Approve meme").setStyle(ButtonStyle.Success)
};
const presets={
    "pollCreation":new ActionRowBuilder().addComponents(inps.pollAdd,inps.pollDel,inps.pollLaunch),
    "rolesCreation":new ActionRowBuilder().addComponents(inps.roleAdd),
    "meme":[new ActionRowBuilder().addComponents(inps.approve,inps.delete)],
    "moveMessage":new ActionRowBuilder().addComponents(inps.channels),

    "pollAddModal":new ModalBuilder().setCustomId("poll-added").setTitle("Add a poll option").addComponents(new ActionRowBuilder().addComponents(inps.pollInp)),
    "pollRemModal":new ModalBuilder().setCustomId("poll-removed").setTitle("Remove a poll option").addComponents(new ActionRowBuilder().addComponents(inps.pollNum))
};
var kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(cs|computer-programming)\/[a-z,\d,-]+\/\d{1,16}(?!>)\b/gi;
var discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d{1,25})\/\d{1,25}\/\d{1,25}(?!>)\b/gi;
function getStarMsg(msg){
    var msgs=[
        `Excuse me, there is a new message.`,
        `I have detected a notification for you.`,
        `Greetings, esteemed individuals, a new message has achieved popularity.`,
        `Here's the mail it never fails`,
        `Detected popularity. Shall I put it on screen for you?`,
        `And now it's time for a word from our sponsor.`,
        `Got a message for you.`,
        `It's always a good day when @ posts`
    ];
    return `**${msgs[Math.floor(Math.random()*msgs.length)].replaceAll("@",msg.author.globalName||msg.author.username)}**`;
}

client=new Client({
    intents:Object.keys(GatewayIntentBits).map(a=>GatewayIntentBits[a]),
    partials:Object.keys(Partials).map(a=>Partials[a])
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
    client.user.setActivity("𝐒omething 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*24*31*12);
});
client.on("messageCreate",async msg=>{
    async function sendHook(what){
        var hook=await msg.channel.fetchWebhooks();
        hook=hook.find(h=>h.token);
        if(hook){
            hook.send(what);
        }
        else{
            msg.channel.createWebhook({
                name:"Stewbot",
                avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
            }).then(d=>{
                d.send(what);
            });
        }
    }
    if(msg.content==="clearStorage"&&msg.author.username==="kestron06"){
        storage={};
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
    if(storage[msg.guildId]?.filter.active){
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
                sendHook({
                    username:msg.member.nickname||msg.author.globalName||msg.author.username,
                    avatarURL:msg.member.displayAvatarURL(),
                    content:ll(`\`\`\`\nThe following message from ${msg.author.username} has been censored by Stewbot.\`\`\`${msg.content}`)
                });
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

    if(storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel&&!msg.author.bot){
        var num=msg.content.match(/^(\d|,)+(?:\b)/i);
        if(num!==null){
            num=+num[0].replaceAll(",","");
            if(num===storage[msg.guild.id].counting.nextNum){
                if(storage[msg.guild.id].users[msg.author.id].countTurns<=0){
                    msg.react("✅");
                    storage[msg.guild.id].counting.nextNum++;
                    if(storage[msg.guild.id].counting.legit&&num>storage[msg.guild.id].counting.highestNum){
                        msg.react("🎉");
                        storage[msg.guild.id].counting.highestNum=num;
                    }
                    for(let a in storage[msg.guild.id].users){
                        storage[msg.guild.id].users[a].countTurns--;
                    }
                    storage[msg.guild.id].users[msg.author.id].count++;
                    storage[msg.guild.id].users[msg.author.id].countTurns=storage[msg.guild.id].counting.takeTurns;
                    save();
                }
                else{
                    msg.react("❌");
                    msg.reply(`Nope, you need to wait for ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} to post before you post again!${storage[msg.guild.id].counting.reset?` The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`:""}`);
                    if(storage[msg.guild.id].counting.reset){
                        storage[msg.guild.id].counting.nextNum=1;
                        storage[msg.guild.id].counting.legit=true;
                        for(let a in storage[msg.guild.id].users){
                            storage[msg.guild.id].users[a].countTurns=0;
                        }
                        save();
                    }
                }
            }
            else if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.nextNum!==1){
                msg.react("❌");
                msg.reply(`Oh no, that was incorrect! The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`);
                storage[msg.guild.id].counting.nextNum=1;
                storage[msg.guild.id].counting.legit=true;
                for(let a in storage[msg.guild.id].users){
                    storage[msg.guild.id].users[a].countTurns=0;
                }
                save();
            }
        }
    }

    var links=msg.content.match(discordMessageRegex)||[];
    if(!storage[msg.author.id].config.embedPreviews||!storage[msg.guildId]?.config.embedPreviews){
        links=[];
    }
    var embs=[];
    var fils=[];
    for(var i=0;i<links.length;i++){
        let slashes=links[i].split("channels/")[1].split("/");
        try{
            var mes=await client.channels.cache.get(slashes[slashes.length-2]).messages.fetch(slashes[slashes.length-1]);
            let messEmbed = new EmbedBuilder()
                .setColor("#006400")
                .setTitle("(Jump to message)")
                .setURL(links[i])
                .setAuthor({
                    name: mes.author.nickname||mes.author.globalName||mes.author.username,
                    iconURL: "" + mes.author.displayAvatarURL(),
                    url: "https://discord.com/users/" + mes.author.id,
                })
                .setDescription(mes.content||null)
                .setTimestamp(new Date(mes.createdTimestamp))
                .setFooter({
                    text: mes.guild?.name?mes.guild.name + " / " + mes.channel.name:`DM with ${client.user.username}`,
                    iconURL: mes.guild.iconURL(),
                });
            var attachedImg=false;
            mes.attachments.forEach((attached,i) => {
                let url = attached.proxyURL;
                if(attachedImg||!(/(png|jpe?g)/i.test(url))){
                    fils.push(url);
                }
                else{
                    messEmbed.setImage(url);
                    attachedImg=true;
                }
            });
            embs.push(messEmbed);
        }
        catch(e){
            console.log(e);
        }
    }
    if(embs.length>0) msg.reply({content:`Embedded linked message${embs.length>1?"s":""}. You can prevent this behavior by surrounding message links in \`<\` and \`>\`.`,embeds:embs,files:fils});

    if(msg.channel.name?.startsWith("Ticket with ")&&!msg.author.bot){
        var resp={files:[],content:`Ticket response from **${msg.guild.name}**. To respond, make sure to reply to this message.\nTicket ID: ${msg.channel.name.split("Ticket with ")[1].split(" in ")[1]}/${msg.channel.id}`};
        msg.attachments.forEach((attached,i) => {
            let url=attached.proxyURL.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg"))){
                resp.files.push(attached.proxyURL);
            }
        });
        resp.embeds=[new EmbedBuilder()
            .setColor(0x006400)
            .setTitle(`Ticket Message from ${msg.guild.name}`)
            .setAuthor({
                name: msg.author.globalName||msg.author.username,
                iconURL:msg.author.displayAvatarURL(),
                url:`https://discord.com/users/${msg.author.id}`
            })
            .setDescription(msg.content?msg.content:"⠀")
            .setTimestamp(new Date(msg.createdTimestamp))
            .setThumbnail(msg.guild.iconURL())
            .setFooter({
                text: "Make sure to reply to this message to respond",
            })
            .setImage(msg.attachments.first()?msg.attachments.first().proxyURL:null)
        ];
        client.users.cache.get(msg.channel.name.split("Ticket with ")[1].split(" in ")[0]).send(resp);
    }
    if(msg.reference&&msg.channel instanceof DMChannel){
        var rmsg=await msg.channel.messages.fetch(msg.reference.messageId);
        if(rmsg.author.id===client.user.id&&rmsg.content.includes("Ticket ID: ")){
            var resp={
                content:msg.content,
                username:msg.author.nickname||msg.author.globalName||msg.author.username,
                avatar_url:msg.author.displayAvatarURL()
            };
            var hook=await client.channels.cache.get(rmsg.content.split("Ticket ID: ")[1].split("/")[0]).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                fetch(`https://discord.com/api/webhooks/${hook.id}/${hook.token}?thread_id=${rmsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(resp),
                }).then(d=>d.text());
            }
            else{
                client.channels.cache.get(rmsg.content.split("Ticket ID: ")[1].split("/")[0]).createWebhook({
                    name:"Stewbot",
                    avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                }).then(d=>{
                    fetch(`https://discord.com/api/webhooks/${d.id}/${d.token}?thread_id=${rmsg.content.split("Ticket ID:")[1].split("/")[1]}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(resp),
                    });
                });
            }
            return;
        }
    }

    if (msg.channel instanceof DMChannel&&!msg.author.bot) {
        sendMessage(msg, true);
    }
    else if (msg.mentions.users.has(client.user.id)&&!msg.author.bot) {
        if (/^<[@|#|@&].*?>$/g.test(msg.content.replace(/\s+/g, ''))) {
            msg.content = "*User says nothing*";
        }
        sendMessage(msg);
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

    //Slash Commands and Context Menu Commands
    switch(cmd.commandName){
        //Slash Commands
        case 'ping':
            cmd.reply(`**Online**\n- Latency: ${client.ws.ping} milliseconds\n- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n- Uptime: ${((Math.round(Date.now()/1000)-uptime)/(60*60)).toFixed(2)} hours\n- Server Count: ${client.guilds.cache.size} Servers`);
        break;
        case 'define':
            fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what")).then(d=>d.json()).then(d=>{
                    d = d[0];
                    let defs = [];
                    for (var i = 0; i < d.meanings.length; i++) {
                        for (var j = 0;j < d.meanings[i].definitions.length;j++) {
                            let foundOne=false;
                            if(storage[cmd.guild.id.filter.active]){
                                storage[cmd.guild.id].filter.blacklist.forEach(blockedWord=>{
                                    if(new RegExp(`([^\\D]|\\b)${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?([^\\D]|\\b)`,"ig").test(`${cmd.meanings[i].definitions[j]}`)){
                                        foundOne=true;
                                    }
                                });
                            }
                            defs.push({
                                name:"Type: " +d.meanings[i].partOfSpeech,
                                value:foundOne?"Blocked by this server's filter":d.meanings[i].definitions[j].definition+(d.meanings[i].definitions[j].example?"\nExample: " +d.meanings[i].definitions[j].example:""),
                                inline: true
                            });
                        }
                    }
                    cmd.reply({embeds:[{
                        type: "rich",
                        title: "Definition of "+d.word,
                        description: d.origin,
                        color: 0x00ff00,
                        fields: defs,
                        footer: {
                            text: d.phonetic,
                        }
                    }]});
                }).catch(e=>{
                    cmd.reply("I'm sorry, I didn't find a definition for that");
                });
        break;
        case "filter":
            switch(cmd.options.getSubcommand()){
                case "add":
                    if(storage[cmd.guild.id].filter.blacklist.includes(cmd.options.getString("word"))){
                        cmd.reply({"ephemeral":true,"content":`The word ||${cmd.options.getString("word")}|| is already in the blacklist.${storage[cmd.guild.id].filter.active?"":`To begin filtering in this server, use ${cmds['filter config']}.`}`});
                    }
                    else{
                        storage[cmd.guild.id].filter.blacklist.push(cmd.options.getString("word"));
                        cmd.reply(`Added ||${cmd.options.getString("word")}|| to the filter for this server.${storage[cmd.guild.id].filter.active?"":`\n\nThe filter for this server is currently disabled. To enable it, use ${cmds['filter config']}.`}`);
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
                        cmd.reply(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use ${cmds.view_filter} to see all filtered words.`);
                    }
                break;
                case "config":
                    storage[cmd.guild.id].filter.active=cmd.options.getBoolean("active");
                    if(cmd.options.getBoolean("censor")!==null) storage[cmd.guild.id].filter.censor=cmd.options.getBoolean("censor");
                    if(cmd.options.getBoolean("log")!==null) storage[cmd.guild.id].filter.log=cmd.options.getBoolean("log");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].filter.log=cmd.options.getChannel("channel").id;
                    if(storage[cmd.guild.id].filter.channel==="") storage[cmd.guild.id].filter.log=false;
                    cmd.reply(`Filter configured.${(cmd.options.getBoolean("log")&&!storage[cmd.guild.id].filter.log)?`\n\nNo channel was set to log summaries of deleted messages to, so logging these is turned off. To reenable this, run ${cmds['filter config']} again and set \`log\` to true and specify a \`channel\`.`:""}`);
                    save();
                break;
            }
        break;
        case 'view_filter':
            if(storage[cmd.guild.id].filter.blacklist.length>0){
                cmd.reply({"content":`**Warning!** There is no guarantee what kinds of words may be in the blacklist. There is a chance it could be heavily dirty or offensive. To continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
            }
            else{
                cmd.reply(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds['filter add']}.`);
            }
        break;
        case 'starboard_config':
            storage[cmd.guild.id].starboard.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].starboard.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getInteger("threshold")!==null) storage[cmd.guild.id].starboard.threshold=cmd.options.getInteger("threshold");
            if(cmd.options.getString("emoji")!==null) storage[cmd.guild.id].starboard.emoji=cmd.options.getString("emoji").includes(":")?cmd.options.getString("emoji").split(":")[2].split(">")[0]:cmd.options.getString("emoji");
            if(cmd.options.getString("message_type")!==null) storage[cmd.guild.id].starboard.messType=cmd.options.getString("message_type");
            if(storage[cmd.guild.id].starboard.channel==="") storage[cmd.guild.id].starboard.active=false;
            cmd.reply(`Starboard configured.${cmd.options.getBoolean("active")&&!storage[cmd.guild.id].starboard.active?`\n\nNo channel has been set for this server, so starboard is inactive. To enable starboard, run ${cmds.starboard_config} again setting \`active\` to true and specify a \`channel\`.`:""}`);
            save();
        break;
        case 'counting':
            switch(cmd.options.getSubcommand()){
                case "config":
                    storage[cmd.guild.id].counting.active=cmd.options.getBoolean("active");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].counting.channel=cmd.options.getChannel("channel").id;
                    if(cmd.options.getBoolean("public")!==null) storage[cmd.guild.id].counting.public=cmd.options.getBoolean("public");
                    if(cmd.options.getInteger("posts_between_turns")!==null) storage[cmd.guild.id].counting.takeTurns=cmd.options.getInteger("posts_between_turns");
                    if(!storage[cmd.guild.id].counting.channel) storage[cmd.guild.id].counting.active=false;
                    if(!storage[cmd.guild.id].counting.reset||storage[cmd.guild.id].counting.takeTurns<1) storage[cmd.guild.id].counting.legit=false;
                    cmd.reply(`Alright, I configured counting for this server.${storage[cmd.guild.id].counting.active!==cmd.options.getBoolean("active")?` It looks like no channel has been set to count in, so counting is currently disabled. Please run ${cmds['counting config']} again and set the channel to activate counting.`:`${storage[cmd.guild.id].counting.legit?` Please be aware this server is currently inelegible for the leaderboard. To fix this, make sure that reset is set to true, that the posts between turns is at least 1, and that you don't set the number to anything higher than 1 manually.`:""}`}`);
                    save();
                break;
                case "set_number":
                    storage[cmd.guild.id].counting.nextNum=cmd.options.getInteger("num");
                    if(storage[cmd.guild.id].counting.nextNum>1){
                        storage[cmd.guild.id].counting.legit=false;
                    }
                    cmd.reply(`Alright, I've set the next number to be counted to \`${storage[cmd.guild.id].counting.nextNum}\`.${storage[cmd.guild.id].counting.legit?"":`\n\nPlease be aware that this server is currently ineligible for the leaderboard. To fix this, make sure that the number you start from is less than 2, that the posts between turns is at least 1, and that counting is configured to reset upon any mistakes.`}`);
                    save();
                break;
            }
        break;
        case 'next_counting_number':
            cmd.reply(storage[cmd.guild.id].counting.active?`The next number to enter ${cmd.channel.id!==storage[cmd.guild.id].counting.channel?`in <#${storage[cmd.guild.id].counting.channel}> `:""}is \`${storage[cmd.guild.id].counting.nextNum}\`.`:`Counting isn't active in this server! Use ${cmds['counting config']} to set it up.`);
        break;
        case 'counting_leaderboard':
            var leaders=[];
            for(let a in storage){
                if(storage[a].counting?.public){
                    leaders.push([client.guilds.cache.get(a).name,storage[a].counting.highestNum,a]);
                }
            }
            leaders.sort((a,b)=>b[1]-a[1]);
            cmd.reply(`**Counting Leaderboard**${leaders.slice(0,10).map((a,i)=>`\n${i+1}. ${a[0]}: \`${a[1]}\``).join("")}${cmd.guild?`\n\nYour server is in \`${leaders.map(a=>a[2]).indexOf(cmd.guild.id)+1}${leaders.map(a=>a[2]).indexOf(cmd.guild.id)===0?"st":leaders.map(a=>a[2]).indexOf(cmd.guild.id)===1?"nd":leaders.map(a=>a[2]).indexOf(cmd.guild.id)===2?"rd":"th"}\` place.`:""}`);
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
                case 'joke':
                    fetch("https://v2.jokeapi.dev/joke/Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&safe-mode").then(d=>d.json()).then(d=>{
                        cmd.reply(d.type==="single"?`${d.joke}`:`${d.setup}\n\n||${d.delivery}||`);
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
                            if(storage[cmd.user.id].config.dmNotifs) cmd.user.send(`Your ${cmds['fun craiyon']} prompt \`${cmd.options.getString("prompt")}\` has completed. https://discord.com/channels/${cmd.guild?.id?cmd.guild.id:"@me"}/${cmd.channelId}/${cmd.id}`);
                        });
                    }
                    catch(e){
                        cmd.editReply({"content":"Uh oh, something went wrong."});
                    }
                break;
                case 'meme':
                    var memes=fs.readdirSync("./memes");
                    if(memes.length===0){
                        cmd.reply("I'm sorry, but I don't appear to have any at the moment.");
                        break;
                    }
                    var meme;
                    try{
                        meme=cmd.options.getInteger("number")?memes.filter(m=>m.split(".")[0]===cmd.options.getInteger("number").toString()):memes[Math.floor(Math.random()*memes.length)];
                    }
                    catch(e){
                        meme=memes[Math.floor(Math.random()*memes.length)];
                    }
                    cmd.reply({content:`Meme #${meme.split(".")[0]}`,files:[`./memes/${meme}`]});
                break;
            }
        break;
        case 'poll':
            cmd.reply({"content":`**${cmd.options.getString("prompt")}**`,"ephemeral":true,"components":[presets.pollCreation]});
        break;
        case 'auto_roles':
            cmd.reply({"content":`${cmd.options.getString("message")}`,"ephemeral":true,"components":[presets.rolesCreation]});
        break;
        case 'report_problem':
            notify(1,`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${cmd.options.getString("details")}\`\`\``);
            cmd.reply({content:"I have reported the issue. Thank you.",ephemeral:true});
        break;
        case 'auto-join-message':
            storage[cmd.guild.id].ajm.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].ajm.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getString("channel_or_dm")!==null) storage[cmd.guild.id].ajm.dm=cmd.options.getString("channel_or_dm")==="dm";
            if(cmd.options.getString("message")!==null) storage[cmd.guild.id].ajm.message=cmd.options.getString("message");
            if(!storage[cmd.guild.id].ajm.dm&&storage[cmd.guild.id].ajm.channel===""||storage[cmd.guild.id].ajm.message==="") storage[cmd.guild.id].ajm.active=false;
            cmd.reply(`Auto join messages configured.${storage[cmd.guild.id].ajm.active!==cmd.options.getBoolean("active")?` It looks like an invalid configuration was set. Make sure to specify a channel to post to if not posting to DMs, and to specify a message to send.`:""}`);
        break;
        case 'translate':
            translate(cmd.options.getString("what"),Object.assign({
                to:cmd.options.getString("language_to")||cmd.locale.slice(0,2)
            },cmd.options.getString("language_from")?cmd.options.getString("languageFrom"):{})).then(t=>{
                cmd.reply(`Attempted to translate${t.text!==cmd.options.getString("what")?`: \`${t.text}\`. If this is incorrect, try using ${cmds.translate} again and specify more.`:`, but I was unable to. Try using ${cmds.translate} again and specify more.`}`);
            });
        break;
        case 'ticket':
            cmd.reply({embeds:[{
                "type": "rich",
                "title": `${cmd.guild.name} Moderator Tickets`,
                "description": `Press the button below to open up a private ticket with ${cmd.guild.name} moderators.`,
                "color": 0x006400,
                "thumbnail": {
                    "url": cmd.guild.iconURL(),
                    "height": 0,
                    "width": 0
                },
                "footer": {
                    "text": `Tickets will take place over DMs, make sure to have DMs open to ${client.user.username}.`
                }
            }],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ticket-${cmd.options.getChannel("channel").id}`).setLabel("Create private ticket with staff").setStyle(ButtonStyle.Success))]});
        break;

        //Context Menu Commands
        case 'delete_message':
            if(cmd.guild?.id){
                cmd.targetMessage.delete();
                if(storage[cmd.guild.id].filter.log&&storage[cmd.guild.id].filter.channel){
                    client.channels.cache.get(storage[cmd.guild.id]).send(`Message from **${cmd.targetMessage.author.id}** deleted by **${cmd.user.username}**.\n\n${cmd.targetMessage.content}`);
                }
                cmd.reply({"content":"Success","ephemeral":true});
            }
            else if(cmd.targetMessage.author.id===client.user.id){
                cmd.targetMessage.delete();
                cmd.reply({"content":"Success","ephemeral":true});
            }
        break;
        case 'move_message':
            cmd.reply({"content":`Where do you want to move message \`${cmd.targetMessage.id}\` by **${cmd.targetMessage.author.username}**?`,"ephemeral":true,"components":[presets.moveMessage]});
        break;
        case 'submit_meme':
            if(cmd.targetMessage.attachments.size===0){
                cmd.reply({ephemeral:true,content:"I'm sorry, but I didn't detect any attachments on that message. Note that it has to be attached (uploaded), and that I don't visit embedded links."});
                break;
            }
            cmd.reply({content:`Submitted for evaluation`,ephemeral:true});
            let i=0;
            for(a of cmd.targetMessage.attachments){
                var dots=a[1].proxyURL.split("?")[0].split(".");
                dots=dots[dots.length-1];
                if(!["mov","png","jpg","jpeg","gif","mp4","mp3","wav","webm","ogg"].includes(dots)){
                    cmd.reply({content:`I don't support/recognize the file extension \`.${dots}\``,ephemeral:true});
                    return;
                }
                await fetch(a[1].proxyURL.split("?")[0]).then(d=>d.arrayBuffer()).then(d=>{
                    fs.writeFileSync(`./tempMemes/${i}.${dots}`,Buffer.from(d));
                });
                i++;
            }
            await client.channels.cache.get(process.env.noticeChannel).send({content:ll(`User ${cmd.user.username} submitted a meme for evaluation.`),files:fs.readdirSync("./tempMemes").map(a=>`./tempMemes/${a}`),components:presets.meme});
            fs.readdirSync("./tempMemes").forEach(file=>{
                fs.unlinkSync("./tempMemes/"+file);
            });
        break;
        case 'translate_message':
            translate(cmd.targetMessage.content,{
                to:cmd.locale.slice(0,2)
            }).then(t=>{
                cmd.reply(`Attempted to translate${t.text!==cmd.targetMessage.content?`: \`${t.text}\`. If this is incorrect, try using ${cmds.translate}.`:`, but I was unable to. Try using ${cmds.translate}.`}`);
            });
        break;
    }
    //Buttons, Modals, and Select Menus
    switch(cmd.customId){
        //Buttons
        case "save_meme":
            cmd.message.attachments.forEach(a=>{
                var dots=a.proxyURL.split("?")[0].split(".");
                dots=dots[dots.length-1];
                if(!["mov","png","jpg","jpeg","gif","mp4","mp3","wav","webm","ogg"].includes(dots)){
                    cmd.reply({content:`I don't support or recognize that format (\`.${dots}\`)`,ephemeral:true});
                    return;
                }
                fetch(a.proxyURL.split("?")[0]).then(d=>d.arrayBuffer()).then(d=>{
                    fs.writeFileSync(`./memes/${fs.readdirSync("./memes").length}.${dots}`,Buffer.from(d));
                });
            });
            cmd.update({components:[]});
            cmd.message.react("✅");
        break;
        case "view_filter":
            cmd.user.send({"content":`The following is the blacklist for **${cmd.guild.name}** as requested.\n\n||${storage[cmd.guild.id].filter.blacklist.join("||, ||")}||`,"components":[new ActionRowBuilder().addComponents(inps.delete)]});
            cmd.deferUpdate();
        break;
        case "delete-all":
            cmd.message.delete();
        break;
        case 'poll-addOption':
            cmd.showModal(presets.pollAddModal);
        break;
        case 'poll-delOption':
            cmd.showModal(presets.pollRemModal);
        break;
        case 'poll-publish':
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
            cmd.channel.send({content:`<@${cmd.user.id}> asks: **${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a} **0**`).join("")}`,components:[...comp,new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("poll-removeVote").setLabel("Remove vote").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("poll-closeOption"+cmd.user.id).setLabel("Close poll").setStyle(ButtonStyle.Danger))],allowedMentions:[]}).then(msg=>{
                var t={};
                poll.options.forEach(option=>{
                    t[option]=[];
                });
                poll.options=structuredClone(t);
                storage[cmd.guild.id].polls[msg.id]=structuredClone(poll);
                save();
            });
            cmd.update({"content":"\u200b",components:[]});
        break;

        //Modals
        case 'poll-added':
            var poll=parsePoll(cmd.message.content);
            if(poll.options.length>=20){
                cmd.reply("It looks like you've already generated the maximum amount of options!");
                return;
            }
            poll.options.push(cmd.fields.getTextInputValue("poll-addedInp"));
            cmd.update(`**${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a}`).join("")}`);
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
        case 'poll-removeVote':
            var poll=parsePoll(cmd.message.content,true);
            var keys=Object.keys(storage[cmd.guild.id].polls[cmd.message.id].options);
            for(var i=0;i<keys.length;i++){
                if(storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].includes(cmd.user.id)){
                    storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].splice(storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].indexOf(cmd.user.id),1);
                    i--;
                }
            }
            save();

            var finalResults={};
            var totalVotes=0;
            keys.forEach(a=>{
                totalVotes+=storage[cmd.guild.id].polls[cmd.message.id].options[a].length;
            });
            keys.forEach(a=>{
                if(storage[cmd.guild.id].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guild.id].polls[cmd.message.id].options[a].length);
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
                ctx.stroke();
            });
            fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
            cmd.update({content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guild.id].polls[cmd.message.id].options[a].length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,files:["./tempPoll.png"]});
        break;

        //Select Menus
        case 'role-addOption':
            let myRole=cmd.guild.members.cache.get(client.user.id).roles.highest.position;
            var badRoles=[];
            var rows=[];
            var tempRow=[];
            cmd.values.forEach(role=>{
                tempRow.push(new ButtonBuilder().setCustomId("autoRole-"+role).setLabel(cmd.roles.get(role).name).setStyle(ButtonStyle.Success));
                if(myRole<=cmd.roles.get(role).rawPosition){
                    badRoles.push(cmd.roles.get(role).name);
                }
                if(tempRow.length===5){
                    rows.push(new ActionRowBuilder().addComponents(...tempRow));
                    tempRow=[];
                }
            });
            if(tempRow.length>0) rows.push(new ActionRowBuilder().addComponents(...tempRow));
            if(badRoles.length===0){
                cmd.channel.send({"content":`**Auto-Roles**\n${cmd.message.content}`,"components":rows});
                cmd.update({"content":"\u200b",components:[]});
            }
            else{
                cmd.reply({ephemeral:true,content:ll(`I'm sorry, but I can't help with the following roles as I don't have high enough permissions to. If you'd like me to offer these roles, visit Server Settings and make sure I have a role listed above the following roles. You can do this by dragging the order around or adding roles.\n\n${badRoles.map(a=>`- **${a}**`).join("\n")}`)});
            }
        break;
        case 'move-message':
            var msg=await cmd.channel.messages.fetch(cmd.message.content.split("`")[1]);
            var resp={};
            resp.content=`\`\`\`\nThis message has been moved from ${cmd.channel.name} by Stewbot.\`\`\`${msg.content}`;
            resp.username=msg.author.nickname||msg.author.globalName||msg.author.username;
            resp.avatarURL=msg.author.displayAvatarURL();
            var hook=await client.channels.cache.get(cmd.values[0]).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                hook.send(resp).then(()=>{
                    msg.delete();
                });
            }
            else{
                client.channels.cache.get(cmd.values[0]).createWebhook({
                    name:"Stewbot",
                    avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                }).then(d=>{
                    d.send(resp).then(()=>{
                        msg.delete();
                    });
                });
            }
            cmd.update({"content":"\u200b",components:[]});
        break;
    }
    if(cmd.customId?.startsWith("poll-closeOption")){
        if(cmd.user.id===cmd.customId.split("poll-closeOption")[1]||cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
            var poll=parsePoll(cmd.message.content,true);
            var keys=Object.keys(storage[cmd.guild.id].polls[cmd.message.id].options);
            var finalResults={};
            var totalVotes=0;
            keys.forEach(a=>{
                totalVotes+=storage[cmd.guild.id].polls[cmd.message.id].options[a].length;
            });
            keys.forEach(a=>{
                if(storage[cmd.guild.id].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guild.id].polls[cmd.message.id].options[a].length);
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
                ctx.stroke();
            });
            fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
            cmd.update({content:`**Poll Closed**\n<@${poll.starter}> asked: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guild.id].polls[cmd.message.id].options[a].length}** - ${pieCols[i][1]}`).join("")}`,components:[],allowedMentions:[],files:["./tempPoll.png"]});
            delete storage[cmd.guild.id].polls[cmd.message.id];
            save();
        }
        else{
            cmd.reply({"ephemeral":true,"content":"You didn't start this poll and you don't have sufficient permissions to override this."});
        }
    }
    if(cmd.customId?.startsWith("voted")){
        var poll=parsePoll(cmd.message.content,true);
        var choice=poll.choices[+cmd.customId.split('voted')[1]];
        var keys=Object.keys(storage[cmd.guild.id].polls[cmd.message.id].options);
        for(var i=0;i<keys.length;i++){
            if(storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].includes(cmd.user.id)){
                storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].splice(storage[cmd.guild.id].polls[cmd.message.id].options[keys[i]].indexOf(cmd.user.id),1);
                i--;
            }
        }
        storage[cmd.guild.id].polls[cmd.message.id].options[choice].push(cmd.user.id);

        var finalResults={};
        var totalVotes=0;
        keys.forEach(a=>{
            totalVotes+=storage[cmd.guild.id].polls[cmd.message.id].options[a].length;
        });
        keys.forEach(a=>{
            if(storage[cmd.guild.id].polls[cmd.message.id].options[a].length>0) finalResults[a]=((360/totalVotes)*storage[cmd.guild.id].polls[cmd.message.id].options[a].length);
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
            ctx.stroke();
        });
        fs.writeFileSync("./tempPoll.png",canvas.toBuffer("image/png"));
        cmd.update({content:`<@${poll.starter}> asks: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guild.id].polls[cmd.message.id].options[a].length}**${finalResults.hasOwnProperty(a)?` - ${pieCols[i][1]}`:""}`).join("")}`,files:["./tempPoll.png"]});
        save();
    }
    if(cmd.customId?.startsWith("autoRole-")){
        let id=cmd.customId.split("autoRole-")[1];
        let role=cmd.guild.roles.cache.get(id);
        if(!cmd.member.roles.cache.find(r=>r.id===id)){
            cmd.member.roles.add(role);
        }
        else{
            cmd.member.roles.remove(role);
        }
        cmd.deferUpdate();
    }
    if(cmd.customId?.startsWith("ticket-")){
        client.channels.cache.get(cmd.customId.split("-")[1]).send(`Ticket opened by **${cmd.member.nickname||cmd.user.globalName||cmd.user.username}**.`).then(msg=>{
            msg.startThread({
                name:`Ticket with ${cmd.user.id} in ${cmd.customId.split("-")[1]}`,
                autoArchiveDuration:60,
                type:"GUILD_PUBLIC_THREAD",
                reason:`Ticket opened by ${cmd.user.username}`
            });
            cmd.user.send(`Ticket opened in **${cmd.guild.name}**. You can reply to this message to converse in the ticket. Note that any messages not a reply will not be sent to the ticket.\n\nTicket ID: ${cmd.customId.split("-")[1]}/${msg.id}`);
        });
        cmd.deferUpdate();
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
    if((storage[react.message.guildId].starboard.emoji===react._emoji.name||storage[react.message.guildId].starboard.emoji===react._emoji.id)&&storage[react.message.guildId].starboard.active&&storage[react.message.guildId].starboard.channel&&!storage[react.message.guildId].starboard.posted.hasOwnProperty(react.message.id)){
        var msg=await react.message.channel.messages.fetch(react.message.id);
        if(msg.reactions.cache.get(storage[msg.guildId].starboard.emoji).count>=storage[msg.guildId].starboard.threshold){
            var resp={files:[]};
            react.message.attachments.forEach((attached,i) => {
                let url=attached.proxyURL.toLowerCase();
                if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||storage[cmd.guild.id].starboard.messType==="0"){
                    resp.files.push(attached.proxyURL);
                }
            });
            if(storage[react.message.guild.id].starboard.messType==="0"){
                resp.content=react.message.content;
                resp.username=react.message.author.globalName||react.message.author.username;
                resp.avatarURL=react.message.author.displayAvatarURL();
                var hook=await client.channels.cache.get(storage[react.message.guild.id].starboard.channel).fetchWebhooks();
                hook=hook.find(h=>h.token);
                if(hook){
                    hook.send(resp).then(h=>{
                        storage[react.message.guild.id].starboard.posted[react.message.guild.id]=`webhook${h.id}`;
                    });
                }
                else{
                    client.channels.cache.get(storage[react.message.guild.id].starboard.channel).createWebhook({
                        name:"Stewbot",
                        avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                    }).then(d=>{
                        d.send(resp).then(h=>{
                            storage[react.message.guild.id].starboard.posted[react.message.id]=`webhook${h.id}`;
                        });
                    });
                }
            }
            else{
                resp.embeds=[new EmbedBuilder()
                    .setColor(0x006400)
                    .setTitle("(Jump to message)")
                    .setURL(`https://www.discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id}`)
                    .setAuthor({
                        name: react.message.author.globalName||react.message.author.username,
                        iconURL:react.message.author.displayAvatarURL(),
                        url:`https://discord.com/users/${react.message.author.id}`
                    })
                    .setDescription(react.message.content?react.message.content:"⠀")
                    .setTimestamp(new Date(react.message.createdTimestamp))
                    .setFooter({
                        text: react.message.channel.name,
                        iconURL:"https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
                    })
                    .setImage(react.message.attachments.first()?react.message.attachments.first().proxyURL:null)
                ];
                if(storage[react.message.guild.id].starboard.messType==="1"){
                    resp.content=getStarMsg(react.message);
                }
                client.channels.cache.get(storage[react.message.guild.id].starboard.channel).send(resp).then(d=>{
                    storage[react.message.guild.id].starboard.posted[react.message.id]=d.id;
                });
            }
            storage[react.message.guild.id].users[react.message.author.id].stars++;
            save();
        }
    }
});
client.on("messageDelete",async msg=>{
    if(!msg.guild?.id) return;
    if(storage[msg.guild.id]?.starboard.posted.hasOwnProperty(msg.id)){
        if(storage[msg.guild.id].starboard.posted[msg.id].startsWith("webhook")){
            var c=await client.channels.cache.get(storage[msg.guild.id].starboard.channel).messages.fetch(storage[msg.guild.id].starboard.posted[msg.id].split("webhook")[1]);
            c.delete();
        }
        else{
            var c=await client.channels.cache.get(storage[msg.guild.id].starboard.channel).messages.fetch(storage[msg.guild.id].starboard.posted[msg.id]);
            c.edit({content:`I'm sorry, but it looks like this post by **${msg.author.globalName||msg.author.username}** was deleted.`,embeds:[],files:[]});
        }
    }
});
client.on("messageUpdate",async (msgO,msg)=>{
    if(!msg.guild?.id) return;
    if(storage[msg.guild.id]?.filter.active){
        var foundWords=[];
        storage[msg.guildId].filter.blacklist.forEach(blockedWord=>{
            if(new RegExp(`([^\\D]|\\b)${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?([^\\D]|\\b)`,"ig").test(msg.content)){
                foundWords.push(blockedWord);
            }
        });
        if(foundWords.length>0){
            storage[msg.guildId].users[msg.author.id].infractions++;
            if(storage[msg.guildId].filter.censor){
                msg.reply(`This post by **${msg.author.globalName||msg.author.username}** sent <t:${msg.createdTimestamp}:f> has been deleted due to retroactively editing a blocked word into the message.`);
            }
            msg.delete();
            if(storage[msg.author.id].config.dmOffenses){
                msg.author.send(ll(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to editing in the following word${foundWords.length>1?"s":""} that are in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.content.replaceAll("`","\\`")+"```":""}`));
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                client.channels.cache.get(ll(storage[msg.guildId].filter.channel).send(`I have deleted a message from **${msg.author.username}** in <#${msg.channel.id}> for editing in the following blocked word${foundWords.length>1?"s":""}": ||${foundWords.join("||, ||")}||\`\`\`\n${msg.content.replaceAll("`","\\`")}\`\`\``));
            }
            save();
            return;
        }
    }
    if(storage[msg.guild.id]?.starboard.posted.hasOwnProperty(msg.id)&&!storage[msg.guild.id].starboard.posted[msg.id]?.startsWith("webhook")){
        var resp={files:[]};
        msg.attachments.forEach((attached,i) => {
            let url=attached.proxyURL.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||storage[cmd.guild.id].starboard.messType==="0"){
                resp.files.push(attached.proxyURL);
            }
        });
        resp.embeds=[new EmbedBuilder()
            .setColor(0x006400)
            .setTitle("(Jump to message)")
            .setURL(`https://www.discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`)
            .setAuthor({
                name: msg.author.globalName||msg.author.username,
                iconURL:msg.author.displayAvatarURL(),
                url:`https://discord.com/users/${msg.author.id}`
            })
            .setDescription(msg.content?msg.content:"⠀")
            .setTimestamp(new Date(msg.createdTimestamp))
            .setFooter({
                text: msg.channel.name,
                iconURL:"https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
            })
            .setImage(msg.attachments.first()?msg.attachments.first().proxyURL:null)
        ];
        if(storage[msg.guild.id].starboard.messType==="1"){
            resp.content=getStarMsg(msg);
        }
        var c=await client.channels.cache.get(storage[msg.guild.id].starboard.channel).messages.fetch(storage[msg.guild.id].starboard.posted[msg.id]);
        c.edit(resp);
    }
});
client.on("guildMemberAdd",async member=>{
    if(!storage.hasOwnProperty(member.guild.id)){
        storage[member.guild.id]=structuredClone(defaultGuild);
        save();
    }
    if(!storage[member.guild.id].users.hasOwnProperty(member.id)){
        storage[member.guild.id].users[member.id]=structuredClone(defaultGuildUser);
        save();
    }
    if(!storage.hasOwnProperty(member.id)){
        storage[member.id]=structuredClone(defaultUser);
        save();
    }

    if(storage[member.guild.id].ajm.active){
        if(storage[member.guild.id].ajm.dm){
            member.send({embeds:[{
                type: "rich",
                title: member.guild.name,
                description: storage[member.guild.id].ajm.message.replaceAll("${@USER}",`<@${member.id}>`),
                color: 0x006400,
                thumbnail: {
                    url: member.guild.iconURL(),
                    height: 0,
                    width: 0,
                },
                footer: {text:`This message was sent from ${member.guild.name}`},
            }]});
        }
        else{
            var resp={
                content:storage[member.guild.id].ajm.message.replaceAll("${@USER}",`<@${member.id}>`),
                username:member.guild.name,
                avatarURL:member.guild.iconURL()
            };
            var hook=await client.channels.cache.get(storage[member.guild.id].ajm.channel).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                hook.send(resp);
            }
            else{
                client.channels.cache.get(storage[react.message.guild.id].starboard.channel).createWebhook({
                    name:"Stewbot",
                    avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                }).then(d=>{
                    d.send(resp);
                });
            }
        }
    }
});

client.on("rateLimit",async d=>{
    notify(1,"Ratelimited -\n\n"+d);
});
client.on("guildCreate",async guild=>{
    if(!storage.hasOwnProperty(guild.id)){
        storage[guild.id]=structuredClone(defaultGuild);
        save();
    }
    notify(1,`Added to **${guild.name}**!`);
});
client.on("guildDelete",async guild=>{
    notify(1,`Removed from **${guild.name}**.`);
});

client.login(process.env.token);