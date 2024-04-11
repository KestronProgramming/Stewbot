process.env=require("./env.json");
var client;
const translate=require("@vitalets/google-translate-api").translate;
const crypto = require('crypto');
const { createCanvas } = require('canvas');
const { InworldClient, SessionToken, status } = require("@inworld/nodejs-sdk");
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder}=require("discord.js");
const bible=require("./kjv.json");
var Bible={};
var properNames={};
Object.keys(bible).forEach(book=>{
    properNames[book.toLowerCase()]=book;
    Bible[book.toLowerCase()]=bible[book];//Make everything lowercase for compatibility with sanitizing user input
});
const ignoreSize = 10 + Object.keys(Bible).reduce((a, b) => a.length > b.length ? a : b).length;
const threshold = 3;
function levenshtein(s, t) {
    if (s === t) {
        return 0;
    }
    var n = s.length, m = t.length;
    if (n === 0 || m === 0) {
        return n + m;
    }
    var x = 0, y, a, b, c, d, g, h, k;
    var p = new Array(n);
    for (y = 0; y < n;) {
        p[y] = ++y;
    }
    for (; (x + 3) < m; x += 4) {
        var e1 = t.charCodeAt(x);
        var e2 = t.charCodeAt(x + 1);
        var e3 = t.charCodeAt(x + 2);
        var e4 = t.charCodeAt(x + 3);
        c = x;
        b = x + 1;
        d = x + 2;
        g = x + 3;
        h = x + 4;
        for (y = 0; y < n; y++) {
            k = s.charCodeAt(y);
            a = p[y];
            if (a < c || b < c) {
                c = (a > b ? b + 1 : a + 1);
            }
            else {
                if (e1 !== k) {
                    c++;
                }
            }
            if (c < b || d < b) {
                b = (c > d ? d + 1 : c + 1);
            }
            else {
                if (e2 !== k) {
                    b++;
                }
            }
            if (b < d || g < d) {
                d = (b > g ? g + 1 : b + 1);
            }
            else {
                if (e3 !== k) {
                    d++;
                }
            }
            if (d < g || h < g) {
                g = (d > h ? h + 1 : d + 1);
            }
            else {
                if (e4 !== k) {
                    g++;
                }
            }
            p[y] = h = g;
            g = d;
            d = b;
            b = c;
            c = a;
        }
    }
    for (; x < m;) {
        var e = t.charCodeAt(x);
        c = x;
        d = ++x;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || d < c) {
                d = (a > d ? d + 1 : a + 1);
            }
            else {
                if (e !== s.charCodeAt(y)) {
                    d = c + 1;
                }
                else {
                    d = c;
                }
            }
            p[y] = d;
            c = a;
        }
        h = d;
    }
    return h;
}
function getClosest(input) {
    if (Object.keys(Bible).includes(input)) return input;
    if (input.length > ignoreSize) return null;

    var best = [null, Infinity]; // [bestOption, bestThreshold]
    for (option of Object.keys(Bible)) {
        const editsNeeded = levenshtein(option, input)
        if (editsNeeded < best[1]) {
            best = [option, editsNeeded]
        }
    }

    if (best[1] < threshold) return best[0];
    else return null;
}
const fs=require("fs");
var storage=require("./storage.json");
const cmds=require("./commands.json");
const m8ballResponses=["So it would seem","Yes","No","Perhaps","Absolutely","Positively","Unfortunately","I am unsure","I do not know","Absolutely not","Possibly","More likely than not","Unlikely","Probably not","Probably","Maybe","Random answers is not the answer"];
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
var pieCols=[
    ["006400","Green"],
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
                name:cmds["random rng"],
                desc:"Generate a random number"
            },
            {
                name:cmds["random coin-flip"],
                desc:"Flip a number of coins"
            },
            {
                name:cmds["random 8-ball"],
                desc:"Receive a random answer to a question"
            },
            {
                name:cmds.leaderboard,
                desc:"View one of the leaderboards or rank cards"
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
        case "ManageRoles":
            storage[where].stickyRoles=false;
        break;
        case "ManageWebhooks":
            storage[where].filter.censor=false;
        break;
    }
    save();
}
function checkDirty(where,what){
    if(where===false||where===undefined) return false;
    var dirty=false;
    storage[where].filter.blacklist.forEach(blockedWord=>{
        if(blockedWord.match(/^\<\:\w+\:\d+\>$/)){//Reduce custom emojis to their base
            var blockedWord2=`:${blockedWord.split(":")[1]}:`;
            if(new RegExp(`\\b${blockedWord2}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig").test(what)||what===blockedWord2){
                dirty=dirty?dirty.replace(new RegExp(`\\b${blockedWord2}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig"),"[\\_]"):what.replace(new RegExp(`\\b${blockedWord2}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig"),"[\\_]");
            }
        }
        if(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig").test(what)||what===blockedWord){
            dirty=dirty?dirty.replace(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig"),"[\\_]"):what.replace(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual)?\\b`,"ig"),"[\\_]");
        }
    });
    return dirty;
}
function getAwayCard(embed,user,guild,global){
    if(embed){
        var daUser=client.users.cache.get(user);
        var daEmb={
            "type": "rich",
            "title": `Unavailable`,
            "color": 0xff0000,
            "author": {
                "name": `${daUser.globalName||daUser.username}`,
                "icon_url": `${daUser.displayAvatarURL()}`
            },
            "footer": {
                "text": `Set up using /unavailable`
            }
        };
        if(global){
            daEmb.description=checkDirty(guild,storage[user].gone.message.message)?checkDirty(guild,storage[user].gone.message):storage[user].gone.message;
        }
        else{
            daEmb.description=checkDirty(guild,storage[guild].users[user].gone.message)?checkDirty(guild,storage[guild].users[user].gone.message):storage[guild].users[user].gone.message;
        }
        return daEmb;
    }
    else{
        if(global){
            return checkDirty(guild,storage[user].gone.message)?checkDirty(guild,storage[user].gone.message):storage[user].gone.message;
        }
        else{
            return checkDirty(guild,storage[guild].users[user].gone.message)?checkDirty(guild,storage[guild].users[user].gone.message):storage[guild].users[user].gone.message;
        }
    }
}
function getLvl(lvl){
    var total=0;
    while(lvl>-1){
        total+=5*(lvl*lvl)+(50*lvl)+100;
        lvl--;
    }
    return total;
}

var started24=false;
function daily(){
    if(!started24){
        setInterval(daily,60000*60*24);
        started24=true;
    }
    checkHoliday();
    var dailyDevo=[];
    fetch("https://www.biblegateway.com/devotionals/niv-365-devotional/today").then(d=>d.text()).then(d=>{
        var temp=d.split(`<div class="col-xs-12">`)[1].split("</div>")[0].trim().replace(/\<\/?h\d\>/ig,"**").replace(/\<\/?p\>/ig,"\n").replace(/\<\/?(u|o)l\>/ig,"").replace(/\<li\>/ig,"\n- ").replace(/\<\/(li|br)\>/g,"").replace(/\<a.*?\<\/a\>/ig,a=>`[${a.match(/(?<=\>).*(?=\<\/a\>)/)}](<${a.split(`href="`)[1].split(`"`)[0]}>)`).split("\n");
        var cc=0;
        var cOn=0;
        var now=new Date();
        temp.forEach(t=>{
            if(cc+t.length>4000){
                dailyDevo[cOn]={
                    "type": "rich",
                    "title": `The NIV 365 Day Devotional`,
                    "description": dailyDevo[cOn].startsWith("undefined")?dailyDevo[cOn].slice(9):dailyDevo[cOn],
                    "color": 0x773e09,
                    "url": `https://www.biblegateway.com/devotionals/niv-365-devotional/2024/today`,
                    "footer":{
                        "text":`Bible Gateway, ${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`
                    }
                };
                cOn++;
                dailyDevo.push("");
                cc=0;
            }
            cc+=t.length;
            dailyDevo[cOn]+=`${t}\n`;
        });
        dailyDevo[dailyDevo.length-1]={
            "type": "rich",
            "title": `The NIV 365 Day Devotional`,
            "description": dailyDevo[cOn].startsWith("undefined")?dailyDevo[cOn].slice(9):dailyDevo[cOn],
            "color": 0x773e09,
            "url": `https://www.biblegateway.com/devotionals/niv-365-devotional/today`,
            "footer":{
                "text":`Bible Gateway, ${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`
            }
        }
        Object.keys(storage).forEach(s=>{
            if(storage[s]?.daily?.devos?.active){
                var c=client.channels.cache.get(storage[s].daily.devos.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({embeds:dailyDevo});
                }
                else{
                    storage[s].daily.devos.active=false;
                }
            }
        });
    });
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
        .setGenerateSessionToken(generateSessionToken(`${args.cmd?args.msg.user.id:args.msg.author.id}`))
        .setConfiguration({
            capabilities: { audio: false },
            ...(args.dm ? {} : { connection: { disconnectTimeout: 60000 } })
        })
        .setUser({ fullName: args.cmd?args.msg.user.username:args.msg.author.globalName||args.msg.author.username})
        .setScene(process.env.inworldScene)
        .setOnError(handleError(args.msg))
        .setOnMessage((packet) => {
            if (packet.isText() && packet.text.final) {
                curText[args.cmd?args.msg.user.username:args.msg.author.username].push(packet.text.text.startsWith(" ")?packet.text.text.slice(1,packet.text.text.length):packet.text.text);
            }
            if(packet.control){
                if(packet.control.type==="INTERACTION_END"&&!args.cmd){
                    if(curText[args.msg.author.username].length>0){
                        msgs[args.msg.author.id].reply({content:checkDirty(args.msg.guild?.id,curText[args.msg.author.username].join("\n"))?checkDirty(args.msg.guild?.id,curText[args.msg.author.username].join("\n").replaceAll("@","\\@")):curText[args.msg.author.username].join("\n").replaceAll("@","\\@"),allowedMentions:{parse:[]}});
                    }
                    else{
                        msgs[args.msg.author.id].reply("No comment");
                    }
                    inClient.close();
                }
                else if(packet.control.type==="INTERACTION_END"){
                    if(curText[args.msg.user.username].length>0){
                        msgs[args.msg.user.id].followUp({content:curText[args.msg.user.username].join("\n").replaceAll("@","\\@"),allowedMentions:{parse:[]}});
                    }
                    else{
                        msgs[args.msg.user.id].followUp("No comment");
                    }
                    inClient.close();
                }
            }
        })
        .build();
    return inClient;
}
async function sendMessage(msg, dm, cmd) {
    if(!cmd){
        curText[msg.author.username]=[];
        if (conns[msg.author.id] === null || conns[msg.author.id] === undefined || lastChannels[msg.author.id]!==(msg.channel?.id||"private")||Date.now()-conns[msg.author.id].lastMsg>60000*30) {
            conns[msg.author.id] = createInWorldClient({ dm: dm, msg: msg });
            lastChannels[msg.author.id]=msg.channel?.id||"private";
        }
        conns[msg.author.id].sendText(`Message from ${msg.author.globalName||msg.author.username}: ${msg.content.replaceAll(`<@${client.user.id}>`, client.user.username)}`);
        conns[msg.author.id].lastMsg=Date.now();
        msgs[msg.author.id]=msg;
    }
    else{
        curText[msg.user.username]=[];
        if (conns[msg.user.id] === null || conns[msg.user.id] === undefined || lastChannels[msg.user.id]!=="private"||Date.now()-conns[msg.user.id].lastMsg>60000*30) {
            conns[msg.user.id] = createInWorldClient({ cmd:cmd, msg:msg });
            lastChannels[msg.user.id]="private";
        }
        conns[msg.user.id].sendText(`Message from ${msg.user.globalName||msg.user.username}: ${msg.options.getString("what").replaceAll(`<@${client.user.id}>`, client.user.username)}`);
        conns[msg.user.id].lastMsg=Date.now();
        msgs[msg.user.id]=msg;
    }
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
    "daily":{
        "memes":{
            "active":false,
            "channel":""
        },
        "wyrs":{
            "active":false,
            "channel":""
        },
        "jokes":{
            "active":false,
            "channel":""
        },
        "devos":{
            "active":false,
            "channel":""
        },
        "verses":{
            "active":false,
            "channel":""
        },
        "qotd":{
            "active":false,
            "channel":""
        }
    },
    "stickyRoles":false,
    "levels":{
        "active":false,
        "channel":"",
        "msg":"Congratulations ${USERNAME}, you have leveled up to level ${LVL}!",
        "location":"DM"
    },
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
        "role_events":false,
        "mod_actions":false
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
        "message":"Greetings ${@USER}! Welcome to the server!",
        "dm":true,
        "channel":"",
        "active":false
    },
    "alm":{
        "message":"Farewell ${@USER}. We'll miss you.",
        "channel":"",
        "active":false
    }
};
const defaultGuildUser={
    "infractions":0,
    "stars":0,
    "roles":[],
    "inServer":true,
    "countTurns":0,
    "exp":0,
    "expTimeout":0,
    "lvl":0,
    "beenCountWarned":false,
    "gone":{
        "active":false,
        "message":"I'm not available right now",
        "until":0,
        "autoOff":false
    }
};
const defaultUser={
    "offenses":0,
    "config":{
        "dmOffenses":true,
        "returnFiltered":true,
        "embedPreviews":true,
        "aiPings":true,
        "levelUpMsgs":true,
        "timeOffset":0,
        "hasSetTZ":false
    },
    "gone":{
        "active":false,
        "message":"I'm not available right now",
        "until":0,
        "autoOff":false
    }
};
const inps={
    "pollAdd":new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary),
    "pollDel":new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger),
    "pollLaunch":new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success),
    "pollVoters":new ButtonBuilder().setCustomId("poll-voters").setLabel("View voters").setStyle(ButtonStyle.Primary),

    "pollInp":new TextInputBuilder().setCustomId("poll-addedInp").setLabel("What should the option be?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(70).setRequired(true),
    "pollNum":new TextInputBuilder().setCustomId("poll-removedInp").setLabel("Which # option should I remove?").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),

    "roleAdd":new RoleSelectMenuBuilder().setCustomId("role-addOption").setMinValues(1).setMaxValues(20).setPlaceholder("Select all the roles you would like to offer"),
    "joinRoleAdd":new RoleSelectMenuBuilder().setCustomId("join-roleOption").setMinValues(1).setMaxValues(20).setPlaceholder("Select all the roles you would like to add to new users"),
    "channels":new ChannelSelectMenuBuilder().setCustomId("move-message").setChannelTypes(ChannelType.GuildText).setMaxValues(1).setMinValues(1),

    "delete":new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Danger),
    "export":new ButtonBuilder().setCustomId("export").setLabel("Export to CSV").setStyle(ButtonStyle.Primary),

    "approve":new ButtonBuilder().setCustomId("save_meme").setLabel("Approve meme").setStyle(ButtonStyle.Success),

    "tzUp":new ButtonBuilder().setCustomId("tzUp").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
    "tzDown":new ButtonBuilder().setCustomId("tzDown").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
    "tzSave":new ButtonBuilder().setCustomId("tzSave").setEmoji("✅").setStyle(ButtonStyle.Success),

    "tsHour":new ButtonBuilder().setCustomId("tsHour").setLabel("Hour").setStyle(ButtonStyle.Primary),
    "tsMinutes":new ButtonBuilder().setCustomId("tsMinutes").setLabel("Minutes").setStyle(ButtonStyle.Primary),
    "tsSeconds":new ButtonBuilder().setCustomId("tsSeconds").setLabel("Seconds").setStyle(ButtonStyle.Primary),
    "tsMonth":new StringSelectMenuBuilder().setCustomId("tsMonth").setPlaceholder("Month...").addOptions(
            new StringSelectMenuOptionBuilder().setLabel("January").setDescription("January").setValue("0"),
            new StringSelectMenuOptionBuilder().setLabel("February").setDescription("February").setValue("1"),
            new StringSelectMenuOptionBuilder().setLabel("March").setDescription("March").setValue("2"),
            new StringSelectMenuOptionBuilder().setLabel("April").setDescription("April").setValue("3"),
            new StringSelectMenuOptionBuilder().setLabel("May").setDescription("May").setValue("4"),
            new StringSelectMenuOptionBuilder().setLabel("June").setDescription("June").setValue("5"),
            new StringSelectMenuOptionBuilder().setLabel("July").setDescription("July").setValue("6"),
            new StringSelectMenuOptionBuilder().setLabel("August").setDescription("August").setValue("7"),
            new StringSelectMenuOptionBuilder().setLabel("September").setDescription("September").setValue("8"),
            new StringSelectMenuOptionBuilder().setLabel("October").setDescription("October").setValue("9"),
            new StringSelectMenuOptionBuilder().setLabel("November").setDescription("November").setValue("10"),
            new StringSelectMenuOptionBuilder().setLabel("December").setDescription("December").setValue("11")
        ),
    "tsDay":new ButtonBuilder().setCustomId("tsDay").setLabel("Day").setStyle(ButtonStyle.Primary),
    "tsYear":new ButtonBuilder().setCustomId("tsYear").setLabel("Year").setStyle(ButtonStyle.Primary),
    "tsType":new StringSelectMenuBuilder().setCustomId("tsType").setPlaceholder("Display Type...").addOptions(
            new StringSelectMenuOptionBuilder().setLabel("Relative").setDescription("Example: 10 seconds ago").setValue("R"),
            new StringSelectMenuOptionBuilder().setLabel("Short Time").setDescription("Example: 1:48 PM").setValue("t"),
            new StringSelectMenuOptionBuilder().setLabel("Short Date").setDescription("Example: 4/19/22").setValue("d"),
            new StringSelectMenuOptionBuilder().setLabel("Short Time w/ Seconds").setDescription("Example: 1:48:00 PM").setValue("T"),
            new StringSelectMenuOptionBuilder().setLabel("Long Date").setDescription("Example: April 19, 2022").setValue("D"),
            new StringSelectMenuOptionBuilder().setLabel("Long Date & Short Time").setDescription("April 19, 2022 at 1:48 PM").setValue("f"),
            new StringSelectMenuOptionBuilder().setLabel("Full Date").setDescription("Example: Tuesday, April 19, 2022 at 1:48 PM").setValue("F")
        ),

    "howToCopy":new ButtonBuilder().setCustomId("howToCopy").setLabel("How to Copy").setStyle(ButtonStyle.Danger),
    "onDesktop":new ButtonBuilder().setCustomId("onDesktop").setLabel("On Desktop").setStyle(ButtonStyle.Success),

    "tsHourModal":new TextInputBuilder().setCustomId("tsHourInp").setLabel("The hour of day...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(4).setRequired(true),
    "tsMinutesModal":new TextInputBuilder().setCustomId("tsMinutesInp").setLabel("The minutes...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),
    "tsSecondsModal":new TextInputBuilder().setCustomId("tsSecondsInp").setLabel("The seconds...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),
    "tsDayModal":new TextInputBuilder().setCustomId("tsDayInp").setLabel("The day of the month...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true),
    "tsYearModal":new TextInputBuilder().setCustomId("tsYearInp").setLabel("The year...").setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(4).setRequired(true),
    "tsAmPm":new TextInputBuilder().setCustomId("tsAmPm").setLabel("If you used 12 hour, AM/PM").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(false),

    "captcha0":new ButtonBuilder().setCustomId("captcha-0").setLabel("0").setStyle(ButtonStyle.Primary),
    "captcha1":new ButtonBuilder().setCustomId("captcha-1").setLabel("1").setStyle(ButtonStyle.Primary),
    "captcha2":new ButtonBuilder().setCustomId("captcha-2").setLabel("2").setStyle(ButtonStyle.Primary),
    "captcha3":new ButtonBuilder().setCustomId("captcha-3").setLabel("3").setStyle(ButtonStyle.Primary),
    "captcha4":new ButtonBuilder().setCustomId("captcha-4").setLabel("4").setStyle(ButtonStyle.Primary),
    "captcha5":new ButtonBuilder().setCustomId("captcha-5").setLabel("5").setStyle(ButtonStyle.Primary),
    "captcha6":new ButtonBuilder().setCustomId("captcha-6").setLabel("6").setStyle(ButtonStyle.Primary),
    "captcha7":new ButtonBuilder().setCustomId("captcha-7").setLabel("7").setStyle(ButtonStyle.Primary),
    "captcha8":new ButtonBuilder().setCustomId("captcha-8").setLabel("8").setStyle(ButtonStyle.Primary),
    "captcha9":new ButtonBuilder().setCustomId("captcha-9").setLabel("9").setStyle(ButtonStyle.Primary),
    "captchaBack":new ButtonBuilder().setCustomId("captcha-back").setEmoji("❌").setStyle(ButtonStyle.Danger),
    "captchaDone":new ButtonBuilder().setCustomId("captcha-done").setEmoji("✅").setStyle(ButtonStyle.Success)
};
const presets={
    "pollCreation":new ActionRowBuilder().addComponents(inps.pollAdd,inps.pollDel,inps.pollLaunch),
    "rolesCreation":new ActionRowBuilder().addComponents(inps.roleAdd),
    "autoJoinRoles":[new ActionRowBuilder().addComponents(inps.joinRoleAdd)],
    "meme":[new ActionRowBuilder().addComponents(inps.approve,inps.delete)],
    "moveMessage":new ActionRowBuilder().addComponents(inps.channels),
    "tzConfig":[new ActionRowBuilder().addComponents(inps.tzUp,inps.tzDown,inps.tzSave)],
    "timestamp":[new ActionRowBuilder().addComponents(inps.tsHour,inps.tsMinutes,inps.tsSeconds,inps.tsDay,inps.tsYear),new ActionRowBuilder().addComponents(inps.tsMonth),new ActionRowBuilder().addComponents(inps.tsType),new ActionRowBuilder().addComponents(inps.howToCopy,inps.onDesktop)],

    "pollAddModal":new ModalBuilder().setCustomId("poll-added").setTitle("Add a poll option").addComponents(new ActionRowBuilder().addComponents(inps.pollInp)),
    "pollRemModal":new ModalBuilder().setCustomId("poll-removed").setTitle("Remove a poll option").addComponents(new ActionRowBuilder().addComponents(inps.pollNum)),

    "tsHourModal":new ModalBuilder().setCustomId("tsHourModal").setTitle("Set the Hour for the Timestamp").addComponents(new ActionRowBuilder().addComponents(inps.tsHourModal),new ActionRowBuilder().addComponents(inps.tsAmPm)),
    "tsMinutesModal":new ModalBuilder().setCustomId("tsMinutesModal").setTitle("Set the Minutes for the Timestamp").addComponents(new ActionRowBuilder().addComponents(inps.tsMinutesModal)),
    "tsSecondsModal":new ModalBuilder().setCustomId("tsSecondsModal").setTitle("Set the Seconds for the Timestamp").addComponents(new ActionRowBuilder().addComponents(inps.tsSecondsModal)),
    "tsDayModal":new ModalBuilder().setCustomId("tsDayModal").setTitle("Set the Day for the Timestamp").addComponents(new ActionRowBuilder().addComponents(inps.tsDayModal)),
    "tsYearModal":new ModalBuilder().setCustomId("tsYearModal").setTitle("Set the Year for the Timestamp").addComponents(new ActionRowBuilder().addComponents(inps.tsYearModal)),

    "captcha":[new ActionRowBuilder().addComponents(inps.captcha1,inps.captcha2,inps.captcha3),new ActionRowBuilder().addComponents(inps.captcha4,inps.captcha5,inps.captcha6),new ActionRowBuilder().addComponents(inps.captcha7,inps.captcha8,inps.captcha9),new ActionRowBuilder().addComponents(inps.captchaBack,inps.captcha0,inps.captchaDone)]
};

var kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(cs|computer-programming)\/[a-z,\d,-]+\/\d+(?!>)\b/gi;
var discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d+)\/\d+\/\d+(?!>)\b/gi;
var spotifyTrackRegex=/\bhttps?:\/\/open\.spotify\.com\/track\/\w+(\b|\?)/gi;
var spotifyAlbumRegex=/\bhttps?:\/\/open\.spotify\.com\/album\/\w+(\b|\?)/gi;
var spotifyPlaylistRegex=/\bhttps?:\/\/open\.spotify\.com\/playlist\/\w+(\b|\?)/gi;
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
    return `**${msgs[Math.floor(Math.random()*msgs.length)].replaceAll("@",msg.author?.globalName||msg.author?.username||"this person")}**`;
}

var ints=Object.keys(GatewayIntentBits).map(a=>GatewayIntentBits[a]);
ints.splice(ints.indexOf(GatewayIntentBits.GuildPresences),1);
ints.splice(ints.indexOf("GuildPresences"),1);
client=new Client({
    intents:ints,
    partials:Object.keys(Partials).map(a=>Partials[a])
});
function notify(urgencyLevel,what){
    try{switch(urgencyLevel){
        default:
        case 0:
            client.users.cache.get(process.env.ownerId).send(what);//Notify Kestron06 directly
        break;
        case 1:
            client.channels.cache.get(process.env.noticeChannel).send(what);//Notify the staff of the Kestron Support server
        break;
    }}catch(e){}
}
var logQueue={};
var uptime=0;
var statTog=0;

//Actionable events
client.once("ready",async ()=>{
    uptime=Math.round(Date.now()/1000);
    notify(1,`Started <t:${uptime}:R>`);
    console.log(`Logged Stewbot handles into ${client.user.tag}`);
    save();
    client.user.setActivity("It's a `/secret` to everybody",{type:ActivityType.Custom},1000*60*60*4);
    setInterval(()=>{
        statTog++;
        if(statTog>11){
            client.user.setActivity("It's a `/secret` to everybody",{type:ActivityType.Custom},1000*60*60*4);
            statTog=0;
        }
        else{
            client.user.setActivity("𝐒teward 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
        }
    },60000*5);
    var now=new Date();
    setTimeout(daily,((now.getHours()>11?11+24-now.getHours():11-now.getHours())*(60000*60))+((60-now.getMinutes())*60000));
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
            if(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual|y)?\\b`,"ig").test(msg.content)){
                foundWords.push(blockedWord);
                if(foundWords.length===1){
                    msg.ogContent=msg.content;
                }
                msg.content=msg.content.replace(new RegExp(`\\b${blockedWord}(ing|s|ed|er|ism|ist|es|ual|y)?\\b`,"ig"),"[\\_]");
            }
        });
        if(foundWords.length>0&&msg.webhookId===null){
            storage[msg.guildId].users[msg.author.id].infractions++;
            msg.delete();
            if(storage[msg.guildId].filter.censor){
                var replyBlip="";
                if(msg.type===19){
                    var rMsg=await msg.fetchReference();
                    replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"").replace(/\@/ig,"[@]")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_\n`;
                }
                sendHook({
                    username:msg.member?.nickname||msg.author.globalName||msg.author.username,
                    avatarURL:msg.member?.displayAvatarURL(),
                    content:ll(`\`\`\`\nThe following message from ${msg.author.username} has been censored by Stewbot.\`\`\`${replyBlip}${msg.content.slice(0,1800).replace(/(https?\:\/\/|\n)/ig,"").replace(/\@/ig,"[@]")}`)
                });
            }
            if(storage[msg.author.id].config.dmOffenses&&msg.webhookId===null){
                try{msg.author.send(ll(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to the following word${foundWords.length>1?"s":""} being in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.ogContent.replaceAll("`","\\`")+"```":""}`)).catch(e=>{});}catch(e){}
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                var c=client.channels.cache.get(storage[msg.guildId].filter.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send(ll(`I have ${storage[msg.guildId].filter.censor?"censored":"deleted"} a message from **${msg.author.username}** in <#${msg.channel.id}> for the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.ogContent.replaceAll("`","\\`").replaceAll(/(?<=https?:\/\/[^(\s|\/)]+)\./gi, "[.]").replaceAll(/(?<=https?):\/\//gi, "[://]")}\`\`\``));
                }
                else{
                    storage[msg.guildId].filter.log=false;
                }
            }
            save();
            return;
        }
    }
    if(storage[msg.guildId]?.levels.active&&storage[msg.guildId]?.users[msg.author.id].expTimeout<Date.now()&&!msg.author.bot){
        storage[msg.guildId].users[msg.author.id].expTimeout=Date.now()+60000;
        storage[msg.guildId].users[msg.author.id].exp+=Math.floor(Math.random()*11)+15;//Between 15 and 25
        if(storage[msg.guild.id].users[msg.author.id].exp>getLvl(storage[msg.guild.id].users[msg.author.id].lvl)){
            storage[msg.guild.id].users[msg.author.id].lvl++;
            if(storage[msg.author.id].config.levelUpMsgs){
                if(storage[msg.guild.id].levels.hasOwnProperty("channelOrDM")){
                    storage[msg.guild.id].levels.location=storage[msg.guild.id].levels.channelOrDM;
                    delete storage[msg.guild.id].levels.channelOrDM;
                }
                if(storage[msg.guild.id].levels.location==="DM"){
                    try{
                        msg.author.send({embeds:[{
                            "type": "rich",
                            "title": `Level Up`,
                            "description": storage[msg.guild.id].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
                            "color": 0x006400,
                            "thumbnail": {
                                "url": msg.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "footer": {
                                "text": `Sent from ${msg.guild.name}. To disable these messages, use /personal_config.`
                            }
                        }]}).catch(e=>{});
                    }catch(e){}
                }
                else{
                    var resp={
                        "content":storage[msg.guildId].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
                        "avatarURL":msg.guild.iconURL(),
                        "username":msg.guild.name
                    };
                    var c=client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id);
                    if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
                        var hook=await c.fetchWebhooks();
                        hook=hook.find(h=>h.token);
                        if(hook){
                            hook.send(resp);
                        }
                        else{
                            client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id).createWebhook({
                                name:"Stewbot",
                                avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                            }).then(d=>{
                                d.send(resp);
                            });
                        }
                    }
                    else{
                        storage[msg.guild.id].levels.location="DM";
                        try{
                            msg.author.send({embeds:[{
                                "type": "rich",
                                "title": `Level Up`,
                                "description": storage[msg.guild.id].levels.msg.replaceAll("${USERNAME}",`**${msg.author.username}**`).replaceAll("${USER}",`<@${msg.author.id}>`).replaceAll("${LVL}",storage[msg.guild.id].users[msg.author.id].lvl),
                                "color": 0x006400,
                                "thumbnail": {
                                    "url": msg.guild.iconURL(),
                                    "height": 0,
                                    "width": 0
                                },
                                "footer": {
                                    "text": `Sent from ${msg.guild.name}. To disable these messages, use /personal_config.`
                                }
                            }]}).catch(e=>{});
                        }catch(e){}
                    }
                }
            }
        }
        save();
    }
    if(storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel&&!msg.author.bot&&(!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.AddReactions)||!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages))){
        storage[msg.guildId].counting.active=false;
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
                    if(storage[msg.guild.id].users[msg.author.id].beenCountWarned&&storage[msg.guild.id].counting.reset){
                        msg.reply(`⛔ **Reset**\nNope, you need to wait for ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} to post before you post again!${storage[msg.guild.id].counting.reset?` The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`:""}`);
                        if(storage[msg.guild.id].counting.reset){
                            storage[msg.guild.id].counting.nextNum=1;
                            if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.takeTurns>0) storage[msg.guild.id].counting.legit=true;
                            for(let a in storage[msg.guild.id].users){
                                storage[msg.guild.id].users[a].countTurns=0;
                            }
                            save();
                        }
                    }
                    else{
                        msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:""}`);
                        storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
                        save();
                    }
                }
            }
            else if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.nextNum!==1){
                msg.react("❌");
                if(storage[msg.guild.id].users[msg.author.id].beenCountWarned&&storage[msg.guild.id].counting.reset){
                    msg.reply(`⛔ **Reset**\nNope, that was incorrect! The next number to post was going to be \`${storage[msg.guild.id].counting.nextNum}\`, but now it's \`1\`.`);
                    storage[msg.guild.id].counting.nextNum=1;
                    if(storage[msg.guild.id].counting.reset&&storage[msg.guild.id].counting.takeTurns>0) storage[msg.guild.id].counting.legit=true;
                    for(let a in storage[msg.guild.id].users){
                        storage[msg.guild.id].users[a].countTurns=0;
                    }
                    save();
                }
                else{
                    msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:""}`);
                    storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
                    save();
                }
            }
        }
    }

    var links=msg.content.match(discordMessageRegex)||[];
    var progs=msg.content.match(kaProgramRegex)||[];
    if(!storage[msg.author.id].config.embedPreviews||!storage[msg.guildId]?.config.embedPreviews||!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)||!msg.channel.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.EmbedLinks)){
        links=[];
        progs=[];
    }
    var embs=[];
    var fils=[];
    for(var i=0;i<links.length;i++){
        let slashes=links[i].split("channels/")[1].split("/");
        try{
            var channelLinked=await client.channels.cache.get(slashes[slashes.length-2]);
            var mes=await channelLinked.messages.fetch(slashes[slashes.length-1]);
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
                let url = attached.url;
                if(attachedImg||!(/(png|jpe?g)/i.test(url))){
                    fils.push(url);
                }
                else{
                    messEmbed.setImage(url);
                    attachedImg=true;
                }
            });
            if(channelLinked.permissionsFor(msg.author.id).has(PermissionFlagsBits.ViewChannel)){
                embs.push(messEmbed);
            }
        }
        catch(e){}
    }
    if(embs.length>0) msg.reply({content:`Embedded linked message${embs.length>1?"s":""}. You can prevent this behavior by surrounding message links in \`<\` and \`>\`.`,embeds:embs,files:fils,allowedMentions:{parse:[]}});
    for(var i=0;i<progs.length;i++){
        let prog=progs[i];
        var embds=[];
        await fetch(`https://kap-archive.bhavjit.com/s/${prog.split("/")[prog.split("/").length-1].split("?")[0]}`).then(d=>d.json()).then(d=>{
            embds.push({
                type: "rich",
                title: d.title,
                description: `\u200b`,
                color: 0x00ff00,
                author: {
                    name: `Made by ${d.author.nick}`,
                    url: `https://www.khanacademy.org/profile/${d.author.id}`,
                },
                fields: [
                    {
                        name: `Created`,
                        value: `${new Date(d.created).toDateString()}`,
                        inline: true
                    },
                    {
                        name: `Last Updated`,
                        value: `${new Date(d.updated).toDateString()}`,
                        inline: true
                    },
                    {
                        name: `Last Updated in Archive`,
                        value: `${new Date(d.archive.updated).toDateString()}`,
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
                    text: `Backed up to https://kap-archive.bhavjit.com/`,
                    icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                },
                url: `https://www.khanacademy.org/cs/i/${d.id}`
            });
        });
    }
    if(embds?.length>0){
        msg.suppressEmbeds(true);
        msg.reply({content:`Backed program${embds.length>1?"s":""} up to the KAP Archive, which you can visit [here](https://kap-archive.bhavjit.com/).`,embeds:embds,allowedMentions:{parse:[]}});
    }

    if(msg.channel.name?.startsWith("Ticket with ")&&!msg.author.bot){
        var resp={files:[],content:`Ticket response from **${msg.guild.name}**. To respond, make sure to reply to this message.\nTicket ID: ${msg.channel.name.split("Ticket with ")[1].split(" in ")[1]}/${msg.channel.id}`};
        msg.attachments.forEach((attached,i) => {
            let url=attached.url.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg"))){
                resp.files.push(attached.url);
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
            .setImage(msg.attachments.first()?msg.attachments.first().url:null)
        ];
        try{client.users.cache.get(msg.channel.name.split("Ticket with ")[1].split(" in ")[0]).send(resp).catch(e=>{});}catch(e){}
    }
    if(msg.reference&&msg.channel instanceof DMChannel&&!msg.bot){
        var rmsg=await msg.channel.messages.fetch(msg.reference.messageId);
        if(rmsg.author.id===client.user.id&&rmsg.content.includes("Ticket ID: ")){
            var resp={
                content:msg.content,
                username:msg.author.nickname||msg.author.globalName||msg.author.username,
                avatar_url:msg.author.displayAvatarURL()
            };
            var c=client.channels.cache.get(rmsg.content.split("Ticket ID: ")[1].split("/")[0]);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var hook=await c.fetchWebhooks();
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
            }
            return;
        }
    }

    if(msg.channel instanceof DMChannel&&!msg.author.bot&&storage[msg.author.id].config.aiPings) {
        msg.channel.sendTyping();
	    sendMessage(msg, true);
    }
    else if(msg.mentions.users.has(client.user.id)&&!msg.author.bot&&storage[msg.author.id].config.aiPings&&msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
        if (/^<[@|#|@&].*?>$/g.test(msg.content.replace(/\s+/g, ''))) {
            msg.content = "*User says nothing*";
        }
        if(storage[msg.guild?.id]?.config.ai){
	        msg.channel.sendTyping();
            sendMessage(msg);
        }
    }

    if(msg.guild){
        var hash = crypto.createHash('md5').update(msg.content.slice(0,148)).digest('hex');
        if(!storage[msg.author.id].hasOwnProperty("hashStreak")) storage[msg.author.id].hashStreak=0;
        if(!storage[msg.guild.id].users[msg.author.id].hasOwnProperty("lastMessages")){
            storage[msg.guild.id].users[msg.author.id].lastMessages=[];
        }
        if(storage[msg.author.id].lastHash===hash){
            if(msg.content.toLowerCase().includes("@everyone")||msg.content.toLowerCase().includes("@here")||msg.content.toLowerCase().includes("http")) storage[msg.author.id].hashStreak++;
            if(storage[msg.author.id].hashStreak>=3){
                storage[msg.author.id].captcha=true;
                var botInServer=msg.guild?.members.cache.get(client.user.id);
                if(botInServer?.permissions.has(PermissionFlagsBits.ModerateMembers)&&!storage[msg.guild.id].disableAntiHack&&new Date()-(storage[msg.guild.id].users[msg.author.id].safeTimestamp||0)>60000*60*24*7){
                    try{
                        msg.member.timeout(60000*60*24,`Detected spam activity of high profile pings and/or a URL of some kind. Automatically applied for safety.`);//One day, by then any automated hacks should've run their course
                        if(!storage[msg.author.id].hasOwnProperty("timedOutIn")) storage[msg.author.id].timedOutIn=[];
                        storage[msg.author.id].timedOutIn.push(msg.guild.id);
                        if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                            var sendRow=[new ButtonBuilder().setCustomId("untimeout-"+msg.author.id).setLabel("Remove Timeout").setStyle(ButtonStyle.Success)];
                            if(botInServer.permissions.has(PermissionFlagsBits.BanMembers)&&msg.member.bannable){
                                sendRow.push(new ButtonBuilder().setCustomId("ban-"+msg.author.id).setLabel(`Ban`).setStyle(ButtonStyle.Danger));
                            }
                            if(botInServer.permissions.has(PermissionFlagsBits.KickMembers)&&msg.member.kickable){
                                sendRow.push(new ButtonBuilder().setCustomId("kick-"+msg.author.id).setLabel(`Kick`).setStyle(ButtonStyle.Danger));
                            }
                            if(botInServer.permissions.has(PermissionFlagsBits.ManageMessages)){
                                sendRow.push(new ButtonBuilder().setCustomId("del-"+msg.author.id).setLabel(`Delete the Messages in Question`).setStyle(ButtonStyle.Primary));
                            }
                            msg.reply({content:`I have detected unusual activity from this account. I have temporarily applied a timeout. To remove this timeout, please use ${cmds.captcha} in a DM with me, or a moderator can remove this timeout manually.\n\nIf a mod wishes to disable this behaviour, designed to protect servers from mass spam, ping, and NSFW hacked or spam accounts, run ${cmds.general_config} and specify to disable Anti Hack Protection.`,components:[new ActionRowBuilder().addComponents(...sendRow)]});
                        }
                    }
                    catch(e){}
                }
            }
        }
        else{
            storage[msg.author.id].lastHash=hash;
            storage[msg.author.id].hashStreak=0;
            storage[msg.guild.id].users[msg.author.id].lastMessages=[];
        }
        storage[msg.guild.id].users[msg.author.id].lastMessages.push(`${msg.channel.id}/${msg.id}`);
        save();
    }
    msg.mentions.users.forEach(async mentionedUser=>{
        if(storage[msg.guild?.id]?.users[mentionedUser.id]?.gone?.active&&mentionedUser.id!==msg.author.id){
            if(storage[msg.guild.id].users[mentionedUser.id].gone.until>new Date()){
                if(msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                    var resp={
                        "content":`${getAwayCard(false,mentionedUser.id,msg.guild.id,false)}\n\n_Set up using ${cmds.unavailable}_`,
                        "avatarURL":mentionedUser.displayAvatarURL(),
                        "username":mentionedUser.globalName||mentionedUser.username
                    };
                    var hook=await msg.channel.fetchWebhooks();
                    hook=hook.find(h=>h.token);
                    if(hook){
                        hook.send(resp);
                    }
                    else{
                        client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id).createWebhook({
                            name:"Stewbot",
                            avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                        }).then(d=>{
                            d.send(resp);
                        });
                    }
                }
                else if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    msg.reply({embeds:[getAwayCard(true,mentionedUser.id,msg.guild.id,false)],allowedMentions:{parse:[]}});
                }
            }
            else{
                storage[msg.guild.id].users[mentionedUser.id].gone.active=false;
            }
            save();
        }
        else if(storage[mentionedUser.id]?.gone?.active&&mentionedUser.id!==msg.author.id){
            if(storage[mentionedUser.id].gone.until>new Date()){
                if(msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                    var resp={
                        "content":`${getAwayCard(false,mentionedUser.id,msg.guild.id,true)}\n\n_Set up using ${cmds.unavailable}_`,
                        "avatarURL":mentionedUser.displayAvatarURL(),
                        "username":mentionedUser.globalName||mentionedUser.username
                    };
                    var hook=await msg.channel.fetchWebhooks();
                    hook=hook.find(h=>h.token);
                    if(hook){
                        hook.send(resp);
                    }
                    else{
                        client.channels.cache.get(storage[msg.guild.id].levels.location==="channel"?storage[msg.guild.id].levels.channel:msg.channel.id).createWebhook({
                            name:"Stewbot",
                            avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                        }).then(d=>{
                            d.send(resp);
                        });
                    }
                }
                else if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    msg.reply({embeds:[getAwayCard(true,mentionedUser.id,msg.guild.id,true)],allowedMentions:{parse:[]}});
                }
            }
            else{
                storage[mentionedUser.id].gone.active=false;
            }
            save();
        }
    });
    if(storage[msg.guild?.id]?.users[msg.author.id].gone?.active&&storage[msg.guild?.id]?.users[msg.author.id].gone?.autoOff){
        storage[msg.guild.id].users[msg.author.id].gone.active=false;
        save();
    }
    if(storage[msg.author.id].gone?.active&&storage[msg.author.id].gone?.autoOff){
        storage[msg.author.id].gone.active=false;
        save();
    }
});
client.on("interactionCreate",async cmd=>{
    if(cmd.commandName==="secret") return;
    try{
	    if(!cmd.isButton()&&!cmd.isModalSubmit()&&!cmd.isChannelSelectMenu()&&!cmd.isRoleSelectMenu()&&!cmd.isStringSelectMenu()) await cmd.deferReply({ephemeral:["poll","auto_roles","submit_meme","delete_message","move_message","auto-join-roles","join-roleOption","admin_message","personal_config","timestamp","unavailable"].includes(cmd.commandName)||cmd.options.getBoolean("private")});
    }catch(e){}
    try{
        if(cmd.guildId!==0){
            if(!storage.hasOwnProperty(cmd.guildId)){
                storage[cmd.guildId]=structuredClone(defaultGuild);
                save();
            }
            if(!storage[cmd.guildId].users.hasOwnProperty(cmd.user.id)){
                storage[cmd.guildId].users[cmd.user.id]=structuredClone(defaultGuildUser);
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
                noPerms(cmd.guildId,perm);
            }
        });
    }
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
                            color: 0x773e09,
                            fields: defs.slice(0,25),
                            footer: {
                                text: d.phonetic,
                            }
                        }]});
                    }
                }).catch(e=>{
                    console.log(e);
                    cmd.followUp("I'm sorry, I didn't find a definition for that");
                });
        break;
        case "filter":
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
                storage[cmd.guildId].filter.active=false;
                cmd.followUp(`I cannot run a filter for this server. I need the MANAGE_MESSAGES permission first, otherwise I cannot delete messages.`);
                break;
            }
            switch(cmd.options.getSubcommand()){
                case "add":
                    if(storage[cmd.guildId].filter.blacklist.includes(cmd.options.getString("word"))){
                        cmd.followUp({"ephemeral":true,"content":`The word ||${cmd.options.getString("word")}|| is already in the blacklist.${storage[cmd.guildId].filter.active?"":`To begin filtering in this server, use ${cmds['filter config']}.`}`});
                    }
                    else{
                        storage[cmd.guildId].filter.blacklist.push(cmd.options.getString("word"));
                        cmd.followUp(`Added ||${cmd.options.getString("word")}|| to the filter for this server.${storage[cmd.guildId].filter.active?"":`\n\nThe filter for this server is currently disabled. To enable it, use ${cmds['filter config']}.`}`);
                        save();
                    }
                break;
                case "remove":
                    if(storage[cmd.guildId].filter.blacklist.includes(cmd.options.getString("word"))){
                        storage[cmd.guildId].filter.blacklist.splice(storage[cmd.guildId].filter.blacklist.indexOf(cmd.options.getString("word")),1);
                        cmd.followUp(`Alright, I have removed ||${cmd.options.getString("word")}|| from the filter.`);
                        save();
                    }
                    else{
                        cmd.followUp(`I'm sorry, but I don't appear to have that word in my blacklist. Are you sure you're spelling it right? You can use ${cmds.view_filter} to see all filtered words.`);
                    }
                break;
                case "config":
                    var disclaimers=[];
                    storage[cmd.guildId].filter.active=cmd.options.getBoolean("active");
                    if(cmd.options.getBoolean("censor")!==null) storage[cmd.guildId].filter.censor=cmd.options.getBoolean("censor");
                    if(cmd.options.getBoolean("log")!==null) storage[cmd.guildId].filter.log=cmd.options.getBoolean("log");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].filter.channel=cmd.options.getChannel("channel").id;
                    save();
                    if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)&&storage[cmd.guildId].filter.censor){
                        storage[cmd.guildId].filter.censor=false;
                        disclaimers.push(`I cannot run censoring for this server, I need the MANAGE_WEBHOOKS permission first, otherwise I can't post a censored version.`);
                    }
                    if(storage[cmd.guildId].filter.channel===""&&storage[cmd.guildId].filter.log){
                        storage[cmd.guildId].filter.log=false;
                        disclaimers.push(`No channel was set to log summaries of deleted messages to, so logging these is turned off.`);
                    }
                    else if(storage[cmd.guildId].filter.log&&!client.channels.cache.get(storage[cmd.guildId].filter.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        storage[cmd.guildId].filter.log=false;
                        disclaimers.push(`I cannot send messages to the specified log channel for this server, so logging deleted messages has been turned off.`);
                    }
                    cmd.followUp(`Filter configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
                break;
                case "import":
                    fetch(cmd.options.getAttachment("file").attachment).then(d=>d.text()).then(d=>{
                        var badWords=d.split(",");
                        let addedWords=[];
                        badWords.forEach(word=>{
                            if(!storage[cmd.guildId].filter.blacklist.includes(word)){
                                storage[cmd.guildId].filter.blacklist.push(word);
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
            if(storage[cmd.guildId].filter.blacklist.length>0&&storage[cmd.guildId].filter.active){
                cmd.followUp({"content":`**Warning!** There is no guarantee what kinds of words may be in the blacklist. There is a chance it could be heavily dirty or offensive. To continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
            }
            else{
                cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds['filter add']}.`);
            }
        break;
        case 'starboard_config':
            if(!cmd.guild?.id){
                cmd.followUp("Something is wrong");
                break;
            }
            storage[cmd.guildId].starboard.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].starboard.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getInteger("threshold")!==null) storage[cmd.guildId].starboard.threshold=cmd.options.getInteger("threshold");
            if(cmd.options.getString("emoji")!==null) storage[cmd.guildId].starboard.emoji=cmd.options.getString("emoji").includes(":")?cmd.options.getString("emoji").split(":")[2].split(">")[0]:cmd.options.getString("emoji");
            if(cmd.options.getString("message_type")!==null) storage[cmd.guildId].starboard.messType=cmd.options.getString("message_type");
            
            var disclaimers=[];
            if(storage[cmd.guildId].starboard.channel===""&&storage[cmd.guildId].starboard.active){
                storage[cmd.guildId].starboard.active=false;
                disclaimers.push(`No channel was set to post starboarded messages to, so starboard has been turned off.`);
            }
            else if(storage[cmd.guildId].starboard.active&&!client.channels.cache.get(storage[cmd.guildId].starboard.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                storage[cmd.guildId].starboard.active=false;
                disclaimers.push(`I cannot send messages to the specified starboard channel for this server, so starboard has been turned off.`);
            }
            if(storage[cmd.guildId].starboard.messType==="0"&&!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                storage[cmd.guildId].starboard.messType="2";
                disclaimers.push(`I do not have the MANAGE_WEBHOOKS permissions, so I cannot use the starboard message type configured. I have changed the setting to "Post an embed with the message" instead.`);
            }
            cmd.followUp(`Starboard configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
            save();
        break;
        case 'levels_config':
            storage[cmd.guildId].levels.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].levels.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getString("location")!==null) storage[cmd.guildId].levels.location=cmd.options.getString("location");
            if(cmd.options.getString("message")!==null) storage[cmd.guildId].levels.msg=cmd.options.getString("message");
            var disclaimers=[];
            if(storage[cmd.guildId].levels.channel===""&&storage[cmd.guildId].levels.location==="channel"){
                storage[cmd.guildId].levels.location="DM";
                disclaimers.push(`No channel was set to post level-ups to, so I have changed the level-up notification location to DMs.`);
            }
            if(storage[cmd.guildId].levels.location!=="DM"&&!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                storage[cmd.guildId].levels.location="DM";
                disclaimers.push(`I do not have the MANAGE_WEBHOOKS permission for this server, so I cannot post level-up messages. I have set the location for level-up notifications to DMs instead.`);
            }
            cmd.followUp(`Level ups configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
            save();
        break;
        case 'counting':
            switch(cmd.options.getSubcommand()){
                case "config":
                    storage[cmd.guildId].counting.active=cmd.options.getBoolean("active");
                    if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].counting.channel=cmd.options.getChannel("channel").id;
                    if(cmd.options.getBoolean("public")!==null) storage[cmd.guildId].counting.public=cmd.options.getBoolean("public");
                    if(cmd.options.getInteger("posts_between_turns")!==null) storage[cmd.guildId].counting.takeTurns=cmd.options.getInteger("posts_between_turns");
                    var disclaimers=[];
                    if(!storage[cmd.guildId].counting.channel){
                        storage[cmd.guildId].counting.active=false;
                        disclaimers.push(`No channel was set for counting to be active in, so counting is disabled currently.`);
                    }
                    var c=client.channels.cache.get(storage[cmd.guild.id].counting.channel);
                    if(!c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        storage[cmd.guild.id].counting.active=false;
                        disclaimers.push(`I can't send messages in the specified channel, so counting is disabled currently.`);
                    }
                    if(!c.permissionsFor(client.user.id).has(PermissionFlagsBits.AddReactions)){
                        storage[cmd.guild.id].counting.active=false;
                        disclaimers.push(`I can't add reactions in the specified channel, so counting is disabled currently.`);
                    }
                    if(!storage[cmd.guildId].counting.reset||storage[cmd.guildId].counting.takeTurns<1){
                        storage[cmd.guildId].counting.legit=false;
                    }
                    for(let a in storage[cmd.guildId].users){
                        storage[cmd.guildId].users[a].countTurns=0;
                        storage[cmd.guildId].users[a].beenCountWarned=false;
                    }
                    cmd.followUp(`Alright, I configured counting for this server.${disclaimers.map(d=>`\n\n${d}`).join("")}${storage[cmd.guildId].counting.legit?"":`\n\nPlease be aware this server is currently ineligible for the leaderboard. To fix this, make sure that reset is set to true, that the posts between turns is at least 1, and that you don't set the number to anything higher than 1 manually.`}`);
                    save();
                break;
                case "set_number":
                    if(!storage[cmd.guildId].counting.active){
                        cmd.followUp(`This server doesn't use counting at the moment, configure it with ${commands["counting config"]}.`);
                        break;
                    }
                    storage[cmd.guildId].counting.nextNum=cmd.options.getInteger("num");
                    if(storage[cmd.guildId].counting.nextNum>1){
                        storage[cmd.guildId].counting.legit=false;
                    }
                    else if(storage[cmd.guildId].counting.reset&&storage[cmd.guildId].counting.takeTurns>0){
                        storage[cmd.guildId].counting.legit=true;
                    }
                    cmd.followUp(`Alright, I've set the next number to be counted to \`${storage[cmd.guildId].counting.nextNum}\`.${storage[cmd.guildId].counting.legit?"":`\n\nPlease be aware that this server is currently ineligible for the leaderboard. To fix this, make sure that the number you start from is less than 2, that the posts between turns is at least 1, and that counting is configured to reset upon any mistakes.`}`);
                    save();
                break;
            }
        break;
        case 'next_counting_number':
            cmd.followUp(storage[cmd.guildId].counting.active?`The next number to enter ${cmd.channel.id!==storage[cmd.guildId].counting.channel?`in <#${storage[cmd.guildId].counting.channel}> `:""}is \`${storage[cmd.guildId].counting.nextNum}\`.`:`Counting isn't active in this server! Use ${cmds['counting config']} to set it up.`);
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
                            "X-RapidAPI-Key": process.env.wyrKey,
                            "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
                        },
                    }).then(d=>d.json()).then(async d=>{
                        let firstQues=d[0].question.split("Would you rather ")[1];
                        let firstQuest=firstQues[0].toUpperCase()+firstQues.slice(1,firstQues.length).split(" or ")[0];
                        let nextQues=firstQues.split(" or ")[1];
                        let nextQuest=nextQues[0].toUpperCase()+nextQues.slice(1,nextQues.length).split("?")[0];
                        cmd.followUp(`**Would you Rather**\n🅰️: ${firstQuest}\n🅱️: ${nextQuest}\n\n*\\*Disclaimer: All WYRs are provided by a third party API*`);
                        if(cmd.channel?.permissionsFor(client.user.id).has(PermissionFlagsBits.AddReactions)){
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
                        meme=cmd.options.getInteger("number")?memes.filter(m=>m.split(".")[0]===cmd.options.getInteger("number").toString())[0]:memes[Math.floor(Math.random()*memes.length)];
                    }
                    catch(e){
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
                    cmd.followUp({content:getRACBoard(),components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin").setLabel("Join Game").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("racMove").setLabel("Make a Move").setStyle(ButtonStyle.Success))]});
                break;
            }
        break;
        case 'poll':
            if(checkDirty(cmd.guild?.id,cmd.options.getString("prompt"))){
                cmd.followUp({content:"This server doesn't want me to process that prompt.","ephemeral":true});
                break;
            }
            cmd.followUp({"content":`**${cmd.options.getString("prompt")}**`,"ephemeral":true,"components":[presets.pollCreation]});
        break;
        case 'auto_roles':
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto roles.`);
                break;
            }
            cmd.followUp({"content":`${cmd.options.getString("message")}`,"ephemeral":true,"components":[presets.rolesCreation]});
        break;
        case 'auto-join-roles':
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto join roles.`);
                break;
            }
            cmd.followUp({"content":`Select all of the roles you'd like the user to have upon joining`,'ephemeral':true,"components":presets.autoJoinRoles});
        break;
        case 'report_problem':
            notify(1,`**${cmd.options.getString("type")[0].toUpperCase()}${cmd.options.getString("type").slice(1)} Reported by ${cmd.user.username}** (${cmd.user.id})\n\n\`\`\`\n${cmd.options.getString("details")}\`\`\``);
            cmd.followUp({content:"I have reported the issue. Thank you.",ephemeral:true});
        break;
        case 'auto-join-message':
            storage[cmd.guildId].ajm.active=cmd.options.getBoolean("active");
            if(cmd.options.getChannel("channel")!==null) storage[cmd.guildId].ajm.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getString("channel_or_dm")!==null) storage[cmd.guildId].ajm.dm=cmd.options.getString("channel_or_dm")==="dm";
            if(cmd.options.getString("message")!==null) storage[cmd.guildId].ajm.message=cmd.options.getString("message");
            var disclaimers=[];
            if(!storage[cmd.guildId].ajm.dm&&storage[cmd.guildId].ajm.channel===""){
                storage[cmd.guildId].ajm.dm=true;
                disclaimers.push(`No channel was specified to post auto join messages in, so I have set it to DMs instead.`);
            }
            if(!storage[cmd.guildId].ajm.dm&&!client.channels.cache.get(storage[cmd.guildId].ajm.channel)?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                storage[cmd.guildId].ajm.dm=true;
                disclaimers.push(`I can't post in the specified channel, so I have set the location to DMs instead.`);
            }
            if(storage[cmd.guildId].ajm.message==="") storage[cmd.guildId].ajm.message=defaultGuild.ajm.message;
            cmd.followUp(`Auto join messages configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
        break;
        case 'auto-leave-message':
            if(!storage[cmd.guildId].hasOwnProperty("alm")){
                storage[cmd.guild.id].alm=structuredClone(defaultGuild.alm);
            }
            storage[cmd.guildId].alm.active=cmd.options.getBoolean("active");
            storage[cmd.guildId].alm.channel=cmd.options.getChannel("channel").id;
            var disclaimers=[];
            if(!client.channels.cache.get(storage[cmd.guildId].alm.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                storage[cmd.guildId].alm.active=false;
                disclaimers.push(`I can't post in the specified channel, so I cannot run auto leave messages.`);
            }
            if(cmd.options.getString("message")!==null) storage[cmd.guildId].alm.message=cmd.options.getString("message");
            cmd.followUp(`Auto leave messages configured.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
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
            if(cmd.options.getUser("target")?.id){
                try{
                    cmd.options.getUser("target").send({embeds:[{
                        type: "rich",
                        title: cmd.guild.name.slice(0,80),
                        description: cmd.options.getString("what").replaceAll("\\n","\n"),
                        color: 0x006400,
                        thumbnail: {
                            url: cmd.guild.iconURL(),
                            height: 0,
                            width: 0,
                        },
                        footer: {
                            text:`This message was sent by a moderator of ${cmd.guild.name}`
                        }
                    }]}).catch(e=>{});
                    cmd.followUp("Messaged them");
                }catch(e){}
            }
            else if(cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
                var resp={
                    "content":cmd.options.getString("what").replaceAll("\\n","\n"),
                    "avatarURL":cmd.guild.iconURL(),
                    "username":cmd.guild.name.slice(0,80)
                };
                var hook=await cmd.channel.fetchWebhooks();
                hook=hook.find(h=>h.token);
                if(hook){
                    hook.send(resp);
                }
                else{
                    cmd.channel.createWebhook({
                        name:"Stewbot",
                        avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
                    }).then(d=>{
                        d.send(resp);
                    });
                }
                cmd.followUp({content:"Posted",ephemeral:true});
            }
            else{
                cmd.followUp(`I don't have the MANAGE_WEBHOOKS permission, so I can't post an admin message in this server.`);
            }
        break;
        case 'log_config':
            storage[cmd.guildId].logs.active=cmd.options.getBoolean("active");
            storage[cmd.guildId].logs.channel=cmd.options.getChannel("channel").id;
            if(cmd.options.getBoolean("channel_events")) storage[cmd.guildId].logs.channel_events=cmd.options.getBoolean("channel_events");
            if(cmd.options.getBoolean("emoji_events")) storage[cmd.guildId].logs.emoji_events=cmd.options.getBoolean("emoji_events");
            if(cmd.options.getBoolean("user_change_events")) storage[cmd.guildId].logs.user_change_events=cmd.options.getBoolean("user_change_events");
            if(cmd.options.getBoolean("joining_and_leaving")) storage[cmd.guildId].logs.joining_and_leaving=cmd.options.getBoolean("joining_and_leaving");
            if(cmd.options.getBoolean("invite_events")) storage[cmd.guildId].logs.invite_events=cmd.options.getBoolean("invite_events");
            if(cmd.options.getBoolean("role_events")) storage[cmd.guildId].logs.role_events=cmd.options.getBoolean("role_events");
            if(cmd.options.getBoolean("mod_actions")) storage[cmd.guildId].logs.mod_actions=cmd.options.getBoolean("mod_actions");
            var disclaimers=[];
            if(!client.channels.cache.get(storage[cmd.guildId].logs.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                storage[cmd.guildId].logs.active=false;
                disclaimers.push(`I can't post in the specified channel, so logging is turned off.`);
            }
            cmd.followUp(`Configured log events.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
            save();
        break;
        case 'sticky-roles':
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                storage[cmd.guildId].stickyRoles=false;
                cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run sticky roles.`);
                break;
            }
            storage[cmd.guildId].stickyRoles=cmd.options.getBoolean("active");
            cmd.followUp("Sticky roles configured. Please be aware I can only manage roles lower than my highest role in the server roles list.");
        break;
        case 'kick':
            cmd.guild.members.cache.get(cmd.options.getUser("target").id).kick(`Instructed to kick by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
            cmd.followUp({content:`I have attempted to kick <@${cmd.user.username}>`,allowedMentions:{parse:[]}});
        break;
        case 'timeout':
            if(cmd.options.getUser("target").id===client.id){
                cmd.followUp(`I cannot timeout myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem} if there's something that needs improvement.`);
                break;
            }
            if(cmd.user.id===cmd.options.getUser("target").id){
                cmd.followUp(`I cannot timeout you as the one invoking the command. If you feel the need to timeout yourself, consider changing your actions and mindset instead.`);
            }
            var time=(cmd.options.getInteger("hours")*60000*60)+(cmd.options.getInteger("minutes")*60000)+(cmd.options.getInteger("seconds")*1000);
            cmd.guild.members.cache.get(cmd.options.getUser("target").id).timeout(time>0?time:60000,`Instructed to timeout by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
            cmd.followUp({content:`I have attempted to timeout <@${cmd.options.getUser("target").id}>`,allowedMentions:{parse:[]}});
        break;
        case 'ban':
            if(cmd.options.getUser("target").id===client.id){
                cmd.followUp(`I cannot ban myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem} if there's something that needs improvement.`);
                break;
            }
            if(cmd.user.id===cmd.options.getUser("target").id){
                cmd.followUp(`I cannot ban you as the one invoking the command. If you feel the need to ban yourself, consider changing your actions and mindset instead.`);
                break;
            }
            var b=cmd.guild.members.cache.get(cmd.options.getUser("target").id);
            if(b.bannable){
                b.ban({reason:`Instructed to ban by ${cmd.user.username}: ${cmd.options.getString("reason")}`});
                cmd.followUp(`I have banned <@${cmd.user.username}>`);
                break;
            }
            else{
                cmd.followUp(`I cannot ban this person. Make sure that I have a role higher than their highest role in the server settings before running this command.`);
                break;
            }
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
            if(cmd.options.getBoolean("level_up_messages"!==null)) storage[cmd.user.id].config.levelUpMsgs=cmd.options.getBoolean("level_up_messages");
            if(!cmd.options.getBoolean("configure_timezone")){
                cmd.followUp("Configured your personal setup");
            }
            else{
                var cur=new Date();
                if(!storage[cmd.user.id].config.hasSetTZ) storage[cmd.user.id].config.timeOffset=0;
                cmd.followUp({content:`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(cur.getHours()+storage[cmd.user.id].config.timeOffset)===0?"12":(cur.getHours()+storage[cmd.user.id].config.timeOffset)>12?(cur.getHours()+storage[cmd.user.id].config.timeOffset)-12:(cur.getHours()+storage[cmd.user.id].config.timeOffset)}:${(cur.getMinutes()+"").padStart(2,"0")} ${(cur.getHours()+storage[cmd.user.id].config.timeOffset)>11?"PM":"AM"}\n${((cur.getHours()+storage[cmd.user.id].config.timeOffset)+"").padStart(2,"0")}${(cur.getMinutes()+"").padStart(2,"0")}`,components:presets.tzConfig});
            }
        break;
        case 'general_config':
            if(cmd.options.getBoolean("ai_pings")!==null) storage[cmd.guildId].config.ai=cmd.options.getBoolean("ai_pings");
            if(cmd.options.getBoolean("embeds")!==null) storage[cmd.guildId].config.embedPreviews=cmd.options.getBoolean("embeds");
            if(cmd.options.getBoolean("disable_anti_hack")!==null) storage[cmd.guildId].disableAntiHack=cmd.options.getBoolean("disable_anti_hack");
            cmd.followUp("Configured your personal setup");
        break;
        case 'bible':
            let book=getClosest(cmd.options.getString("book").toLowerCase());
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
                        cmd.followUp(`I'm sorry, I couldn't find \`${book} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
                    }
                }
                catch(e){
                    cmd.followUp(`I'm sorry, I couldn't find \`${book} ${cmd.options.getInteger("chapter")}:${cmd.options.getString("verse")}\`. Are you sure it exists? Perhaps something is typoed.`);
                }
            }
        break;
        case 'rank':
            if(!storage[cmd.guildId].levels.active){
                cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config}.`);
                return;
            }
            var usr=cmd.options.getUser("target")?.id||cmd.user.id;
            if(!storage[cmd.guildId].users.hasOwnProperty(usr)){
                cmd.followUp(`I am unaware of this user presently`);
                return;
            }
            cmd.followUp({content:`Server rank card for <@${usr}>`,embeds:[{
                "type": "rich",
                "title": `Rank for ${cmd.guild.name}`,
                "description": "",
                "color": 0x006400,
                "fields": [
                    {
                        "name": `Level`,
                        "value": storage[cmd.guildId].users[usr].lvl+"",
                        "inline": true
                    },
                    {
                        "name": `EXP`,
                        "value": `${storage[cmd.guildId].users[usr].exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        "inline": true
                    },
                    {
                        "name": `Server Rank`,
                        "value": `#${Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>b.exp-a.exp).map(a=>a.id).indexOf(usr)+1}`,
                        "inline": true
                    }
                ],
                "thumbnail": {
                    "url": cmd.guild.iconURL(),
                    "height": 0,
                    "width": 0
                },
                "author": {
                    "name": client.users.cache.get(usr)?client.users.cache.get(usr).username:"Unknown",
                    "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                },
                "footer": {
                    "text": `Next rank up at ${(getLvl(storage[cmd.guildId].users[usr].lvl)+"").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                }
            }],allowedMentions:{parse:[]}});
        break;
        case 'leaderboard':
            if(cmd.guild?.id===undefined&&cmd.options.getString("which")!=="counting"){
                cmd.followUp(`I can't find leaderboard content for that board at the moment. Try in a server that uses it!`);
                return;
            }
            switch(cmd.options.getString("which")){
                case "levels":
                    if(!storage[cmd.guildId].levels.active){
                        cmd.followUp(`This server doesn't use level ups at the moment. It can be configured using ${cmds.levels_config}.`);
                        return;
                    }
                    if(cmd.options.getUser("who")?.id){
                        var usr=cmd.options.getUser("who")?.id||cmd.user.id;
                        if(!storage[cmd.guildId].users.hasOwnProperty(usr)){
                            cmd.followUp(`I am unaware of this user presently`);
                            return;
                        }
                        cmd.followUp({content:`Server rank card for <@${usr}>`,embeds:[{
                            "type": "rich",
                            "title": `Rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Level`,
                                    "value": storage[cmd.guildId].users[usr].lvl+"",
                                    "inline": true
                                },
                                {
                                    "name": `EXP`,
                                    "value": `${storage[cmd.guildId].users[usr].exp}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                                    "inline": true
                                },
                                {
                                    "name": `Server Rank`,
                                    "value": `#${Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>b.exp-a.exp).map(a=>a.id).indexOf(usr)+1}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr)?client.users.cache.get(usr).username:"Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Next rank up at ${(getLvl(storage[cmd.guildId].users[usr].lvl)+"").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                            }
                        }],allowedMentions:{parse:[]}});
                        break;
                    }
                    cmd.followUp({content:`**Levels Leaderboard**`,embeds:[{
                        "type": "rich",
                        "title": `${cmd.guild.name} Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>b.exp-a.exp).slice(0,10).map((a,i)=>`\n${["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"][i]}. <@${a.id}>, level ${a.lvl}`).join(""),
                        "color": 0x006400,
                        "thumbnail": {
                          "url": cmd.guild.iconURL(),
                          "height": 0,
                          "width": 0
                        },
                        "footer": {
                          "text": `${cmd.guild.name} Levels Leaderboard`
                        }
                      }]});
                break;
                case "starboard":
                    if(!storage[cmd.guildId].starboard.active){
                        cmd.followUp(`This server doesn't use starboard at the moment. It can be configured using ${cmds.starboard_config}.`);
                        return;
                    }
                    var searchId=cmd.options.getUser("who")?.id||cmd.user.id;
                    if(searchId!==cmd.user.id){
                        if(!storage[cmd.guildId].users.hasOwnProperty(searchId)){
                            cmd.followUp(`I am unaware of this user presently`);
                            return;
                        }
                    }
                    var place=Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>b.stars-a.stars).map(a=>a.id).indexOf(searchId);
                    cmd.followUp({content:`**Starboard Leaderboard**`,embeds:[{
                        "type": "rich",
                        "title": `${cmd.guild.name} Stars Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>b.stars-a.stars).slice(0,10).map((a,i)=>`\n${["🌠","🌟","⭐","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"][i]}. <@${a.id}> ${a.stars} starboards`).join(""),
                        "color": 0x006400,
                        "thumbnail": {
                          "url": cmd.guild.iconURL(),
                          "height": 0,
                          "width": 0
                        },
                        "footer": {
                          "text": `${searchId===cmd.user.id?"You are":`<@${searchId}> is`} in ${place+1}${place===0?"st":place===1?"nd":place===2?"rd":"th"} place with ${storage[cmd.guildId].users[searchId].stars} starboards.`
                        }
                      }]});
                break;
                case "counting":
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
                    cmd.followUp({"content":`**Counting Leaderboard**`,embeds:[{
                        "type":"rich",
                        "title":`Counting Leaderboard`,
                        "description":`${leaders.slice(0,10).map((a,i)=>`\n${["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"][i]}. ${a[0]}: \`${a[1]}\``).join("")}`,
                        "color":0x006400,
                        "thumbnail":{
                            "url":"https://stewbot.kestron.software/roboabacus.jpg",
                            "height":0,
                            "width":0
                        },
                        "footer":{
                            "text":`${cmd.guild&&storage[cmd.guild?.id]?.counting?.active?`${cmd.guild.name} is in ${leaders.map(a=>a[2]).indexOf(cmd.guildId)+1}${leaders.map(a=>a[2]).indexOf(cmd.guildId)===0?"st":leaders.map(a=>a[2]).indexOf(cmd.guildId)===1?"nd":leaders.map(a=>a[2]).indexOf(cmd.guildId)===2?"rd":"th"} place with a high score of ${storage[cmd.guildId].counting.highestNum}.`:""}`
                        } 
                    }]});
                break;
                case "cleanliness":
                    if(!storage[cmd.guildId].filter.active){
                        cmd.followUp(`This server doesn't use the at the moment. It can be configured using ${cmds["filter config"]}.`);
                        return;
                    }
                    if(cmd.options.getUser("who")?.id){
                        var usr=cmd.options.getUser("who")?.id||cmd.user.id;
                        if(!storage[cmd.guildId].users.hasOwnProperty(usr)){
                            cmd.followUp(`I am unaware of this user presently`);
                            return;
                        }
                        cmd.followUp({content:`Server cleanliness card for <@${usr}>`,embeds:[{
                            "type": "rich",
                            "title": `Cleanliness rank for ${cmd.guild.name}`,
                            "description": "",
                            "color": 0x006400,
                            "fields": [
                                {
                                    "name": `Times Filtered`,
                                    "value": storage[cmd.guildId].users[usr].infractions+"",
                                    "inline": true
                                },
                                {
                                    "name": `Cleanliness Rank`,
                                    "value": `#${Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>a.infractions-b.infractions).map(a=>a.id).indexOf(usr)+1}`,
                                    "inline": true
                                }
                            ],
                            "thumbnail": {
                                "url": cmd.guild.iconURL(),
                                "height": 0,
                                "width": 0
                            },
                            "author": {
                                "name": client.users.cache.get(usr)?client.users.cache.get(usr).username:"Unknown",
                                "icon_url": client.users.cache.get(usr)?.displayAvatarURL()
                            },
                            "footer": {
                                "text": `Cleanliness Leaderboard`
                            }
                        }],allowedMentions:{parse:[]}});
                        break;
                    }
                    cmd.followUp({content:`**Cleanliness Leaderboard**`,embeds:[{
                        "type": "rich",
                        "title": `${cmd.guild.name} Cleanliness Leaderboard`,
                        "description": Object.keys(storage[cmd.guildId].users).map(a=>Object.assign(storage[cmd.guildId].users[a],{"id":a})).sort((a,b)=>a.infractions-b.infractions).slice(0,10).map((a,i)=>`\n${["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"][i]}. <@${a.id}>, ${a.infractions} times filtered`).join(""),
                        "color": 0x006400,
                        "thumbnail": {
                          "url": cmd.guild.iconURL(),
                          "height": 0,
                          "width": 0
                        },
                        "footer": {
                          "text": `${cmd.guild.name} Cleanliness Leaderboard`
                        }
                      }]});
                break;
            }
        break;
        case 'daily-config':
            if(!storage[cmd.guildId].hasOwnProperty("daily")){
                storage[cmd.guildId].daily={
                    "memes":{
                        "active":false,
                        "channel":""
                    },
                    "wyrs":{
                        "active":false,
                        "channel":""
                    },
                    "jokes":{
                        "active":false,
                        "channel":""
                    },
                    "devos":{
                        "active":false,
                        "channel":""
                    },
                    "verses":{
                        "active":false,
                        "channel":""
                    },
                    "qotd":{
                        "active":false,
                        "channel":""
                    }
                };
            }
            storage[cmd.guildId].daily.devos.active=cmd.options.getBoolean("active");
            storage[cmd.guildId].daily.devos.channel=cmd.options.getChannel("channel").id;
            if(!cmd.options.getChannel("channel").permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                cmd.followUp(`I can't send messages in that channel, so I can't run daily devos for this server.`);
                break;
            }
            cmd.followUp(`${storage[cmd.guildId].daily.devos.active?"A":"Dea"}ctivated daily \`devotions\` for this server in <#${storage[cmd.guildId].daily.devos.channel}>.`);
            save();
        break;
        case 'links':
            cmd.followUp(`Here is a list of links in relation with this bot you may find useful.\n- [Stewbot's Website](<https://stewbot.kestron.software/>)\n- [Stewbot's Invite Link](<https://stewbot.kestron.software/addIt>)\n- [Support Server](<https://discord.gg/k3yVkrrvez>)\n- [Stewbot's Source Code on Github](<https://github.com/KestronProgramming/Stewbot>)\n- [The Developer](<https://discord.com/users/949401296404905995>)\n- [The Developer's Website](<https://kestron.software/>)`);
        break;
        case 'random':
            switch(cmd.options.getSubcommand()){
                case 'rng':
                    cmd.followUp(`I have selected a random number between **${cmd.options.getInteger("low")||1}** and **${cmd.options.getInteger("high")||10}**: **${Math.round(Math.random()*((cmd.options.getInteger("high")||10)-(cmd.options.getInteger("low")||1))+(cmd.options.getInteger("low")||1))}**`);
                break;
                case '8-ball':
                    cmd.followUp(`I have generated a random response to the question "**${cmd.options.getString("question")}**".\nThe answer is **${m8ballResponses[Math.floor(Math.random()*m8ballResponses.length)]}**.`);
                break;
                case 'coin-flip':
                    let coinsToFlip=cmd.options.getInteger("number")||1;
                    let coins=[];
                    for(var coinOn=0;coinOn<coinsToFlip;coinOn++){
                        coins.push(Math.floor(Math.random()*2));
                    }
                    cmd.followUp(`I have flipped the coin${coinsToFlip>1?"s":""}.\n${coins.map(a=>`\n- **${a===0?"Heads":"Tails"}**`).join("")}`);
                break;
            }
        break;
        case 'chat':
            sendMessage(cmd,true,true);
        break;
        case 'embed_message':
            try{
                let slashes=cmd.options.getString("link").split("channels/")[1].split("/");
                let embs=[];
                try{
                    var channelLinked=await client.channels.cache.get(slashes[slashes.length-2]);
                    var mes=await channelLinked.messages.fetch(slashes[slashes.length-1]);
                    if(checkDirty(cmd.guild?.id,mes.content)||checkDirty(cmd.guild?.id,mes.author.nickname||mes.author.globalName||mes.author.username)||checkDirty(cmd.guild?.id,mes.guild.name)||checkDirty(cmd.guild?.id,mes.channel.name)){
                        cmd.followUp(`I'm sorry, that message is blocked by this server's filter.`);
                        break;
                    }
                    let messEmbed = new EmbedBuilder()
                        .setColor("#006400")
                        .setTitle("(Jump to message)")
                        .setURL(cmd.options.getString("link"))
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
                        let url = attached.url;
                        if(attachedImg||!(/(png|jpe?g)/i.test(url))){
                            fils.push(url);
                        }
                        else{
                            messEmbed.setImage(url);
                            attachedImg=true;
                        }
                    });
                    if(channelLinked?.permissionsFor(cmd.user.id)?.has(PermissionFlagsBits.ViewChannel)){
                        embs.push(messEmbed);
                    }
                    cmd.followUp({content:embs.length>0?`Embedded linked message`:`Failed to embed message`,embeds:embs});
                }
                catch(e){
                    console.log(e);
                    cmd.followUp(`I'm sorry, I can't access that message.`);
                }
            }
            catch(e){
                cmd.followUp(`I didn't get that. Are you sure this is a valid message link? You can get one by accessing the context menu on a message, and pressing \`Copy Message Link\`.`);
            }
        break;
        case 'timestamp':
            if(storage[cmd.user.id].config.hasSetTZ){
                cmd.followUp({content:`<t:${Math.round((new Date().setSeconds(0))/1000)}:t>`,components:presets.timestamp});
            }
            else{
                cmd.followUp(`This command needs you to set your timezone first! Run ${cmds.personal_config} and specify \`configure_timezone\` to get started,`);
            }
        break;
        case 'captcha':
            var captcha="";
            for(var ca=0;ca<5;ca++){
                captcha+=Math.floor(Math.random()*10);
            }
            cmd.followUp({content:`Please enter the following: \`${captcha}\`\n\nEntered: \`\``,components:presets.captcha});
            save();
        break;
        case 'unavailable':
            var glbl=cmd.options.getBoolean("globally");
            var ts=false;
            var disclaimers=[];
            if(cmd.options.getString("how_long")){
                ts=cmd.options.getString("how_long");
                if(ts.includes(":")) ts=ts.split(":")[1];
                if(!/^\d+$/.test(ts)){
                    disclaimers.push(`Invalid timestamp`);
                    ts=false;
                }
                if(ts.length<13) ts+="000";
            }
            if(!storage[cmd.user.id].hasOwnProperty("gone")){
                storage[cmd.user.id].gone=structuredClone(defaultUser.gone);
            }
            if(!storage[cmd.guild?.id]?.users[cmd.user.id]?.hasOwnProperty("gone")&&cmd.guild){
                storage[cmd.guild?.id].users[cmd.user.id].gone=structuredClone(defaultGuildUser.gone);
            }
            if(!cmd.guild&&glbl){
                glbl=false;
                disclaimers.push(`This command was not used in a server, so the setting has been applied globally.`);
            }
            if(glbl){
                storage[cmd.user.id].gone.active=cmd.options.getBoolean("active");
                if(cmd.options.getString("message")!==null) storage[cmd.user.id].gone.message=cmd.options.getString("message").replaceAll("\\n","\n");
                if(ts) storage[cmd.user.id].gone.until=+ts;
                if(cmd.options.getBoolean("auto_deactivate")!==null) storage[cmd.user.id].gone.autoOff=cmd.options.getBoolean("auto_deactivate");
            }
            else{
                storage[cmd.guild.id].users[cmd.user.id].gone.active=cmd.options.getBoolean("active");
                if(!checkDirty(cmd.guild.id,cmd.options.getString("message"))){
                    if(cmd.options.getString("message")!==null) storage[cmd.guild.id].users[cmd.user.id].gone.message=cmd.options.getString("message").replaceAll("\\n","\n");
                }
                else{
                    disclaimers.push(`I cannot use that message in this server.`);
                }
                if(ts) storage[cmd.guild.id].users[cmd.user.id].gone.until=+ts;
                if(cmd.options.getBoolean("auto_deactivate")!==null) storage[cmd.guild.id].users[cmd.user.id].gone.autoOff=cmd.options.getBoolean("auto_deactivate");
            }
            if(cmd.options.getBoolean("active")){
                cmd.followUp({content:`As you command.${disclaimers.map(d=>`\n\n${d}`).join("")}`,embeds:[getAwayCard(true,cmd.user.id,cmd.guild.id,glbl)]});
            }
            else{
                cmd.followUp(`As you command.`);
            }
            save();
        break;

        case 'restart':
            if(cmd.guild?.id==="983074750165299250"&&cmd.channel.id==="986097382267715604"){
                notify(1,{content:`Bot restarted by <@${cmd.user.id}>`,allowedMentions:{parse:[]}});
                cmd.followUp("Restarting...");
                fs.writeFileSync("./storage.json",JSON.stringify(storage));
                setTimeout(()=>{process.exit(0)},5000);
            }
        break;

        //Context Menu Commands
        case 'delete_message':
            if(cmd.guild?.id){
                if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                    cmd.followUp(`I cannot delete this message.`);
                    break;
                }
                cmd.targetMessage.delete();
                if(storage[cmd.guildId].logs.mod_actions&&storage[cmd.guildId].logs.active){
                    var c=client.channels.cache.get(storage[cmd.guildId].logs.channel);
                    if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({content:`Message from <@${cmd.targetMessage.author.id}> deleted by **${cmd.user.username}**.\n\n${cmd.targetMessage.content}`,allowedMentions:{parse:[]}});
                    }
                    else{
                        storage[cmd.guildId].logs.active=false;
                    }
                }
                cmd.followUp({"content":"Success","ephemeral":true});
            }
            else if(cmd.targetMessage.author.id===client.user.id){
                cmd.targetMessage.delete();
                cmd.followUp({"content":"Success","ephemeral":true});
            }
        break;
        case 'move_message':
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                cmd.followUp("I do not have the MANAGE_WEBHOOKS permission, so I cannot move this message.").
                break;
            }
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
                var dots=a[1].url.split("?")[0].split(".");
                dots=dots[dots.length-1];
                if(!["mov","png","jpg","jpeg","gif","mp4","mp3","wav","webm","ogg"].includes(dots)){
                    cmd.reply({content:`I don't support/recognize the file extension \`.${dots}\``,ephemeral:true});
                    return;
                }
                await fetch(a[1].url).then(d=>d.arrayBuffer()).then(d=>{
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
                var dots=a.url.split("?")[0].split(".");
                dots=dots[dots.length-1];
                if(!["mov","png","jpg","jpeg","gif","mp4","mp3","wav","webm","ogg"].includes(dots)){
                    cmd.reply({content:`I don't support or recognize that format (\`.${dots}\`)`,ephemeral:true});
                    return;
                }
                fetch(a.url).then(d=>d.arrayBuffer()).then(d=>{
                    fs.writeFileSync(`./memes/${fs.readdirSync("./memes").length}.${dots}`,Buffer.from(d));
                });
            });
            cmd.update({components:[]});
            cmd.message.react("✅");
        break;
        case "view_filter":
            cmd.user.send({"content":`The following is the blacklist for **${cmd.guild.name}** as requested.\n\n||${storage[cmd.guildId].filter.blacklist.join("||, ||")}||`,"components":[new ActionRowBuilder().addComponents(inps.delete,inps.export)]});
            cmd.deferUpdate();
        break;
        case 'poll-addOption':
            cmd.showModal(presets.pollAddModal);
        break;
        case 'poll-delOption':
            cmd.showModal(presets.pollRemModal);
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
                cmd.channel.send({content:`<@${cmd.user.id}> asks: **${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a} **0**`).join("")}`,components:[...comp,new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("poll-removeVote").setLabel("Remove vote").setStyle(ButtonStyle.Danger),inps.pollVoters,new ButtonBuilder().setCustomId("poll-closeOption"+cmd.user.id).setLabel("Close poll").setStyle(ButtonStyle.Danger))],allowedMentions:{"users":[]}}).then(msg=>{
                var t={};
                poll.options.forEach(option=>{
                    t[option]=[];
                });
                poll.options=structuredClone(t);
                storage[cmd.guildId].polls[msg.id]=structuredClone(poll);
                save();
            });
            cmd.update({"content":"\u200b",components:[]});
        break;
        case 'poll-voters':
            cmd.reply({content:ll(`**Voters**\n${Object.keys(storage[cmd.guildId].polls[cmd.message.id].options).map(opt=>`\n${opt}${storage[cmd.guildId].polls[cmd.message.id].options[opt].map(a=>`\n- <@${a}>`).join("")}`).join("")}`),ephemeral:true,allowedMentions:{parse:[]}});
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
        case "export":
            var bad=cmd.message.content.match(/\|\|\w+\|\|/gi).map(a=>a.split("||")[1]);
            fs.writeFileSync("./badExport.csv",bad.join(","));
            cmd.reply({ephemeral:true,files:["./badExport.csv"]}).then(()=>{
                fs.unlinkSync("./badExport.csv");
            });
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
            save();

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
        case 'tzUp':
            if(!storage[cmd.user.id].config.hasOwnProperty("timeOffset")){
                storage[cmd.user.id].config.timeOffset=0;
                storage[cmd.user.id].config.hasSetTZ=false;
            }
            storage[cmd.user.id].config.timeOffset++;
            var cur=new Date();
            cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(cur.getHours()+storage[cmd.user.id].config.timeOffset)===0?"12":(cur.getHours()+storage[cmd.user.id].config.timeOffset)>12?(cur.getHours()+storage[cmd.user.id].config.timeOffset)-12:(cur.getHours()+storage[cmd.user.id].config.timeOffset)}:${(cur.getMinutes()+"").padStart(2,"0")} ${(cur.getHours()+storage[cmd.user.id].config.timeOffset)>11?"PM":"AM"}\n${((cur.getHours()+storage[cmd.user.id].config.timeOffset)+"").padStart(2,"0")}${(cur.getMinutes()+"").padStart(2,"0")}`);
        break;
        case 'tzDown':
            if(!storage[cmd.user.id].config.hasOwnProperty("timeOffset")){
                storage[cmd.user.id].config.timeOffset=0;
                storage[cmd.user.id].config.hasSetTZ=false;
            }
            storage[cmd.user.id].config.timeOffset--;
            var cur=new Date();
            cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(cur.getHours()+storage[cmd.user.id].config.timeOffset)===0?"12":(cur.getHours()+storage[cmd.user.id].config.timeOffset)>12?(cur.getHours()+storage[cmd.user.id].config.timeOffset)-12:(cur.getHours()+storage[cmd.user.id].config.timeOffset)}:${(cur.getMinutes()+"").padStart(2,"0")} ${(cur.getHours()+storage[cmd.user.id].config.timeOffset)>11?"PM":"AM"}\n${((cur.getHours()+storage[cmd.user.id].config.timeOffset)+"").padStart(2,"0")}${(cur.getMinutes()+"").padStart(2,"0")}`);
        break;
        case 'tzSave':
            storage[cmd.user.id].config.hasSetTZ=true;
            save();
            cmd.update({content:`## Timezone Configured\n\nUTC ${storage[cmd.user.id].config.timeOffset}`,components:[]});
        break;
        case 'howToCopy':
            cmd.reply({content:`## Desktop\n- Press the \`On Desktop\` button\n- Press the copy icon on the top right of the code block\n- Paste it where you want to use it\n## Mobile\n- Hold down on the message until the context menu appears\n- Press \`Copy Text\`\n- Paste it where you want to use it`,ephemeral:true});
        break;
        case 'onDesktop':
            cmd.reply({content:`\`\`\`\n${cmd.message.content}\`\`\``,ephemeral:true});
        break;
        case 'tsHour':
            cmd.showModal(presets.tsHourModal);
        break;
        case 'tsMinutes':
            cmd.showModal(presets.tsMinutesModal);
        break;
        case 'tsSeconds':
            cmd.showModal(presets.tsSecondsModal);
        break;
        case 'tsDay':
            cmd.showModal(presets.tsDayModal);
        break;
        case 'tsYear':
            cmd.showModal(presets.tsYearModal);
        break;

        //Modals
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
        case "tsYearModal":
            var inp=cmd.fields.getTextInputValue("tsYearInp").padStart(4,"20");
            if(!/^\d+$/.test(inp)){
                cmd.deferUpdate();
                break;
            }
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setYear(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case "tsMinutesModal":
            var inp=cmd.fields.getTextInputValue("tsMinutesInp");
            if(!/^\d+$/.test(inp)){
                cmd.deferUpdate();
                break;
            }
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setMinutes(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case "tsSecondsModal":
            var inp=cmd.fields.getTextInputValue("tsSecondsInp");
            if(!/^\d+$/.test(inp)){
                cmd.deferUpdate();
                break;
            }
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setSeconds(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case "tsHourModal":
            var inp=cmd.fields.getTextInputValue("tsHourInp");
            if(!/^\d+$/.test(inp)){
                cmd.deferUpdate();
                break;
            }
            inp=+inp-storage[cmd.user.id].config.timeOffset;
            if(cmd.fields.getTextInputValue("tsAmPm").toLowerCase()[0]==="p"&&inp<13){
                inp+=12;
            }
            while(inp>23){
                inp-=24;
            }
            while(inp<0){
                inp+=24;
            }
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setHours(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case "tsDayModal":
            var inp=cmd.fields.getTextInputValue("tsDayInp");
            if(!/^\d+$/.test(inp)){
                cmd.deferUpdate();
                break;
            }
            var t=new Date(+cmd.message.content.split(":")[1]*1000);
            if(t.getHours()+storage[cmd.user.id].config.timeOffset<0){
                inp--;
            }
            if(t.getHours()+storage[cmd.user.id].config.timeOffset>23){
                inp++;
            }
            cmd.update(`<t:${Math.round(t.setDate(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
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
                cmd.reply({ephemeral:true,content:`I'm sorry, but I don't have a high enough permission to handle the following roles. If you'd like my help with these, go into Roles in the Server Settings, and drag a role I have above the roles you want me to manage.\n<@&${cantRoles.join(">, <@&")}>`,allowedMentions:{parse:[]}});
            }
            else{
                storage[cmd.guildId].autoJoinRoles=goodRoles;
                cmd.reply({content:`Alright, I will add these roles to new members: <@&${goodRoles.join(">, <@&")}>`,allowedMentions:{parse:[]},ephemeral:true});
                save();
            }
        break;
        case 'move-message':
            var msg=await cmd.channel.messages.fetch(cmd.message.content.split("`")[1]);
            var resp={files:[]};
            var replyBlip="";
            if(msg.type===19){
                var rMsg=await msg.fetchReference();
                replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_\n`;
            }
            resp.content=`\`\`\`\nThis message has been moved from ${cmd.channel.name} by Stewbot.\`\`\`${replyBlip}${msg.content}`;
            resp.username=msg.author.nickname||msg.author.globalName||msg.author.username;
            resp.avatarURL=msg.author.displayAvatarURL();
            var p=0;
            for(a of msg.attachments){
                var dots=a[1].url.split("?")[0].split(".");
                dots=dots[dots.length-1];
                await fetch(a[1].url.split("?")[0]).then(d=>d.arrayBuffer()).then(d=>{
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
        case 'tsMonth':
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setMonth(cmd.values[0])/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case 'tsType':
            cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000)/1000)}:${cmd.values[0]}>`);
        break;
    }
    if(cmd.customId?.startsWith("delete-")){
        if(cmd.user.id===cmd.customId.split("-")[1]||cmd.customId==="delete-all"||cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages)){
            cmd.message.delete();
        }
        else{
            cmd.reply({content:`I can't do that for you just now.`,ephemeral:true});
        }
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
            cmd.update({content:ll(`**Poll Closed**\n<@${poll.starter}> asked: **${poll.title}**${poll.choices.map((a,i)=>`\n${i}. ${a} **${storage[cmd.guildId].polls[cmd.message.id].options[a].length}** - ${pieCols[i][1]}`).join("")}\n\n**Voters**${Object.keys(storage[cmd.guildId].polls[cmd.message.id].options).map(opt=>`\n${opt}${storage[cmd.guildId].polls[cmd.message.id].options[opt].map(a=>`\n- <@${a}>`).join("")}`).join("")}`),components:[],allowedMentions:{"parse":[]},files:["./tempPoll.png"]});
            delete storage[cmd.guildId].polls[cmd.message.id];
            save();
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
        save();
    }
    if(cmd.customId?.startsWith("autoRole-")){
        let myRole=cmd.guild.members.cache.get(client.user.id).roles.highest.position;
        let id=cmd.customId.split("autoRole-")[1];
        let role=cmd.guild.roles.cache.get(id);
        if(!role){
            cmd.reply({content:`That role doesn't seem to exist anymore.`,ephemeral:true});
            return;
        }
        if(myRole<=role.rawPosition){
            cmd.reply({content:`I cannot help with that role at the moment. Please let a moderator know that for me to help with the **${cmd.roles.get(role).name}**, it needs to be dragged below my highest role in the Server Settings role list.`,ephemeral:true,allowedMentions:{parse:[]}});
        }
        else{
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                cmd.reply({content:`I cannot apply roles at the moment. Please let the moderators know to grant me the MANAGE_ROLES permission, and to place any roles they want me to manage below my highest role in the roles list.`});
            }
            else{
                if(!cmd.member.roles.cache.find(r=>r.id===id)){
                    cmd.member.roles.add(role);
                }
                else{
                    cmd.member.roles.remove(role);
                }
                cmd.deferUpdate();
            }
        }
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
    if(cmd.customId?.startsWith("ban-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.BanMembers)){
            var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
            if(target){
                target.ban({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to ban by ${cmd.user.username}.`});
                cmd.message.delete();
            }
            else{
                cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
            }
            if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                for(var i=0;i<storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                    try{
                        var badMess=await client.channels.cache.get(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[0]).messages.fetch(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[1]);
                        badMess.delete().catch(e=>{console.log(e)});
                        storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                        i--;
                    }
                    catch(e){console.log(e)}
                }
            }
        }
        else{
            cmd.reply({content:`You do not have sufficient permissions to ban members.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("untimeout-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.ModerateMembers)){
            storage[cmd.guild.id].users[cmd.customId.split("-")[1]].safeTimestamp=new Date();
            var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
            if(target){
                target.timeout(null);
                cmd.message.delete();
            }
            else{
                cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
            }
        }
        else{
            cmd.reply({content:`You do not have sufficient permissions to timeout members.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("kick-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.KickMembers)){
            var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
            if(target){
                target.kick({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to kick by ${cmd.user.username}.`});
                await cmd.reply({content:`Done. Do you wish to delete the messages in question as well?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("del-"+target.id).setLabel("Yes").setStyle(ButtonStyle.Success))],ephemeral:true});
                cmd.message.delete();
            }
            else{
                cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
            }
            if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                for(var i=0;i<storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                    try{
                        var badMess=await client.channels.cache.get(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[0]).messages.fetch(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[1]);
                        badMess.delete().catch(e=>{console.log(e)});
                        storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                        i--;
                    }
                    catch(e){console.log(e)}
                }
            }
        }
        else{
            cmd.reply({content:`You do not have sufficient permissions to kick members.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("del-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
            for(var i=0;i<storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                try{
                    var badMess=await client.channels.cache.get(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[0]).messages.fetch(storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages[i].split("/")[1]);
                    badMess.delete().catch(e=>{console.log(e)});
                    storage[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                    i--;
                }
                catch(e){console.log(e)}
            }
            await cmd.reply({content:`Done.`,ephemeral:true});
            cmd.message.delete();
        }
        else{
            cmd.reply({content:`You do not have sufficient permissions to delete messages.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("captcha-")){
        var action=cmd.customId.split("captcha-")[1];
        if(action==="done"){
            if(cmd.message.content.split("Entered: ")[1].replaceAll("`","")===cmd.message.content.split("`")[1]){
                cmd.update({content:`Thank you.`,components:[]});
                storage[cmd.user.id].captcha=false;
                storage[cmd.user.id].lastHash="";
                storage[cmd.user.id].hashStreak=0;
                for(var to=0;to<storage[cmd.user.id].timedOutIn.length;to++){
                    try{
                        client.guilds.cache.get(storage[cmd.user.id].timedOutIn[to]).members.fetch().then(members=>{
                            members.forEach(m=>{
                                if(m.id===cmd.user.id){
                                    m.timeout(null);
                                    storage[m.guild.id].users[m.id].safeTimestamp=new Date();
                                }
                            });
                        });
                    }catch(e){console.log(e)}
                    storage[cmd.user.id].timedOutIn.splice(to,1);
                    to--;
                }
            }
            else{
                cmd.message.delete();
            }
        }
        else if(action==="back"){
            var inp=cmd.message.content.split("Entered: ")[1].replaceAll("`","");
            if(inp.length>0){
                inp=inp.slice(0,inp.length-1);
            }
            cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: ${inp.length>0?"`":""}${inp}${inp.length>0?"`":""}`);
        }
        else{
            cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: \`${cmd.message.content.split("Entered: ")[1].replaceAll("`","")}${action}\``);
        }
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
    if(storage[react.message.guild?.id]?.filter.active&&react.message.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
        if(checkDirty(react.message.guild.id,`${react._emoji.name.trim()}`)){
            react.remove();
            if(storage[react.message.guild.id].filter.log){
                var c=client.channels.cache.get(storage[react.message.guild.id].filter.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({content:`I removed a ${react._emoji.id===null?react._emoji.name:`<:${react._emoji.name}:${react._emoji.id}>`} reaction from https://discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id} added by <@${user.id}> due to being in the filter.`});
                }
                else{
                    storage[react.message.guild.id].filter.log=false;
                }
            }
            return;
        }
    }
    else if(storage[react.message.guild?.id]?.filter.active){
        storage[react.message.guild.id].filter.active=false;
    }
    if(react.message.channel.id!==storage[react.message.guildId].starboard.channel&&(storage[react.message.guildId].starboard.emoji===react._emoji.name||storage[react.message.guildId].starboard.emoji===react._emoji.id)&&storage[react.message.guildId].starboard.active&&storage[react.message.guildId].starboard.channel&&!storage[react.message.guildId].starboard.posted.hasOwnProperty(react.message.id)){
        var msg=await react.message.channel.messages.fetch(react.message.id);
        const userReactions = react.message.reactions.cache.filter(reaction => reaction.users.cache.has(react.message.author.id)&&(storage[react.message.guildId].starboard.emoji===reaction._emoji.name||storage[react.message.guildId].starboard.emoji===reaction._emoji.id));
        if(msg.reactions.cache.get(storage[msg.guildId].starboard.emoji).count>=storage[msg.guildId].starboard.threshold+(userReactions?.size===undefined?0:userReactions.size)){
            var replyBlip="";
            if(msg.type===19){
                try{
                    var rMsg=await msg.fetchReference();
                    replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_`;
                }catch(e){}
            }
            var resp={files:[]};
            var i=0;
            react.message.attachments.forEach((attached) => {
                let url=attached.url.toLowerCase();
                if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||storage[react.message.guild.id].starboard.messType==="0"){
                    resp.files.push(attached.url);
                }
                i++;
            });
            if(storage[react.message.guild.id].starboard.messType==="0"){
                resp.content=react.message.content;
                resp.username=react.message.author.globalName||react.message.author.username;
                resp.avatarURL=react.message.author.displayAvatarURL();
                var c=client.channels.cache.get(storage[react.message.guild.id].starboard.channel);
                if(!c.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                    storage[react.message.guild.id].starboard.messType="2";
                    return;
                }
                var hook=await c.fetchWebhooks();
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
                    .setDescription(`${replyBlip?`${replyBlip}\n`:""}${react.message.content?react.message.content:"⠀"}`)
                    .setTimestamp(new Date(react.message.createdTimestamp))
                    .setFooter({
                        text: react.message.channel.name,
                        iconURL:"https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
                    })
                    .setImage(react.message.attachments.first()?react.message.attachments.first().url:null)
                ];
                if(storage[react.message.guild.id].starboard.messType==="1"){
                    resp.content=getStarMsg(react.message);
                }
                var c=client.channels.cache.get(storage[react.message.guild.id].starboard.channel)
                if(!c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
                    storage[react.message.guild.id].starboard.active=false;
                    return;
                }
                c.send(resp).then(d=>{
                    storage[react.message.guild.id].starboard.posted[react.message.id]=d.id;
                });
            }
            try{storage[react.message.guild.id].users[react.message.author.id].stars++;}catch(e){}
            save();
        }
    }
});
client.on("messageDelete",async msg=>{
    if(msg.guild?.id===undefined) return;
    if(!storage.hasOwnProperty(msg.guild.id)){
        storage[msg.guild.id]=structuredClone(defaultGuild);
        save();
    }
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
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        var num=msg.content?.match(/^(\d|,)+(?:\b)/i);
        if(num!==null&&num!==undefined){
            if(+num[0]===storage[msg.guild.id].counting.nextNum-1){
                msg.channel.send(num[0]).then(m=>m.react("✅"));
            }
        }
    }
    if(storage[msg.guild.id]?.logs.mod_actions&&storage[msg.guild.id]?.logs.active){
        if(msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ViewAuditLog)){
            setTimeout(async ()=>{
                const fetchedLogs = await msg.guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageDelete,
                    limit: 1,
                });
                const firstEntry = fetchedLogs.entries.first();
                if(!firstEntry) return;
                firstEntry.timestamp=BigInt("0b"+BigInt(firstEntry.id).toString(2).slice(0,39))+BigInt(1420070400000);
                if(firstEntry.target.id===msg?.author?.id&&BigInt(Date.now())-firstEntry.timestamp<BigInt(60000)){
                    var c=msg.guild.channels.cache.get(storage[msg.guild.id].logs.channel);
                    if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({content:ll(`**Message from <@${firstEntry.target.id}> Deleted by <@${firstEntry.executor.id}> in <#${msg.channel.id}>**\n\n${msg.content.length>0?`\`\`\`\n${msg.content}\`\`\``:""}${msg.attachments?.size>0?`There were **${msg.attachments.size}** attachments on this message.`:""}`),allowedMentions:{parse:[]}});
                    }
                    else{
                        storage[msg.guild.id].logs.active=false;
                    }
                }
            },2000);
        }
        else{
            storage[msg.guild.id].logs.mod_actions=false;
        }
    }
});
client.on("messageUpdate",async (msgO,msg)=>{
    if(msg.guild?.id===undefined||client.user.id===msg.author?.id) return;
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
                msg.reply(`This post by **${msg.author.globalName||msg.author.username}** sent <t:${Math.round(msg.createdTimestamp/1000)}:f> has been deleted due to retroactively editing a blocked word into the message.`);
            }
            msg.delete();
            if(storage[msg.author.id].config.dmOffenses&&!msg.author.bot){
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
        var replyBlip="";
        if(msg.type===19){
            var rMsg=await msg.fetchReference();
            replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_`;
        }
        msg.attachments.forEach((attached,i) => {
            let url=attached.url.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||storage[cmd.guildId].starboard.messType==="0"){
                resp.files.push(attached.url);
            }
        });
        resp.embeds=[new EmbedBuilder()
            .setColor(0x006400)
            .setTitle("(Jump to message)")
            .setURL(`https://www.discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`)
            .setAuthor({
                name: `${msg.author?.globalName||msg.author?.username}`,
                iconURL:msg.author?.displayAvatarURL(),
                url:`https://discord.com/users/${msg.author?.id}`
            })
            .setDescription(`${replyBlip?`${replyBlip}\n`:""}${msg.content?msg.content:"⠀"}`)
            .setTimestamp(new Date(msg.createdTimestamp))
            .setFooter({
                text: msg.channel.name,
                iconURL:"https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
            })
            .setImage(msg.attachments.first()?msg.attachments.first().url:null)
        ];
        if(storage[msg.guild.id].starboard.messType==="1"){
            resp.content=getStarMsg(msg);
        }
        var c=await client.channels.cache.get(storage[msg.guild.id].starboard.channel).messages.fetch(storage[msg.guild.id].starboard.posted[msg.id]);
        c.edit(resp);
    }
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        var num=msgO.content?.match(/^(\d|,)+(?:\b)/i);
        if(num!==null&&num!==undefined){
            if(+num[0]===storage[msg.guild.id].counting.nextNum-1){
                msg.channel.send(num[0]).then(m=>m.react("✅"));
            }
        }
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
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
            storage[member.guild.id].ajm.dm=true;
        }
        if(storage[member.guild.id].ajm.message==="") storage[member.guild.id].ajm.message=defaultGuild.ajm.message;
        if(storage[member.guild.id].ajm.dm){
            try{
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
                }]}).catch(e=>{});
            }catch(e){}
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
                client.channels.cache.get(storage[member.guild.id].ajm.channel).createWebhook({
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
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            storage[member.guild.id].stickyRoles=false;
        }
        else{
            storage[member.guild.id].users[member.id].roles.forEach(role=>{
                try{
                    let myRole=member.guild.members.cache.get(client.user.id).roles.highest.position;
                    var role=member.guild.roles.cache.find(r=>r.id===role);
                    if(role&&myRole>role.rawPosition){
                        member.roles.add(role);
                        addedStickyRoles++;
                    }
                }
                catch(e){}
            });
        }
    }
    if(addedStickyRoles===0&&storage[member.guild.id].autoJoinRoles){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
            storage[member.guild.id].autoJoinRoles=[];
        }
        if(storage[member.guild.id].autoJoinRoles.length>0){
            storage[member.guild.id].autoJoinRoles.forEach(role=>{
                let myRole=member.guild.members.cache.get(client.user.id).roles.highest.position;
                var role=member.guild.roles.cache.find(r=>r.id===role);
                if(role&&myRole>role.rawPosition){
                    member.roles.add(role);
                }
            });
        }
    }
    if(storage[member.guild.id].logs.active&&storage[member.guild.id].logs.joining_and_leaving){
        client.channels.cache.get(storage[member.guild.id].logs.channel).send({content:`**<@${member.id}> (${member.user.username}) has joined the server.**`,allowedMentions:{parse:[]}});
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
        var c=client.channels.cache.get(storage[member.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**<@${member.id}> (${member.user.username}) has ${bans.find(b=>b.user.id===member.id)?"been banned from":"left"} the server.**${bans.find(b=>b.user.id===member.id)?.reason!==undefined?`\n${bans.find(b=>b.user.id===member.id)?.reason}`:""}`,allowedMentions:{parse:[]}});
        }
        else{
            storage[member.guild.id].logs.active=false;
        }
    }
    if(storage[member.guild.id].alm?.active){
        if(!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
            storage[member.guild.id].alm.active=false;
            return;
        }
        if(storage[member.guild.id].alm.message==="") storage[member.guild.id].alm.message=defaultGuild.alm.message;
        var resp={
            content:storage[member.guild.id].alm.message.replaceAll("${@USER}",`**${member.user.username}**`),
            username:member.guild.name,
            avatarURL:member.guild.iconURL()
        };
        var hook=await client.channels.cache.get(storage[member.guild.id].alm.channel).fetchWebhooks();
        hook=hook.find(h=>h.token);
        if(hook){
            hook.send(resp);
        }
        else{
            client.channels.cache.get(storage[member.guild.id].alm.channel).createWebhook({
                name:"Stewbot",
                avatar: "https://cdn.discordapp.com/attachments/1145432570104926234/1170273261704196127/kt.jpg",
            }).then(d=>{
                d.send(resp);
            });
        }
    }
});

//Strictly log-based events
client.on("channelDelete",async channel=>{
    if(!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        var c=channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Channel \`${channel.name}\` Deleted**`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("channelUpdate",async (channelO,channel)=>{
    if(!storage.hasOwnProperty(channel.guild.id)){
        storage[channel.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[channel.guild.id].logs.active&&storage[channel.guild.id].logs.channel_events){
        var diffs=[];
        var caredAboutDiffs=["name","nsfw","topic","parentId","rateLimitPerUser"];
        Object.keys(channelO).forEach(key=>{
            if(channelO[key]!==channel[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=channel.guild.channels.cache.get(storage[channel.guild.id].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var rls={
                    "0":"None",
                    "5":"5s",
                    "10":"10s",
                    "15":"15s",
                    "30":"30s",
                    "60":"1m",
                    "120":"2m",
                    "300":"5m",
                    "600":"10m",
                    "900":"15m",
                    "1800":"30m",
                    "3600":"1h",
                    "7200":"2h",
                    "21600":"6h"
                };
                c.send({content:`**Channel Edited**${diffs.map(d=>`\n- ${d}`).join("")}`,embeds:[
                    {
                        "type": "rich",
                        "title": `${diffs.includes("name")?`#${channelO.name} -> `:""}#${channel.name}`,
                        "description": "",
                        "color": 0x006400,
                        "fields": [
                            {
                                "name": `Description`,
                                "value": `${diffs.includes("topic")?`${channelO.topic} -> `:""}${channel.topic}`,
                                "inline": true
                            },
                            {
                                "name": `Category Name`,
                                "value": `${diffs.includes("parentId]")?`${channelO.parentId===null?"None":client.channels.cache.get(channelO.parentId)?.name} -> `:""}${channel.parentId===null?"None":client.channels.cache.get(channel.parentId)?.name}`,
                                "inline": true
                            },
                            {
                                "name": `Slowmode`,
                                "value": `${diffs.includes("rateLimitPerUser")?`${rls[`${channelO.rateLimitPerUser}`]} -> `:""}${rls[`${channel.rateLimitPerUser}`]}`,
                                "inline": true
                            },
                            {
                                "name": `Age Restricted`,
                                "value": `${diffs.includes("nsfw")?`${channelO.nsfw} -> `:""}${channel.nsfw}`,
                                "inline": true
                            }
                        ],
                        "thumbnail":{
                            "url":channel.guild.iconURL(),
                            "width":0,
                            "height":0
                        },
                        "footer": {
                            "text": `Channel Edited`
                        },
                        "url": `https://discord.com/channels/${channel.guild.id}/${channel.id}`
                    }
                ]});
            }
            else{
                storage[channel.guild.id].logs.active=false;
            }
        }
    }
});
client.on("emojiCreate",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: created:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("emojiDelete",async emoji=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emoji.name}\`: deleted.**`);
        }
        else{
            storage[channel.guild.id].logs.active=false;
        }
    }
});
client.on("emojiUpdate",async (emojiO,emoji)=>{
    if(!storage.hasOwnProperty(emoji.guild.id)){
        storage[emoji.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[emoji.guild.id].logs.active&&storage[emoji.guild.id].logs.emoji_events){
        var c=emoji.guild.channels.cache.get(storage[emoji.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Emoji :\`${emojiO.name}\`: is now :\`${emoji.name}\`:** <:${emoji.name}:${emoji.id}>`);
        }
        else{
            storage[emoji.guild.id].logs.active=false;
        }
    }
});
client.on("stickerCreate",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Sticker \`${sticker.name}\` created**\n- **Name**: ${sticker.name}\n- **Related Emoji**: ${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${sticker.description}`,stickers:[sticker]});
        }
        else{
            storage[sticker.guild.id].logs.active=false;
        }
    }
});
client.on("stickerDelete",async sticker=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Sticker \`${sticker.name}\` Deleted**`);
        }
        else{
            storage[sticker.guild.id].logs.active=false;
        }
    }
});
client.on("stickerUpdate",async (stickerO,sticker)=>{
    if(!storage.hasOwnProperty(sticker.guild.id)){
        storage[sticker.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[sticker.guild.id].logs.active&&storage[sticker.guild.id].logs.emoji_events){
        let diffs=[];
        Object.keys(stickerO).forEach(key=>{
            if(stickerO[key]!==sticker.key){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=sticker.guild.channels.cache.get(storage[sticker.guild.id].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                c.send({content:`**Sticker Edited**\n- **Name**: ${diffs.includes("name")?`${stickerO.name} -> `:""}${sticker.name}\n- **Related Emoji**: ${diffs.includes("tags")?`${/^\d{19}$/.test(stickerO.tags)?`<:${client.emojis.cache.get(stickerO.tags).name}:${stickerO.tags}>`:stickerO.tags} -> `:""}${/^\d{19}$/.test(sticker.tags)?`<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`:sticker.tags}\n- **Description**: ${diffs.includes("description")?`${stickerO.description} -> `:""}${sticker.description}`,stickers:[sticker]});
            }
            else{
                storage[sticker.guild.id].logs.active=false;
            }
        }
    }
});
client.on("inviteCreate",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        var c=invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Created**\n- Code: ${invite.code}\n- Created by <@${invite.inviterId}>\n- Channel: <#${invite.channelId}>${invite._expiresTimestamp?`\n- Expires <t:${Math.round(invite._expiresTimestamp/1000)}:R>`:``}\n- Max uses: ${invite.maxUses>0?invite.maxUses:"Infinite"}`,allowedMentions:{parse:[]}});
        }
        else{
            storage[invite.guild.id].logs.active=false;
        }
    }
});
client.on("inviteDelete",async invite=>{
    if(!storage.hasOwnProperty(invite.guild.id)){
        storage[invite.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[invite.guild.id].logs.active&&storage[invite.guild.id].logs.invite_events){
        var c=invite.guild.channels.cache.get(storage[invite.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Invite \`${invite.code}\` Deleted**`,allowedMentions:{parse:[]}});
        }
        else{
            storage[invite.guild.id].logs.active=false;
        }
    }
});
client.on("roleCreate",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send({content:`**Role <@&${role.id}> created**`,allowedMentions:{parse:[]}});
        }
        else{
            storage[role.guild.id].logs.active=false;
        }
    }
});
client.on("roleDelete",async role=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
        if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            c.send(`**Role \`${role.name}\` Deleted**`);
        }
        else{
            storage[role.guild.id].logs.active=false;
        }
    }
});
client.on("roleUpdate",async (roleO,role)=>{
    if(!storage.hasOwnProperty(role.guild.id)){
        storage[role.guild.id]=structuredClone(defaultGuild);
        save();
    }

    if(storage[role.guild.id].logs.active&&storage[role.guild.id].logs.role_events){
        var diffs=[];
        var caredAboutDiffs=["name","hoist","mentionable","color"];
        Object.keys(roleO).forEach(key=>{
            if(roleO[key]!==role[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=role.guild.channels.cache.get(storage[role.guild.id].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[
                    {
                      "name": `Hoisted`,
                      "value": `${diffs.includes("hoist")?`${roleO.hoist} -> `:""}${role.hoist}`,
                      "inline": true
                    },
                    {
                      "name": `Pingable`,
                      "value": `${diffs.includes("mentionable")?`${roleO.mentionable} -> `:""}${role.mentionable}`,
                      "inline": true
                    }
                ];
                if(diffs.includes("color")){
                    flds.push({
                        "name": `Old Color`,
                        "value": `#${roleO.color}`,
                        "inline": false
                    });
                }
                c.send({content:`**Role <@&${role.id}> Edited**`,embeds:[{
                    "type": "rich",
                    "title": `${diffs.includes("name")?`${roleO.name} -> `:""}${role.name}`,
                    "description": "",
                    "color": role.color,
                    "fields": flds,
                    "thumbnail": {
                        "url": role.guild.iconURL(),
                        "height": 0,
                        "width": 0
                    }
                  }],allowedMentions:{parse:[]}});
            }
            else{
                storage[role.guild.id].logs.active=false;
            }
        }
    }
});
client.on("userUpdate",async (userO,user)=>{
    var diffs=[];
    var caredAboutDiffs=["username","globalName","avatar","banner"];
    Object.keys(userO).forEach(key=>{
        if(userO[key]!==user[key]&&caredAboutDiffs.includes(key)){
            diffs.push(key);
        }
    });
    Object.keys(storage).forEach(entry=>{
        if(storage[entry]?.users?.[user.id]?.inServer&&storage[entry].logs.active&&storage[entry].logs.user_change_events){
            var c=client.channels.cache.get(storage[entry].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[];
                if(diffs.includes("avatar")){
                    flds.push({
                        "name": `Avatar`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                if(diffs.includes("banner")){
                    flds.push({
                        "name": `Banner`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                c.send({content:`**User <@${user.id}> Edited Globally**`,embeds:[{
                        "type": "rich",
                        "title": `${diffs.includes("globalName")?`${userO.globalName} -> `:""}${user.globalName}`,
                        "description": `${diffs.includes("username")?`${userO.username} -> `:""}${user.username}`,
                        "color": user.accentColor===undefined?0x006400:user.accentColor,
                        "fields": flds,
                        "thumbnail": {
                            "url": user.displayAvatarURL(),
                            "height": 0,
                            "width": 0
                        },
                        "url":`https://discord.com/users/${user.id}`
                    }],allowedMentions:{parse:[]}});
            }
            else{
                storage[entry].logs.active=false;
            }
        }
    });
});
client.on("guildMemberUpdate",async (memberO,member)=>{
    if(storage[member.guild.id]?.logs.active&&storage[member.guild.id]?.logs.user_change_events){
        var diffs=[];
        var caredAboutDiffs=["nickname","avatar"];
        Object.keys(memberO).forEach(key=>{
            if(memberO[key]!==member[key]&&caredAboutDiffs.includes(key)){
                diffs.push(key);
            }
        });
        if(diffs.length>0){
            var c=client.channels.cache.get(storage[member.guild.id].logs.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                var flds=[];
                if(diffs.includes("avatar")){
                    flds.push({
                        "name": `Avatar`,
                        "value": `Changed`,
                        "inline": true
                    });
                }
                c.send({content:`**User <@${member.id}> Edited for this Server**`,embeds:[{
                    "type": "rich",
                    "title": `${diffs.includes("nickname")?`${memberO.nickname} -> `:""}${member.nickname}`,
                    "description": `${member.user.username}`,
                    "color": member.user.accentColor===undefined?0x006400:member.user.accentColor,
                    "fields": flds,
                    "thumbnail": {
                        "url": member.displayAvatarURL()?member.displayAvatarURL():member.user.displayAvatarURL(),
                        "height": 0,
                        "width": 0
                    },
                    "url":`https://discord.com/users/${member.id}`
                }],allowedMentions:{parse:[]}});
            }
            else{
                storage[member.guild.id].logs.active=false;
            }
        }
    }
});

//Events for staff notifications
client.on("rateLimit",async d=>{
    notify(1,"Ratelimited -\n\n"+d);
});
client.on("guildCreate",async guild=>{
    storage[guild.id]=structuredClone(defaultGuild);
    save();
    notify(1,`Added to **a new server**!`);
});
client.on("guildDelete",async guild=>{
    delete storage[guild.id];
    save();
    notify(1,`Removed from **a server**.`);
});

//Error handling
function handleException(e) {
    notify(1, e.stack);
}
process.on('unhandledRejection', handleException);
process.on('unhandledException', handleException);

//Begin
client.login(process.env.token);