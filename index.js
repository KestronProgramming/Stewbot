process.env=require("./env.json");
var client;
const translate=require("@vitalets/google-translate-api").translate;
const { createCanvas } = require('canvas');
const { InworldClient, SessionToken, status } = require("@inworld/nodejs-sdk");
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType}=require("discord.js");
const bible=require("./kjv.json");
var Bible={};
var properNames={};
Object.keys(bible).forEach(book=>{
    properNames[book.toLowerCase()]=book;
    Bible[book.toLowerCase()]=bible[book];//Make everything lowercase for compatibility with sanitizing user input
});
const fs=require("fs");
var storage=require("./storage.json");
const cmds=require("./commands.json");
var needToSave=false;
function save(){
    needToSave=true;
    //fs.writeFileSync("./storage.json",JSON.stringify(storage));
}
setInterval(()=>{if(needToSave){fs.writeFileSync("./storage.json",JSON.stringify(storage))};needToSave=false;},10000);
function ll(s){
    return s.length>1999?s.slice(0,1996)+"...":s;
}
function parsePoll(c,published){
    try{
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
    catch(e){}
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
function checkHoliday(){
    function Easter(Y) {//Thanks StackOverflow :) https://stackoverflow.com/questions/1284314/easter-date-in-javascript
        var C = Math.floor(Y/100);
        var N = Y - 19*Math.floor(Y/19);
        var K = Math.floor((C - 17)/25);
        var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
        I = I - 30*Math.floor((I/30));
        I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
        var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
        J = J - 7*Math.floor(J/7);
        var L = I - J;
        var M = 3 + Math.floor((L + 40)/44);
        var D = L + 28 - 31*Math.floor(M/4);
        return M+'/'+D;
    }
    var ret="";
    var n=new Date();
    var setDates=[
        {
            "pfp":"fireworks.jpg",
            "days":["12/31","1/1"]
        },
        {
            "pfp":"valentine.jpg",
            "days":["2/14"]
        },
        {
            "pfp":"clover.jpg",
            "days":["3/17"]
        },
        {
            "pfp":"hacker.png",
            "days":["4/1"]
        },
        {
            "pfp":"birthday.jpg",
            "days":["4/19"]
        },
        {
            "pfp":"patriot.jpg",
            "days":["6/14","7/4","11/11"]
        },
        {
            "pfp":"pumpkin.jpg",
            "days":["10/31"]
        },
        {
            "pfp":"santa.jpg",
            "days":["12/1","12/2","12/3","12/4","12/5","12/6","12/7","12/8","12/9","12/10","12/11","12/12","12/13","12/14","12/15","12/16","12/17","12/18","12/19","12/20","12/21","12/22","12/23","12/24"]
        },
        {
            "pfp":"manger.png",
            "days":["12/25"]
        },
        {
            "pfp":"turkey.jpg",
            "days":["11/26"]
        }
    ];
    setDates.forEach(holiday=>{
        if(holiday.days.includes(`${n.getMonth()+1}/${n.getDate()-1}`)){
            ret="main.jpg";
        }
        if(holiday.days.includes(`${n.getMonth()+1}/${n.getDate()}`)){
            ret=holiday.pfp;
        }
    });
    if(n.getMonth()===10&&n.getDay()===4&&Math.floor(n.getDate()/7)===3){
        ret="turkey.jpg";
    }
    if(n.getMonth()===4&&n.getDay()===1&&n.getDate()+7>31){
        ret="patriot.jpg";
    }
    if(n.getMonth()+1===Easter(n.getFullYear()).split("/")[0]&&n.getDate()===Easter(n.getFullYear()).split("/")[1]){
        ret="easter.jpg";
    }
    if((n.getMonth()===10&&n.getDay()===5&&Math.floor((n.getDate()-1)/7)===3)||n.getMonth()===4&&n.getDay()===2&&(n.getDate()-1)+7>31||n.getMonth()+1===Easter(n.getFullYear()).split("/")[0]&&n.getDate()-1===Easter(n.getFullYear()).split("/")[1]){
        ret="main.jpg"
    }
    if(ret!==""){
        client.user.setAvatar(`./pfps/${ret}`);
    }
}
var helpPages=[
    {
        name:"General",
        commands:[
            {
                name:cmds.help,
                desc:"This help menu"
            },
            {
                name:cmds.ping,
                desc:"View uptime stats"
            },
            {
                name:cmds.personal_config,
                desc:"Set some options for your personal interactions with the bot"
            },
            {
                name:cmds.report_problem,
                desc:"If anything goes wrong with the bot, an error, profanity, exploit, or even just a suggestion, use this command"
            }
        ]
    },
    {
        name:"Administration",
        commands:[
            {
                name:cmds.filter,
                desc:"Configure different options for the filter, which will remove configurably blacklisted words"
            },
            {
                name:cmds.starboard_config,
                desc:"Configure starboard, which is like a highlights reel of messages with a certain amount of a specific reaction"
            },
            {
                name:`${cmds.timeout}/${cmds.kick}/${cmds.ban}`,
                desc:"Moderate a user"
            },
            {
                name:cmds.counting,
                desc:"Configure counting, so that the bot manages a collaborative count starting at 1"
            },
            {
                name:cmds.auto_roles,
                desc:"Configure automatic roles so that users can pick roles from a list and have them automatically applied"
            },
            {
                name:cmds.ticket,
                desc:"Setup a ticket system so that users can communicate directly and privately with moderators"
            },
            {
                name:cmds["auto-join-message"],
                desc:"Configure a message to be sent either in a channel or the user's DMs whenever a user joins"
            },
            {
                name:cmds.log_config,
                desc:"Automatically be notified of different server and user events you may need to know about for moderation purposes"
            },
            {
                name:cmds.admin_message,
                desc:"DM a user anonymously in the server's name"
            },
            {
                name:cmds["sticky-roles"],
                desc:"Automatically reapply roles if a user leaves and then rejoins"
            },
            {
                name:cmds.move_message,
                desc:"Move a user's message from one channel to another"
            },
            {
                name:cmds["auto-join-roles"],
                desc:"Add one or more roles to every user that joins"
            }
        ]
    },
    {
        name:"Entertainment",
        commands:[
            {
                name:cmds["fun dne"],
                desc:"Posts a picture of a person who never existed using AI"
            },
            {
                name:cmds["fun craiyon"],
                desc:"Make an image from a prompt using Dall-E Mini"
            },
            {
                name:cmds["fun rac"],
                desc:"Play a game of Rows & Columns (use command for further help)"
            },
            {
                name:cmds["fun wyr"],
                desc:"Posts a Would-You-Rather Question"
            },
            {
                name:cmds["fun joke"],
                desc:"Posts a joke"
            },
            {
                name:cmds["fun meme"],
                desc:"Posts an approved meme"
            },
            {
                name:cmds.poll,
                desc:"Helps you to make and run a poll"
            },
            {
                name:cmds.submit_meme,
                desc:"Submit a meme to be approved for the bot to post"
            },
            {
                name:cmds.rng,
                desc:"Generate a random number"
            }
        ]
    },
    {
        name:"Informational",
        commands:[
            {
                name:cmds.define,
                desc:"Defines a word"
            },
            {
                name:cmds.translate,
                desc:"Translates a word or phrase"
            },
            {
                name:cmds.view_filter,
                desc:"Posts a list of blacklisted words in this server"
            },
            {
                name:cmds.next_counting_number,
                desc:"If counting is active, the next number to post to keep it going"
            },
            {
                name:cmds.bible,
                desc:"Look up one or more verses in the King James Bible "
            }
        ]
    }
];
function noPerms(where,what){
    if(where===false||where===undefined) return false;
    switch(what){
        case "ManageMessages":
            storage[where].filter.active=false;
        break;
        case "SendMessages":
            storage[where].starboard.active=false;
            storage[where].logs.active=false;
            storage[where].counting.active=false;
            storage[where].config.ai=false;
            storage[where].config.embedPreviews=false;
            return true;
        break;
        case "ManageRoles":
            storage[where].stickyRoles=false;
        break;
        case "ReadMessageHistory"://Needed for cmd.followUp which allows me to respond to commands after the 3 second window and is more stable
            return true;
        break;
    }
    save();
    return false;
}
function checkDirty(where,what){
    if(where===false||where===undefined) return false;
    var dirty=false;
    storage[where].filter.blacklist.forEach(blockedWord=>{
        if(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig").test(what)){
            dirty=true;
        }
    });
    return dirty;
}

let rac = {
    board: [],
    lastPlayer: "Nobody",
    timePlayed: 0,
    players: [],
    icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789",
};
function getRACBoard() {
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let mess = [];
    let temp = "  ";
    for (var i=0; i<rac.board.length;i++) {
        mess.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp += ` ${racChars[i]}`;
    }
    mess.unshift(temp);
    mess=`Last Moved: <@${rac.lastPlayer}> ${(rac.timePlayed!==0?`<t:${Math.round(rac.timePlayed/1000)}:R>`:"")}\`\`\`\n${mess.join("\n")}\`\`\`\nPlayers: `;
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
        var newCol = "";
        for (var j=0;j<game.length;j++) {
            newCol+=game[j][i];
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
    for (var i=0;i<rac.players.length;i++) {
        scores[i]=score(rac.board,rac.icons[i]);
    }
    let mess=[];
    let temp="  ";
    let racChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i=0;i<rac.board.length;i++) {
        mess.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp+=` ${racChars[i]}`;
    }
    mess.unshift(temp);
    let tmpPlays=rac.players.slice(0);
    for (var i=scores.length-1;i>-1;i--) {
        for (var j=scores.length-1;j>-1;j--) {
            if (scores[j]>scores[i]) {
                scores.splice(i,1);
                tmpPlays.splice(i,1);
                j=-1;
            }
        }
    }
    mess=`Winner: <@${tmpPlays.join(">, <@")}>\`\`\`\n${mess.join("\n")}\`\`\`\nPlayers: `;
    for (var i=0; i<rac.players.length;i++) {
        mess+=`\n<@${rac.players[i]}>: \`${rac.icons[i]}\``;
    }
    return `**Rows & Columns**\n${mess}`;
}

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

const defaultGuild={
    "stickyRoles":false,
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
        "channel_events":false,
        "emoji_events":false,
        "user_change_events":false,
        "joining_and_leaving":false,
        "invite_events":false,
        "role_events":false
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
    "roles":[],
    "inServer":true,
    "countTurns":0
};
const defaultUser={
    "offenses":0,
    "config":{
        "dmOffenses":true,
        "returnFiltered":true,
        "embedPreviews":true,
        "aiPings":true
    }
};
const inps={
    "pollAdd":new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary),
    "pollDel":new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger),
    "pollLaunch":new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success),

    "pollInp":new TextInputBuilder().setCustomId("poll-addedInp").setLabel("What should the option be?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(70).setRequired(true),
    "pollNum":new TextInputBuilder().setCustomId("poll-removedInp").setLabel("Which # option should I remove?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),

    "roleAdd":new RoleSelectMenuBuilder().setCustomId("role-addOption").setMinValues(1).setMaxValues(20).setPlaceholder("Select all the roles you would like to offer"),
    "joinRoleAdd":new RoleSelectMenuBuilder().setCustomId("join-roleOption").setMinValues(1).setMaxValues(20).setPlaceholder("Select all the roles you would like to add to new users"),
    "channels":new ChannelSelectMenuBuilder().setCustomId("move-message").setChannelTypes(ChannelType.GuildText).setMaxValues(1).setMinValues(1),

    "delete":new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Danger),
    "export":new ButtonBuilder().setCustomId("export").setLabel("Export to CSV").setStyle(ButtonStyle.Primary),

    "approve":new ButtonBuilder().setCustomId("save_meme").setLabel("Approve meme").setStyle(ButtonStyle.Success)
};
const presets={
    "pollCreation":new ActionRowBuilder().addComponents(inps.pollAdd,inps.pollDel,inps.pollLaunch),
    "rolesCreation":new ActionRowBuilder().addComponents(inps.roleAdd),
    "autoJoinRoles":[new ActionRowBuilder().addComponents(inps.joinRoleAdd)],
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
    }
}
var uptime=0;
client.once("ready",()=>{
    uptime=Math.round(Date.now()/1000);
    notify(1,`Started <t:${uptime}:R>`);
    console.log(`Logged Stewbot handles into ${client.user.tag}`);
    save();
    client.user.setActivity("𝐒omething 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
    setInterval(()=>{client.user.setActivity("𝐒omething 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4)},60000*60);
    checkHoliday();
    setInterval(checkHoliday,60000*60*24);
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
    if(msg.guild){
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }

    if(storage[msg.guildId]?.filter.active){
        var foundWords=[];
        storage[msg.guildId].filter.blacklist.forEach(blockedWord=>{
            if(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig").test(msg.content)){
                foundWords.push(blockedWord);
                if(foundWords.length===1){
                    msg.ogContent=msg.content;
                }
                msg.content=msg.content.replace(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig"),"[\\_]");
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
                client.channels.cache.get(storage[msg.guildId].filter.channel).send(ll(`I have ${storage[msg.guildId].filter.censor?"censored":"deleted"} a message from **${msg.author.username}** in <#${msg.channel.id}> for the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.ogContent.replaceAll("`","\\`")}\`\`\``));
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
    var progs=msg.content.match(kaProgramRegex)||[];
    if(!storage[msg.author.id].config.embedPreviews||!storage[msg.guildId]?.config.embedPreviews){
        links=[];
        progs=[];
    }
    var embs=[];
    var fils=[];
    for(var i=0;i<links.length;i++){
        let slashes=links[i].split("channels/")[1].split("/");
        try{
            var mes=await client.channels.cache.get(slashes[slashes.length-2]).messages.fetch(slashes[slashes.length-1]);
            if(checkDirty(msg.guild?.id,mes.content)||checkDirty(msg.guild?.id,mes.author.nickname||mes.author.globalName||mes.author.username)||checkDirty(msg.guild?.id,mes.guild.name)||checkDirty(msg.guild?.id,mes.channel.name)){
                embs.push(
                    new EmbedBuilder()
                        .setColor("#006400")
                        .setTitle("Blocked by this server's filter")
                        .setDescription(`This server has blocked words that are contained in the linked message.`)
                        .setFooter({
                            text: `Blocked by this server's filter`
                        })
                );
                continue;
            }
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
        catch(e){}
    }
    if(embs.length>0) msg.reply({content:`Embedded linked message${embs.length>1?"s":""}. You can prevent this behavior by surrounding message links in \`<\` and \`>\`.`,embeds:embs,files:fils,allowedMentions:{parse:[]}});
    for(var i=0;i<progs.length;i++){
        let prog=progs[i];
        var embds=[];
        await fetch(`https://kap-archive.shipment22.repl.co/s/${prog.split("/")[prog.split("/").length-1].split("?")[0]}`).then(d=>d.json()).then(d=>{
            embds.push({
                type: "rich",
                title: d.title,
                description: `\u200b`,
                color: 0x00ff00,
                author: {
                    name: `Made by ${d.creator.nickname}`,
                    url: `https://www.khanacademy.org/profile/${d.creator.kaid}`,
                },
                fields: [
                    {
                        name: `Created`,
                        value: `${new Date(d.created).toDateString()}`,
                        inline: true
                    },
                    {
                        name: `Last Updated in Archive`,
                        value: `${new Date(d.updated).toDateString()}`,
                        inline: true
                    },
                    {
                        name: `Width/Height`,
                        value: `${d.width}/${d.height}`,
                        inline: true
                    },
                    {
                        name: `Votes`,
                        value: `${d.votes}`,
                        inline: true
                    },
                    {
                        name: `Spin-Offs`,
                        value: `${d.spinoffs}`,
                        inline: true
                    },
                ],
                image: {
                    url: `https://www.khanacademy.org/computer-programming/i/${d.id}/latest.png`,
                    height: 0,
                    width: 0,
                },
                thumbnail: {
                    url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                    height: 0,
                    width: 0,
                },
                footer: {
                    text: `Backed up to https://kap-archive.shipment22.repl.co/`,
                    icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                },
                url: `https://www.khanacademy.org/cs/i/${d.id}`
            });
        });
    }
    if(embds?.length>0){
        msg.suppressEmbeds(true);
        msg.reply({content:`Backed program${embds.length>1?"s":""} up to the KAP Archive, which you can visit [here](https://kap-archive.shipment22.repl.co/).`,embeds:embds,allowedMentions:{parse:[]}});
    }

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

    if(msg.channel instanceof DMChannel&&!msg.author.bot&&storage[msg.author.id].config.aiPings) {
        sendMessage(msg, true);
    }
    else if(msg.mentions.users.has(client.user.id)&&!msg.author.bot&&storage[msg.author.id].config.aiPings) {
        if (/^<[@|#|@&].*?>$/g.test(msg.content.replace(/\s+/g, ''))) {
            msg.content = "*User says nothing*";
        }
        if(storage[msg.guild?.id]?.config.ai){
            sendMessage(msg);
        }
    }
});
client.on("interactionCreate",async cmd=>{
    let stop=false;
    try{
	if(!cmd.isButton()&&!cmd.isModalSubmit()&&!cmd.isChannelSelectMenu()&&!cmd.isRoleSelectMenu()) await cmd.deferReply({ephemeral:["poll","auto_roles","report_problem","submit_meme","delete_message","move_message","auto-join-roles","join-roleOption"].includes(cmd.commandName)});
    }catch(e){}
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
    if(cmd.guild){
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                stop=noPerms(cmd.guild.id,perm);
            }
        });
    }
    if(stop){
        return;
    }
    try{
        var ephemCmds=["poll","auto_roles","report_problem"];
        //if(!cmd.isButton()&&!cmd.isModalSubmit()) await cmd.deferReply({ephemeral:ephemCmds.includes(cmd.commandName)});
    }
    catch(e){notify(1, e.stack)}
    //Slash Commands and Context Menus
    switch(cmd.commandName){
        //Slash Commands
        case 'ping':
            cmd.followUp(`**Online**\n- Latency: ${client.ws.ping} milliseconds\n- Last Started: <t:${uptime}:f>, <t:${uptime}:R>\n- Uptime: ${((Math.round(Date.now()/1000)-uptime)/(60*60)).toFixed(2)} hours\n- Server Count: ${client.guilds.cache.size} Servers`);
        break;
        case 'define':
            fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+cmd.options.getString("what")).then(d=>d.json()).then(d=>{
                    d = d[0];
                    let defs = [];
                    for (var i = 0; i < d.meanings.length; i++) {
                        for (var j = 0;j < d.meanings[i].definitions.length;j++) {
                            let foundOne=checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].example)||checkDirty(cmd.guild?.id,d.meanings[i].definitions[j].definition);
                            defs.push({
                                name:"Type: " +d.meanings[i].partOfSpeech,
                                value:foundOne?"Blocked by this server's filter":d.meanings[i].definitions[j].definition+(d.meanings[i].definitions[j].example?"\nExample: " +d.meanings[i].definitions[j].example:""),
                                inline: true
                            });
                        }
                    }
                    if(checkDirty(cmd.guild?.id,d.word)){
                        cmd.followUp({content:"That word is blocked by this server's filter",ephemeral:true});
                    }
                    else{
                        cmd.followUp({embeds:[{
                            type: "rich",
                            title: "Definition of "+d.word,
                            description: d.origin,
                            color: 0x00ff00,
                            fields: defs,
                            footer: {
                                text: d.phonetic,
                            }
                        }]});
                    }
                }).catch(e=>{
                    cmd.followUp("I'm sorry, I didn't find a definition for that");
                });
        break;
        case "filter":
            switch(cmd.options.getSubcommand()){
                case "add":
                    if(storage[cmd.guild.id].filter.blacklist.includes(cmd.options.getString("word"))){
                        cmd.followUp({"ephemeral":true,"content":`The word ||${cmd.options.getString("word")}|| is already in the blacklist.${storage[cmd.guild.id].filter.active?"":`To begin filtering in this server, use ${cmds['filter config']}.`}`});
                    }
                    else{
                        storage[cmd.guild.id].filter.blacklist.push(cmd.options.getString("word"));
                        cmd.followUp(`Added ||${cmd.options.getString("word")}|| to the filter for this server.${storage[cmd.guild.id].filter.active?"":`\n\nThe filter for this server is currently disabled. To enable it, use ${cmds['filter config']}.`}`);
                        save();
                    }
                break;
                case "remove":
                    if(storage[cmd.guild.id].filter.blacklist.includes(cmd.options.getString("word"))){
                        storage[cmd.guild.id].filter.blacklist.splice(storage[cmd.guild.id].filter.blacklist.indexOf(cmd.options.getString("word")),1);
                        cmd.followUp(`Alright, I have removed ||${cmd.options.getString("word")}|| from the filter.`);
                        save();
                    }
                    else{
                        cmd.followUp(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use ${cmds.view_filter} to see all filtered words.`);
                    }
                break;
                case "config":
                    storage[cmd.guild.id].filter.active=cmd.options.getBoolean("active");
                    if(cmd.options.getBoolean("censor")!==null) storage[cmd.guild.id].filter.censor=cmd.options.getBoolean("censor");
                    if(cmd.options.getBoolean("log")!==null) storage[cmd.guild.id].filter.log=cmd.options.getBoolean("log");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].filter.channel=cmd.options.getChannel("channel").id;
                    if(storage[cmd.guild.id].filter.channel==="") storage[cmd.guild.id].filter.log=false;
                    cmd.followUp(`Filter configured.${(cmd.options.getBoolean("log")&&!storage[cmd.guild.id].filter.log)?`\n\nNo channel was set to log summaries of deleted messages to, so logging these is turned off. To reenable this, run ${cmds['filter config']} again and set \`log\` to true and specify a \`channel\`.`:""}`);
                    save();
                break;
                case "import":
                    fetch(cmd.options.getAttachment("file").attachment).then(d=>d.text()).then(d=>{
                        var badWords=d.split(",");
                        let addedWords=[];
                        badWords.forEach(word=>{
                            if(!storage[cmd.guild.id].filter.blacklist.includes(word)){
                                storage[cmd.guild.id].filter.blacklist.push(word);
                                addedWords.push(word);
                            }
                        });
                        cmd.followUp(addedWords.length>0?ll(`Added the following words to the blacklist:\n- ||${addedWords.join("||\n- ||")}||`):`Unable to add any of the words to the filter. Either there aren't any in the CSV, it's not formatted right, or all of the words are in the blacklist already.`);
                        save();
                    });
                break;
            }
        break;
        case 'view_filter':
            if(storage[cmd.guild.id].filter.blacklist.length>0){
                cmd.followUp({"content":`**Warning!** There is no guarantee what kinds of words may be in the blacklist. There is a chance it could be heavily dirty or offensive. To continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
            }
            else{
                cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds['filter add']}.`);
            }
        break;
        case 'starboard_config':
            storage[cmd.guild.id].starboard.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].starboard.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getInteger("threshold")!==null) storage[cmd.guild.id].starboard.threshold=cmd.options.getInteger("threshold");
            if(cmd.options.getString("emoji")!==null) storage[cmd.guild.id].starboard.emoji=cmd.options.getString("emoji").includes(":")?cmd.options.getString("emoji").split(":")[2].split(">")[0]:cmd.options.getString("emoji");
            if(cmd.options.getString("message_type")!==null) storage[cmd.guild.id].starboard.messType=cmd.options.getString("message_type");
            if(storage[cmd.guild.id].starboard.channel==="") storage[cmd.guild.id].starboard.active=false;
            cmd.followUp(`Starboard configured.${cmd.options.getBoolean("active")&&!storage[cmd.guild.id].starboard.active?`\n\nNo channel has been set for this server, so starboard is inactive. To enable starboard, run ${cmds.starboard_config} again setting \`active\` to true and specify a \`channel\`.`:""}`);
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
                    storage[cmd.guild.id].counting.nextNum=1;
                    for(let a in storage[cmd.guild.id].users){
                        storage[cmd.guild.id].users[a].countTurns=0;
                    }
                    cmd.followUp(`Alright, I configured counting for this server.${storage[cmd.guild.id].counting.active!==cmd.options.getBoolean("active")?` It looks like no channel has been set to count in, so counting is currently disabled. Please run ${cmds['counting config']} again and set the channel to activate counting.`:`${storage[cmd.guild.id].counting.legit?"":` Please be aware this server is currently inelegible for the leaderboard. To fix this, make sure that reset is set to true, that the posts between turns is at least 1, and that you don't set the number to anything higher than 1 manually.`}`}`);
                    save();
                break;
                case "set_number":
                    storage[cmd.guild.id].counting.nextNum=cmd.options.getInteger("num");
                    if(storage[cmd.guild.id].counting.nextNum>1){
                        storage[cmd.guild.id].counting.legit=false;
                    }
                    cmd.followUp(`Alright, I've set the next number to be counted to \`${storage[cmd.guild.id].counting.nextNum}\`.${storage[cmd.guild.id].counting.legit?"":`\n\nPlease be aware that this server is currently ineligible for the leaderboard. To fix this, make sure that the number you start from is less than 2, that the posts between turns is at least 1, and that counting is configured to reset upon any mistakes.`}`);
                    save();
                break;
            }
        break;
        case 'rng':
            cmd.followUp(`I have selected a random number between **${cmd.options.getInteger("low")||1}** and **${cmd.options.getInteger("high")||10}**: **${Math.round(Math.random()*((cmd.options.getInteger("high")||10)-(cmd.options.getInteger("low")||1))+(cmd.options.getInteger("low")||1))}**`);
        break;
        case 'next_counting_number':
            cmd.followUp(storage[cmd.guild.id].counting.active?`The next number to enter ${cmd.channel.id!==storage[cmd.guild.id].counting.channel?`in <#${storage[cmd.guild.id].counting.channel}> `:""}is \`${storage[cmd.guild.id].counting.nextNum}\`.`:`Counting isn't active in this server! Use ${cmds['counting config']} to set it up.`);
        break;
        case 'counting_leaderboard':
            var leaders=[];
            for(let a in storage){
                if(storage[a].counting?.public){
                    try{
                        leaders.push([checkDirty(cmd.guild?.id,client.guilds.cache.get(a).name)?"[Blocked name]":client.guilds.cache.get(a).name,storage[a].counting.highestNum,a]);
                    }
                    catch(e){}
                }
            }
            leaders.sort((a,b)=>b[1]-a[1]);
            cmd.followUp(`**Counting Leaderboard**${leaders.slice(0,10).map((a,i)=>`\n${i+1}. ${a[0]}: \`${a[1]}\``).join("")}${cmd.guild?`\n\nYour server is in \`${leaders.map(a=>a[2]).indexOf(cmd.guild.id)+1}${leaders.map(a=>a[2]).indexOf(cmd.guild.id)===0?"st":leaders.map(a=>a[2]).indexOf(cmd.guild.id)===1?"nd":leaders.map(a=>a[2]).indexOf(cmd.guild.id)===2?"rd":"th"}\` place.`:""}`);
        break;
        case 'fun':
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
                            "X-RapidAPI-Key": "7bd6392ac6mshceb99882c34c39cp16b90cjsn985bc49d5ae1",
                            "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
                        },
                    }).then(d=>d.json()).then(async d=>{
                        let firstQues=d[0].question.split("Would you rather ")[1];
                        let firstQuest=firstQues[0].toUpperCase()+firstQues.slice(1,firstQues.length).split(" or ")[0];
                        let nextQues=firstQues.split(" or ")[1];
                        let nextQuest=nextQues[0].toUpperCase()+nextQues.slice(1,nextQues.length).split("?")[0];
                        cmd.followUp(`**Would you Rather**\n🅰️: ${firstQuest}\n🅱️: ${nextQuest}`);
                        let msg = await cmd.fetchReply();
                        msg.react("🅰️").then(msg.react("🅱️"));
                    });
                break;
                case 'joke':
                    fetch("https://v2.jokeapi.dev/joke/Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&safe-mode").then(d=>d.json()).then(d=>{
                        cmd.followUp(d.type==="single"?`${d.joke}`:`${d.setup}\n\n||${d.delivery}||`);
                    });
                break;
                case 'craiyon':
                    if(checkDirty(cmd.guild?.id,cmd.options.getString("prompt"))||checkDirty(cmd.guild?.id,cmd.options.getString("negative"))){
                        cmd.followUp({content:`This server has blocked words in your prompt`,ephemeral:true});
                        break;
                    }
                    await cmd.followUp({content:`Your request is now loading. Expected finish time <t:${Math.round(Date.now()/1000)+60}:R>`,files:["./loading.gif"]});
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
                        cmd.followUp("I'm sorry, but I don't appear to have any at the moment.");
                        break;
                    }
                    var meme;
                    try{
                        meme=cmd.options.getInteger("number")?memes.filter(m=>m.split(".")[0]===cmd.options.getInteger("number").toString())[0]:memes[Math.floor(Math.random()*memes.length)];
                    }
                    catch(e){
                        meme=memes[Math.floor(Math.random()*memes.length)];
                    }
                    cmd.followUp({content:`Meme #${meme.split(".")[0]}`,files:[`./memes/${meme}`]});
                break;
                case 'rac':
                    if(cmd.options.getInteger("start")){
                        rac={
                            board: [],
                            lastPlayer: "Nobody",
                            timePlayed: 0,
                            players: [],
                            icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789",
                        };
                        for(var k=0;k<cmd.options.getInteger("start");k++){
                            rac.board.push([]);
                            for(var j=0;j<cmd.options.getInteger("start");j++){
                                rac.board[k].push("-");
                            }
                        }
                        rac.players=[cmd.member.id];
                        cmd.followUp({content:getRACBoard(),components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin").setLabel("Join Game").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("racMove").setLabel("Make a Move").setStyle(ButtonStyle.Success))]});
                    }
                    else if(cmd.options.getBoolean("help")){
                        cmd.followUp("**Rows & Columns**\n\nIn this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n\nTo join the game, press the Join Game button.\nTo make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type `AC`).\n\nThis is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.");
                    }
                break;
            }
        break;
        case 'poll':
            if(checkDirty(cmd.guild.id,cmd.options.getString("prompt"))){
                cmd.followUp({content:"This server doesn't want me to process that prompt.","ephemeral":true});
            }
            cmd.followUp({"content":`**${cmd.options.getString("prompt")}**`,"ephemeral":true,"components":[presets.pollCreation]});
        break;
        case 'auto_roles':
            cmd.followUp({"content":`${cmd.options.getString("message")}`,"ephemeral":true,"components":[presets.rolesCreation]});
        break;
        case 'auto-join-roles':
            cmd.followUp({"content":`Select all of the roles you'd like the user to have upon joining`,'ephemeral':true,"components":presets.autoJoinRoles});
        break;
        case 'report_problem':
            notify(1,`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${cmd.options.getString("details")}\`\`\``);
            cmd.followUp({content:"I have reported the issue. Thank you.",ephemeral:true});
        break;
        case 'auto-join-message':
            storage[cmd.guild.id].ajm.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guild.id].ajm.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getString("channel_or_dm")!==null) storage[cmd.guild.id].ajm.dm=cmd.options.getString("channel_or_dm")==="dm";
            if(cmd.options.getString("message")!==null) storage[cmd.guild.id].ajm.message=cmd.options.getString("message");
            if(!storage[cmd.guild.id].ajm.dm&&storage[cmd.guild.id].ajm.channel===""||storage[cmd.guild.id].ajm.message==="") storage[cmd.guild.id].ajm.active=false;
            cmd.followUp(`Auto join messages configured.${storage[cmd.guild.id].ajm.active!==cmd.options.getBoolean("active")?` It looks like an invalid configuration was set. Make sure to specify a channel to post to if not posting to DMs, and to specify a message to send.`:""}`);
        break;
        case 'translate':
            translate(cmd.options.getString("what"),Object.assign({
                to:cmd.options.getString("language_to")||cmd.locale.slice(0,2)
            },cmd.options.getString("language_from")?cmd.options.getString("languageFrom"):{})).then(t=>{
                if(checkDirty(cmd.guild?.id,t.text)||checkDirty(cmd.guild?.id,cmd.options.getString("what"))){
                    cmd.followUp({content:`I have been asked not to translate that by this server`,ephemeral:true});
                    return;
                }
                cmd.followUp(`Attempted to translate${t.text!==cmd.options.getString("what")?`: \`${t.text}\`. If this is incorrect, try using ${cmds.translate} again and specify more.`:`, but I was unable to. Try using ${cmds.translate} again and specify more.`}`);
            });
        break;
        case 'ticket':
            cmd.followUp({embeds:[{
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
        case 'admin_message':
            cmd.options.getUser("target").send({embeds:[{
                type: "rich",
                title: cmd.guild.name,
                description: cmd.options.getString("what"),
                color: 0x006400,
                thumbnail: {
                    url: cmd.guild.iconURL(),
                    height: 0,
                    width: 0,
                },
                footer: {
                    text:`This message was sent by a moderator of ${cmd.guild.name}`
                }
            }]});
            cmd.followUp("Messaged them");
        break;
        case 'log_config':
            storage[cmd.guild.id].logs.active=cmd.options.getBoolean("active");
            storage[cmd.guild.id].logs.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getBoolean("channel_events")) storage[cmd.guild.id].logs.channel_events=cmd.options.getBoolean("channel_events");
            if(cmd.options.getBoolean("emoji_events")) storage[cmd.guild.id].logs.emoji_events=cmd.options.getBoolean("emoji_events");
            if(cmd.options.getBoolean("user_change_events")) storage[cmd.guild.id].logs.user_change_events=cmd.options.getBoolean("user_change_events");
            if(cmd.options.getBoolean("joining_and_leaving")) storage[cmd.guild.id].logs.joining_and_leaving=cmd.options.getBoolean("joining_and_leaving");
            if(cmd.options.getBoolean("invite_events")) storage[cmd.guild.id].logs.invite_events=cmd.options.getBoolean("invite_events");
            if(cmd.options.getBoolean("role_events")) storage[cmd.guild.id].logs.role_events=cmd.options.getBoolean("role_events");
            cmd.followUp("Configured log events");
            save();
        break;
        case 'sticky-roles':
            storage[cmd.guild.id].stickyRoles=cmd.options.getBoolean("active");
            cmd.followUp("Sticky roles configured. Please be aware I can only manage roles lower than my highest role in the server roles list.");
        break;
        case 'kick':
            cmd.guild.members.cache.get(cmd.options.getUser("target").id).kick(`Instructed to kick by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
        break;
        case 'timeout':
            var time=(cmd.options.getInteger("hours")*60000*60)+(cmd.options.getInteger("minutes")*60000)+(cmd.options.getInteger("seconds")*1000);
            cmd.guild.members.cache.get(cmd.options.getUser("target").id).timeout(time>0?time:60000,`Instructed to timeout by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
        break;
        case 'ban':
            cmd.guild.members.cache.get(cmd.options.getUser("target").id).ban({reason:`Instructed to ban by ${cmd.user.username}: ${cmd.options.getString("reason")}`});
        break;
        case 'help':
            cmd.followUp({content:`**General**`,embeds:[{
                "type": "rich",
                "title": `General`,
                "description": `Help Menu General Category`,
                "color": 0x006400,
                "fields": helpPages[0].commands.map(a=>{
                    return {
                        "name":a.name,
                        "value":a.desc,
                        "inline":true
                    };
                }),
                "thumbnail": {
                    "url": `https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg`,
                    "height": 0,
                    "width": 0
                },
                "footer": {
                    "text": `Help Menu for Stewbot`
                }
            }],components:[new ActionRowBuilder().addComponents(...helpPages.map(a=>
                new ButtonBuilder().setCustomId(`switch-${a.name}`).setLabel(a.name).setStyle(ButtonStyle.Primary)
            ))]});
        break;
        case 'personal_config':
            if(cmd.options.getBoolean("ai_pings")!==null) storage[cmd.user.id].config.aiPings=cmd.options.getBoolean("ai_pings");
            if(cmd.options.getBoolean("dm_infractions")!==null) storage[cmd.user.id].config.dmOffenses=cmd.options.getBoolean("dm_infractions");
            if(cmd.options.getBoolean("dm_infraction_content")!==null) storage[cmd.user.id].config.returnFiltered=cmd.options.getBoolean("dm_infraction_content");
            if(cmd.options.getBoolean("embeds")!==null) storage[cmd.user.id].config.embedPreviews=cmd.options.getBoolean("embeds");
            cmd.followUp("Configured your personal setup");
        break;
        case 'general_config':
            if(cmd.options.getBoolean("ai_pings")!==null) storage[cmd.guild.id].config.ai=cmd.options.getBoolean("ai_pings");
            if(cmd.options.getBoolean("embeds")!==null) storage[cmd.guild.id].config.embedPreviews=cmd.options.getBoolean("embeds");
            cmd.followUp("Configured your personal setup");
        break;
        case 'bible':
            let book=cmd.options.getString("book").toLowerCase();
            if(cmd.options.getString("verse").includes("-")&&+cmd.options.getString("verse").split("-")[1]>+cmd.options.getString("verse")[0]){
                try{
                    let verses=[];
                    for(var v=+cmd.options.getString("verse").split("-")[0];v<+cmd.options.getString("verse").split("-")[0]+5&&v<+cmd.options.getString("verse").split("-")[1];v++){
                        verses.push(Bible[book][cmd.options.getInteger("chapter")][v]);
                    }
                    if(verses.join(" ")===undefined){ 
                        cmd.followUp(`I'm sorry, I don't think that passage exists - at least, I couldn't find it. Perhaps something is typoed?`);
                    }
                    else{
                        cmd.followUp({content:`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,embeds:[{
                            "type": "rich",
                            "title": `${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,
                            "description": verses.join(" "),
                            "color": 0x773e09,
                            "footer": {
                                "text": `King James Version`
                            }
                        }]});
                    }
                }
                catch(e){
                    cmd.followUp(`I'm sorry, I don't think that passage exists - at least, I couldn't find it. Perhaps something is typoed?`);
                }
            }
            else{
                try{
                    if(Bible[book][cmd.options.getInteger("chapter")][+cmd.options.getString("verse")]!==undefined){
                        cmd.followUp({content:`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,embeds:[{
                            "type": "rich",
                            "title": `${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}`,
                            "description": Bible[book][cmd.options.getInteger("chapter")][+cmd.options.getString("verse")],
                            "color": 0x773e09,
                            "footer": {
                                "text": `King James Version`
                            }
                        }]});
                    }
                    else{
                        cmd.followUp(`I'm sorry, I couldn't find \`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
                    }
                }
                catch(e){
                    cmd.followUp(`I'm sorry, I couldn't find \`${properNames[book]} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
                }
            }
        break;

        //Context Menu Commands
        case 'delete_message':
            if(cmd.guild?.id){
                cmd.targetMessage.delete();
                if(storage[cmd.guild.id].filter.log&&storage[cmd.guild.id].filter.channel){
                    client.channels.cache.get(storage[cmd.guild.id]).send(`Message from **${cmd.targetMessage.author.id}** deleted by **${cmd.user.username}**.\n\n${cmd.targetMessage.content}`);
                }
                cmd.followUp({"content":"Success","ephemeral":true});
            }
            else if(cmd.targetMessage.author.id===client.user.id){
                cmd.targetMessage.delete();
                cmd.followUp({"content":"Success","ephemeral":true});
            }
        break;
        case 'move_message':
            cmd.followUp({"content":`Where do you want to move message \`${cmd.targetMessage.id}\` by **${cmd.targetMessage.author.username}**?`,"ephemeral":true,"components":[presets.moveMessage]});
        break;
        case 'submit_meme':
            if(cmd.targetMessage.attachments.size===0){
                cmd.followUp({ephemeral:true,content:"I'm sorry, but I didn't detect any attachments on that message. Note that it has to be attached (uploaded), and that I don't visit embedded links."});
                break;
            }
            cmd.followUp({content:`Submitted for evaluation`,ephemeral:true});
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
                cmd.followUp(`Attempted to translate${t.text!==cmd.targetMessage.content?`: \`${t.text}\`. If this is incorrect, try using ${cmds.translate}.`:`, but I was unable to. Try using ${cmds.translate}.`}`);
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
            cmd.user.send({"content":`The following is the blacklist for **${cmd.guild.name}** as requested.\n\n||${storage[cmd.guild.id].filter.blacklist.join("||, ||")}||`,"components":[new ActionRowBuilder().addComponents(inps.delete,inps.export)]});
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
            cmd.channel.send({content:`<@${cmd.user.id}> asks: **${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a} **0**`).join("")}`,components:[...comp,new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("poll-removeVote").setLabel("Remove vote").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("poll-closeOption"+cmd.user.id).setLabel("Close poll").setStyle(ButtonStyle.Danger))],allowedMentions:{"users":[]}}).then(msg=>{
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
                if(rac.players[i]===cmd.member.id){
                    cmd.reply({
                        content: "You can't join more than once!",
                        ephemeral: true,
                    });
                    bad=true;
                }
            }
            if(bad) break;
            rac.players.push(cmd.member.id);
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
        case "export":
            var bad=cmd.message.content.match(/\|\|\w+\|\|/gi).map(a=>a.split("||")[1]);
            fs.writeFileSync("./badExport.csv",bad.join(","));
            cmd.reply({ephemeral:true,files:["./badExport.csv"]}).then(()=>{
                fs.unlinkSync("./badExport.csv");
            });
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

        //Modals
        case 'poll-added':
            var poll=parsePoll(cmd.message.content);
            if(poll.options.length>=20){
                cmd.reply({content:"It looks like you've already generated the maximum amount of options!",ephemeral:true});
                break;
            }
            if(checkDirty(cmd.guild.id,cmd.fields.getTextInputValue("poll-addedInp"))){
                cmd.reply({ephemeral:true,content:"I have been asked not to add this option by this server"});
                break;
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
        case "moveModal":
            let cont=cmd.fields.getTextInputValue("moveMade").toUpperCase();
            readRACBoard(cmd.message.content);
            let foundOne=-1;
            for(var i=0;i<rac.players.length;i++){
                if(rac.players[i]===cmd.member.id){
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
            if((Date.now()-+rac.timePlayed)<900000&&cmd.member.id===rac.lastPlayer){
                cmd.reply({content:`I'm sorry, you can make another move after somebody else does OR <t:${Math.round((rac.timePlayed+900000)/1000)}:R>`,ephemeral:true});
                break;
            }
            if (rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])]!=="-"){
                cmd.reply({content: "That location is occupied.",ephemeral:true});
                break;
            }
            rac.lastPlayer=cmd.member.id;
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
        case 'join-roleOption':
            let myHighestRole=cmd.guild.members.cache.get(client.user.id).roles.highest.position;
            let goodRoles=[];
            let cantRoles=[];
            cmd.values.forEach(role=>{
                if(myHighestRole<=cmd.roles.get(role).rawPosition){
                    cantRoles.push(cmd.roles.get(role).id);
                }
                else{
                    goodRoles.push(cmd.roles.get(role).id);
                }
            });
            if(cantRoles.length>0){
                cmd.followUp({ephemeral:true,content:`I'm sorry, but I don't have a high enough permission to handle the following roles. If you'd like my help with these, go into Roles in the Server Settings, and drag a role I have above the roles you want me to manage.\n<@&${cantRoles.join(">, <@&")}>`,allowedMentions:{parse:[]}});
            }
            else{
                storage[cmd.guild.id].autoJoinRoles=goodRoles;
                cmd.followUp({content:`Alright, I will add these roles to new members: <@&${goodRoles.join(">, <@&")}>`,allowedMentions:{parse:[]},ephemeral:true});
                save();
            }
        break;
        case 'move-message':
            var msg=await cmd.channel.messages.fetch(cmd.message.content.split("`")[1]);
            var resp={files:[]};
            resp.content=`\`\`\`\nThis message has been moved from ${cmd.channel.name} by Stewbot.\`\`\`${msg.content}`;
            resp.username=msg.author.nickname||msg.author.globalName||msg.author.username;
            resp.avatarURL=msg.author.displayAvatarURL();
            var p=0;
            for(a of msg.attachments){
                var dots=a[1].proxyURL.split("?")[0].split(".");
                dots=dots[dots.length-1];
                await fetch(a[1].proxyURL.split("?")[0]).then(d=>d.arrayBuffer()).then(d=>{
                    fs.writeFileSync(`./tempMove/${p}.${dots}`,Buffer.from(d));
                });
                p++;
            }
            resp.files=fs.readdirSync("tempMove").map(a=>`./tempMove/${a}`);
            var hook=await client.channels.cache.get(cmd.values[0]).fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                hook.send(resp).then(()=>{
                    msg.delete();
                    fs.readdirSync("./tempMove").forEach(file=>{
                        fs.unlinkSync("./tempMove/"+file);
                    });
                });
            }
            else{
                client.channels.cache.get(cmd.values[0]).createWebhook({
                    name:"Stewbot",
                    avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                }).then(d=>{
                    d.send(resp).then(()=>{
                        msg.delete();
                        fs.readdirSync("./tempMove").forEach(file=>{
                            fs.unlinkSync("./tempMove/"+file);
                        });
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
            cmd.update({content:`**Poll Closed**\n<@${poll.starter}> asked: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guild.id].polls[cmd.message.id].options[a].length}** - ${pieCols[i][1]}`).join("")}`,components:[],allowedMentions:{"parse":[]},files:["./tempPoll.png"]});
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
    if(cmd.customId?.startsWith("switch-")){
        var newPage=helpPages.filter(a=>a.name===cmd.customId.split("switch-")[1])[0];
        cmd.update({content:`**${newPage.name}**`,embeds:[{
            "type": "rich",
            "title": newPage.name,
            "description": `Help Menu ${newPage.name} Category`,
            "color": 0x006400,
            "fields": newPage.commands.map(a=>{
                return {
                    "name":a.name,
                    "value":a.desc,
                    "inline":true
                };
            }),
            "thumbnail": {
                "url": `https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg`,
                "height": 0,
                "width": 0
            },
            "footer": {
                "text": `Help Menu for Stewbot`
            }
        }]});
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
    if(react.message.channel.id!==storage[react.message.guildId].starboard.channel&&(storage[react.message.guildId].starboard.emoji===react._emoji.name||storage[react.message.guildId].starboard.emoji===react._emoji.id)&&storage[react.message.guildId].starboard.active&&storage[react.message.guildId].starboard.channel&&!storage[react.message.guildId].starboard.posted.hasOwnProperty(react.message.id)){
        var msg=await react.message.channel.messages.fetch(react.message.id);
        if(msg.reactions.cache.get(storage[msg.guildId].starboard.emoji).count>=storage[msg.guildId].starboard.threshold){
            var resp={files:[]};
            var i=0;
            react.message.attachments.forEach((attached) => {
                let url=attached.proxyURL.toLowerCase();
                if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||storage[react.message.guild.id].starboard.messType==="0"){
                    resp.files.push(attached.proxyURL);
                }
                i++;
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
    if(!msg.guild?.id||client.user.id===msg.author?.id) return;
    if(storage[msg.guild.id]?.filter.active){
        var foundWords=[];
        storage[msg.guildId].filter.blacklist.forEach(blockedWord=>{
            if(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig").test(msg.content)){
                foundWords.push(blockedWord);
            }
        });
        if(foundWords.length>0){
            storage[msg.guild.id].users[msg.author.id].infractions++;
            if(storage[msg.guildId].filter.censor){
                msg.reply(`This post by **${msg.author.globalName||msg.author.username}** sent <t:${msg.createdTimestamp}:f> has been deleted due to retroactively editing a blocked word into the message.`);
            }
            msg.delete();
            if(storage[msg.author.id].config.dmOffenses){
                msg.author.send(ll(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to editing in the following word${foundWords.length>1?"s":""} that are in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.content.replaceAll("`","\\`")+"```":""}`));
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                client.channels.cache.get(storage[msg.guildId].filter.channel).send(ll(`I have deleted a message from **${msg.author.username}** in <#${msg.channel.id}> for editing in the following blocked word${foundWords.length>1?"s":""}": ||${foundWords.join("||, ||")}||\`\`\`\n${msg.content.replaceAll("`","\\`")}\`\`\``));
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
    }
    if(!storage[member.guild.id].users.hasOwnProperty(member.id)){
        storage[member.guild.id].users[member.id]=structuredClone(defaultGuildUser);
    }
    if(!storage.hasOwnProperty(member.id)){
        storage[member.id]=structuredClone(defaultUser);
    }
    storage[member.guild.id].users[member.id].inServer=true;
    save();

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
    var addedStickyRoles=0;
    if(storage[member.guild.id].stickyRoles){
        storage[member.guild.id].users[member.id].roles.forEach(role=>{
            try{
                var role=member.guild.roles.cache.find(r=>r.id===role);
                if(role){
                    member.roles.add(role);
                    addedStickyRoles++;
                }
            }
            catch(e){}
        });
    }
    if(addedStickyRoles===0&&storage[member.guild.id].autoJoinRoles){
        if(storage[member.guild.id].autoJoinRoles.length>0){
            storage[member.guild.id].autoJoinRoles.forEach(role=>{
                var role=member.guild.roles.cache.find(r=>r.id===role);
                if(role){
                    member.roles.add(role);
                }
            });
        }
    }
    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.joining_and_leaving){
        client.channels.cache.get(storage[member.guild.id].logs.channel).send({content:`**<@${member.id}> has joined the server.**`,allowedMentions:{parse:[]}});
    }
});
client.on("guildMemberRemove",async member=>{
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

    storage[member.guild.id].users[member.id].roles=member.roles.cache.map(r=>r.id);
    storage[member.guild.id].users[member.id].inServer=false;
    save();

    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.joining_and_leaving){
        var bans=await member.guild.bans.fetch();
        client.channels.cache.get(storage[member.guild.id].logs.channel).send({content:`**<@${member.id}> has ${bans.find(b=>b.user.id===member.id)?"been banned from":"left"} the server.**${bans.find(b=>b.user.id===member.id)?.reason!==undefined?`\n${bans.find(b=>b.user.id===member.id)?.reason}`:""}`,allowedMentions:{parse:[]}});
    }
});
client.on("channelDelete",async channel=>{
    if(!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel).send(`**Channel \`${channel.name}\` Deleted**`);
    }
});
client.on("channelUpdate",async (channelO,channel)=>{
    if(!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        var diffs=`**Channel \`${channel.name}\`${channelO.name!==channel.name?` (Previously known as \`${channelO.name}\`)`:""} Edited**`;
        Object.keys(channelO).forEach(key=>{
            if(key==="flags"||key==="permissionOverwrites"||key==="rawPosition") return;
            if(channelO[key]!==channel[key]){
                diffs+=`\n- \`${key}\``;
            }
        });
        if(diffs.endsWith("**")){
            diffs+="\n- `Permissions`";
        }
        channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel).send(diffs);
    }
});
client.on("emojiCreate",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel).send(`**Emoji :\`${emoji.name}\`: created:** <:${emoji.name}:${emoji.id}>`);
    }
});
client.on("emojiDelete",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel).send(`**Emoji :\`${emoji.name}\`: deleted.**`);
    }
});
client.on("emojiUpdate",async (emojiO,emoji)=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel).send(`**Emoji :\`${emojiO.name}\`: is now :\`${emoji.name}\`:** <:${emoji.name}:${emoji.id}>`);
    }
});
client.on("stickerCreate",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel).send({content:`**Sticker \`${sticker.name}\` created**\n- **Name**: ${sticker.name}\n- **Related Emoji**: ${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${sticker.description}`,stickers:[sticker]});
    }
});
client.on("stickerDelete",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel).send(`**Sticker \`${sticker.name}\` Deleted**`);
    }
});
client.on("stickerUpdate",async (stickerO,sticker)=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        let diffs=`**Sticker \`${sticker.name}\`${stickerO.name!==stickername?` (Previously known as \`${stickerO.name}\`)`:""} Updated**`;
        Object.keys(stickerO).forEach(key=>{
            if(stickerO[key]!==sticker.key){
                diffs+=`\n- **\`${key}\`**`;
            }
        });
        sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel).send(diffs);
    }
});
client.on("inviteCreate",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel).send({content:`**Invite \`${invite.code}\` Created**\n- Code: ${invite.code}\n- Created by <@${invite.inviterId}>\n- Channel: <#${invite.channelId}>${invite._expiresTimestamp?`\n- Expires <t:${Math.round(invite._expiresTimestamp/1000)}:R>`:``}\n- Max uses: ${invite.maxUses>0?invite.maxUses:"Infinite"}`,allowedMentions:{parse:[]}});
    }
});
client.on("inviteDelete",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel).send({content:`**Invite \`${invite.code}\` Deleted**`,allowedMentions:{parse:[]}});
    }
});
client.on("roleCreate",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        role.guild.channels.cache.get(storage[role.guild.id].logs.channel).send({content:`**Role <@&${role.id}> created**`,allowedMentions:{parse:[]}});
    }
});
client.on("roleDelete",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        role.guild.channels.cache.get(storage[role.guild.id].logs.channel).send(`**Role \`${role.name}\` Deleted**`);
    }
});
client.on("roleUpdate",async (roleO,role)=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var diffs=`**Role <@&${role.id}> Edited**`;
        Object.keys(roleO).forEach(key=>{
            if(key==="tags"||key==="permissions"||key==="flags") return;
            if(roleO[key]!==role[key]){
                diffs+=`\n- \`${key}\``;
            }
        });
        if(diffs.endsWith(`**\n- \`rawPosition\``)){
            return;
        }
        if(diffs.endsWith("**")){
            diffs+="\n- `Permissions`";
        }
        role.guild.channels.cache.get(storage[role.guild.id].logs.channel).send({content:diffs,allowedMentions:{parse:[]}});
    }
});
client.on("userUpdate",async (userO,user)=>{
    var diffs=`**User <@${user.id}> Edited Globally**`;
    Object.keys(userO).forEach(key=>{
        if(key==="tags"||key==="permissions"||key==="flags") return;
        if(userO[key]!==user[key]){
            diffs+=`\n- \`${key}\``;
        }
    });
    Object.keys(storage).forEach(entry=>{
        if(storage[entry]?.users?.[user.id]?.inServer&&storage[entry].logs.active&&storage[entry].logs.user_change_events){
            client.channels.cache.get(storage[entry].logs.channel).send({content:diffs,allowedMentions:{parse:[]}});
        }
    });
});
client.on("guildMemberUpdate",async (memberO,member)=>{
    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.user_change_events){
        var diffs=`**User <@${member.id}> Edited For This Server**`;
        Object.keys(memberO).forEach(key=>{
            if(key==="tags"||key==="permissions"||key==="flags"||key==="_roles") return;
            if(memberO[key]!==member[key]){
                diffs+=`\n- \`${key}\``;
            }
        });
        client.channels.cache.get(storage[member.guild.id].logs.channel).send({content:diffs,allowedMentions:{parse:[]}});
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

function handleException(e) {
    notify(1, e.stack);
}
process.on('unhandledRejection', handleException);
process.on('unhandledException', handleException);

client.login(process.env.token);
