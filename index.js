// Imports 
process.env=require("./env.json");
process.env.beta && console.log("Importing discord")
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
process.env.beta && console.log("Discord imported")
const translate=require("@vitalets/google-translate-api").translate;
const RSSParser=require("rss-parser");
const rssParser=new RSSParser();
const crypto = require('crypto');
const { createCanvas } = require('canvas');
const { getEmojiFromMessage, parseEmoji } = require('./util');
const config=require("./data/config.json");
const bible=require("./data/kjv.json");
const fs=require("fs");
const path = require("path")
const storage=require("./storage.json");
const cmds=require("./data/commands.json");
const Sentiment = require('sentiment');
const dns = require('dns');
const { URL } = require('url');
process.env.beta && console.log("Importing backup.js")
const startBackupThread = require("./backup.js");
const mathjs = require('mathjs');
const nlp = require('compromise');

// Preliminary setup (TODO: move to a setup.sh)
if (!fs.existsSync("tempMove")) fs.mkdirSync('tempMove');
if (!fs.existsSync("tempMemes")) fs.mkdirSync('tempMemes');

// Commands
process.env.beta && console.log("Loading commands")
const commands = {}
for (file of fs.readdirSync("./commands")) {
    if (path.extname(file) === ".js") {
        const commandName = path.parse(file).name;
        const command = require("./commands/"+commandName)
        commands[commandName] = command;
    }
}

// Variables
const sentiment = new Sentiment();
var client;
function checkDirty(where, what, filter=false) {
    // If filter is false, it returns: hasBadWords
    // If filter is true, it returns [hadBadWords, censoredMessage, wordsFound]

    if (!where || !what) 
        if (!filter) return false
        else [false, '', []]

    // Unsnowflake all custom emojis
    what = String(what).replace(/<:(\w+):[0-9]+>/g, ":$1:")

    let dirty = false;
    let foundWords = []; // keep track of all filtered words to later tell the user what was filtered
    for (blockedWord of storage[where].filter.blacklist) {
        // Unsnowflake blocked word to match unsnowflaked message
        blockedWord = blockedWord.replace(/<:(\w+):[0-9]+>/g, ":$1:");
        
        const blockedWordRegex = new RegExp(`(\\b|^)${escapeRegex(blockedWord)}(ing|s|ed|er|ism|ist|es|ual)?(\\b|$)`, "igu")
        
        // Check for the word 
        if (blockedWordRegex.test(what) || what === blockedWord) {
            dirty = true;
            if (!filter) {
                return true;
            }
            else {
                foundWords.push(blockedWord)
                what = what.replace(blockedWordRegex, "[\\_]");
            }
        }
    }

    if (!filter) {
        // If we passed the check without exiting, it's clean
        return false;
    } 
    else {
        // If we're filtering, it needs a more structured output

        // Additional sanitization content
        if (dirty) {
            what = defangURL(what)
        }
        
        return [dirty, what, foundWords];
    }
}
var Bible={};
var properNames={};
Object.keys(bible).forEach(book=>{
    properNames[book.toLowerCase()]=book;
    Bible[book.toLowerCase()]=bible[book];//Make everything lowercase for compatibility with sanitizing user input
});
const ignoreSize = 10 + Object.keys(Bible).reduce((a, b) => a.length > b.length ? a : b).length;
const threshold = 3;
var kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(cs|computer-programming|hour-of-code|python-program)\/[a-z,\d,-]+\/\d+(?!>)\b/gi;
var discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d+)\/\d+\/\d+(?!>)\b/gi;

// Data
const m8ballResponses = ["So it would seem", "Yes", "No", "Perhaps", "Absolutely", "Positively", "Unfortunately", "I am unsure", "I do not know", "Absolutely not", "Possibly", "More likely than not", "Unlikely", "Probably not", "Probably", "Maybe", "Random answers is not the answer"];
const pieCols=require("./data/pieCols.json");
const setDates=require("./data/setDates.json");
var helpPages=[
    {
        name:"General",
        commands:[
            {
                name:cmds.help.mention,
                desc:"This help menu"
            },
            {
                name:cmds.ping.mention,
                desc:"View uptime stats"
            },
            {
                name:cmds.links.mention,
                desc:"Every single link you may need for the bot"
            },
            {
                name:cmds.personal_config.mention,
                desc:"Set some options for your personal interactions with the bot"
            },
            {
                name:cmds.report_problem.mention,
                desc:"If anything goes wrong with the bot, an error, profanity, exploit, or even just a suggestion, use this command"
            }
        ]
    },
    {
        name:"Administration",
        commands:[
            {
                name:cmds.filter.mention,
                desc:"Configure different options for the filter, which will remove configurably blacklisted words"
            },
            {
                name:`${cmds.timeout.mention}/${cmds.kick.mention}/${cmds.ban.mention}`,
                desc:"Moderate a user"
            },
            {
                name:cmds.counting.mention,
                desc:"Configure counting, so that the bot manages a collaborative count starting at 1"
            },
            {
                name:cmds.auto_roles.mention,
                desc:"Configure automatic roles so that users can pick roles from a list and have them automatically applied"
            },
            {
                name:cmds.ticket.mention,
                desc:"Setup a ticket system so that users can communicate directly and privately with moderators"
            },
            {
                name:`${cmds["auto-join-message"].mention}/${cmds["auto-leave-message"].mention}`,
                desc:"Configure a message to be sent either in a channel or the user's DMs whenever a user joins or leaves"
            },
            {
                name:cmds.log_config.mention,
                desc:"Automatically be notified of different server and user events you may need to know about for moderation purposes"
            },
            {
                name:cmds.admin_message.mention,
                desc:"Send a message anonymously in the server's name"
            },
            {
                name:cmds["sticky-roles"].mention,
                desc:"Automatically reapply roles if a user leaves and then rejoins"
            },
            {
                name:cmds.move_message.mention,
                desc:"Move a user's message from one channel to another"
            },
            {
                name:cmds["auto-join-roles"].mention,
                desc:"Add one or more roles to every user that joins"
            },
            {
                name:cmds.general_config.mention,
                desc:"Configure options for the whole server such as AI pings or embedding links"
            },
            {
                name:cmds.levels_config.mention,
                desc:"Configure level-ups and exp for this server"
            },
            {
                name:cmds["daily-config"].mention,
                desc:"Configure daily devotions (more to come soon!) for your server"
            }
        ]
    },
    {
        name:"Entertainment",
        commands:[
            {
                name:cmds.fun.dne.mention,
                desc:"Posts a picture of a person who never existed using AI"
            },
            {
                name:cmds.fun.rac.mention,
                desc:"Play a game of Rows & Columns (use command for further help)"
            },
            {
                name:cmds.fun.wyr.mention,
                desc:"Posts a Would-You-Rather Question"
            },
            {
                name:cmds.fun.joke.mention,
                desc:"Posts a joke"
            },
            {
                name:cmds.fun.meme.mention,
                desc:"Posts an approved meme"
            },
            {
                name:cmds.poll.mention,
                desc:"Helps you to make and run a poll"
            },
            {
                name:cmds.submit_meme.mention,
                desc:"Submit a meme to be approved for the bot to post"
            },
            {
                name:cmds.random.rng.mention,
                desc:"Generate a random number"
            },
            {
                name:cmds.random["coin-flip"].mention,
                desc:"Flip a number of coins"
            },
            {
                name:cmds.random["8-ball"].mention,
                desc:"Receive a random answer to a question"
            },
            {
                name:cmds.random["dice-roll"].mention,
                desc:"Roll a number of dice"
            },
            {
                name:cmds.leaderboard.mention,
                desc:"View one of the leaderboards or rank cards"
            }
        ]
    },
    {
        name:"Informational",
        commands:[
            {
                name:cmds.define.mention,
                desc:"Defines a word"
            },
            {
                name:cmds.translate.mention,
                desc:"Translates a word or phrase"
            },
            {
                name:cmds.view_filter.mention,
                desc:"Posts a list of blacklisted words in this server"
            },
            {
                name:cmds.next_counting_number.mention,
                desc:"If counting is active, the next number to post to keep it going"
            },
            {
                name:cmds.bible.mention,
                desc:"Look up one or more verses in the King James Bible "
            },
            {
                name:cmds.embed_message.mention,
                desc:"Embed Discord message links with a command, useful for DMs with anyone if you install the bot to your account"
            },
            {
                name:cmds.timestamp.mention,
                desc:"Generate a timestamp that will show everyone the same time relevant to their timezone"
            },/*
            {
                name:cmds.unavailable.mention,
                desc:"If you're unavailable, have Stewbot let others know if they try to ping you!"
            },*/
            {
                name:cmds.user.mention,
                desc:"Get a user's profile information"
            }
        ]
    }
];
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
const defaultGuild=require("./data/defaultGuild.json");
const defaultGuildUser=require("./data/defaultGuildUser.json");
const defaultUser=require("./data/defaultUser.json");

async function finTimer(who){
    if(!storage[who].hasOwnProperty("timer")){
        return;
    }
    if(storage[who].timer.respLocation==="DM"){
        try{
            client.users.cache.get(who).send(`Your timer is done!${storage[who].timer.reminder.length>0?`\n\`${storage[who].timer.reminder}\``:``}`).catch(e=>{console.log(e)});
        }
        catch(e){console.log(e)}
    }
    else{
        try{
            var chan=await client.channels.cache.get(storage[who].timer.respLocation.split("/")[0]);
            try{
                if(chan&&chan?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    var msg=await chan.messages.fetch(storage[who].timer.respLocation.split("/")[1]);
                    if(msg){
                        msg.reply(`<@${who}>, your timer is done!${storage[who].timer.reminder.length>0?`\n\`${storage[who].timer.reminder}\``:``}`);
                        msg.edit({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setStyle(ButtonStyle.Danger).setDisabled(true))]});
                    }
                    else{
                        chan.send(`<@${who}>, your timer is done!${storage[who].timer.reminder.length>0?`\n\`${storage[who].timer.reminder}\``:``}`);
                    }
                }
                else{
                    client.users.cache.get(who).send(`Your timer is done!${storage[who].timer.reminder.length>0?`\n\`${storage[who].timer.reminder}\``:``}`).catch(e=>{console.log(e)});
                }
            }
            catch(e){
                client.users.cache.get(who).send(`Your timer is done!${storage[who].timer.reminder.length>0?`\n\`${storage[who].timer.reminder}\``:``}`).catch(e=>{console.log(e)});
            }
        }
        catch(e){console.log(e)}
    }
    delete storage[who].timer;
}


function escapeBackticks(text){
    return text.replace(/(?<!\\)(?:\\\\)*`/g, "\\`");
}
function processForNumber(text) {
    text = text?.toLowerCase() || '';                                                                                     

    const text2MathMap = {
        'plus': '+',
        'minus': '-',
        'times': '*',
        'multiplied by': '*',
        'divided by': '/', 
        'to the power of': '^', 
        'squared': '^2',
        'cubed': '^3',
    };

    // Temporarily replace " - " or "-" with a unique marker
    text = text.replace(/(\s*-\s+)|(\s+-\s*)/g, ' __HYD__ ');  // Replace spaces around hyphen or just hyphen
    text = text.replace(/(\s*minus\s+)|(\s+minus\s*)/g, ' __HYD__ ');

    var doc = nlp(text);
    doc.numbers().toNumber();
    text = doc.text();

    for (let [word, symbol] of Object.entries(text2MathMap)) {
        text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), symbol);
    }

    text = text.replace(/__HYD__/g, '-');

    // Extract equation as far up as is possible
    text = text.match(/^([0-9+\-*/^()\s\.]|sqrt)+/, '')?.[0]?.trim() || '';
    
    try {
        let result = mathjs.evaluate(text);
        result = +result.toFixed(1)
        return result;
    } catch (error) {
        return null;
    }
}

function verifyRegex(regexStr) {
    // returns: [isValid, error]

    // Check for backtracing
    if (!safe(regexStr)) {
        return [false, "This regex has catastrophic backtracking, please improve the regex and try again"]
    }

    // Check for RE2 compatibility
    try {
        new RE2(regexStr, 'ui');
    } catch {
        return [false, "This regex is invalid or uses features unsupported by [RE2](https://github.com/google/re2-wasm)"]
    }
    return [true, "Added to the filter."];

    // TODO evaluate user regexes like this:
    // const regex = new RE2(userProvidedRegex, 'ui'); // TODO: figure out some system for flags - i should default on but some uses cases may need it off
    // const result = regex.exec(msg.content);
    // console.log(result);
}
function escapeRegex(input) {
    return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
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

// Backup handlers
function backupThreadErrorCallback(error) {
    notify(1, String(error));
}

setInterval(()=>{fs.writeFileSync("./storage.json",process.env.beta?JSON.stringify(storage,null,4):JSON.stringify(storage));}, 10 * 1000);
// Cloud backups start inside the bot's on-ready listener

function limitLength(s){
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
        ret="main.jpg";
    }
    if(ret!==""){
        client.user.setAvatar(`./pfps/${ret}`);
    }
}
async function checkRSS(){
    if(!storage.hasOwnProperty("rss")) storage.rss={};
    Object.keys(storage.rss).forEach(async feed=>{
        feed=storage.rss[feed];
        if(feed.channels.length===0){
            delete storage.rss[feed.hash];
        }
        else{
            var cont=true;
            var parsed;
            try {
                // Get the URL myself to prevent local IP redirects
                const data = await (await fetchWithRedirectCheck(feed.url)).text();
                parsed = await rssParser.parseString(data);
            } catch (error) {
                cont = false;

                // Track fails
                if (feed.fails) {
                    feed.fails++;
                } 
                else {
                    feed.fails = 1;
                }

                // Remove failing URLs
                if (feed.fails > 7) {
                    delete storage.rss[feed.hash];
                }
            }
            if(cont){
                let lastSentDate = new Date(feed.lastSent);
                let mostRecentArticle = lastSentDate;
                parsed.items.forEach(item=>{
                    let thisArticleDate = new Date(item.isoDate);
                    if(lastSentDate < thisArticleDate){
                        // Keep track of most recent
                        if (mostRecentArticle < thisArticleDate) {
                            mostRecentArticle = thisArticleDate;
                        }

                        feed.channels.forEach(chan=>{
                            let c=client.channels.cache.get(chan);
                            if(c===undefined||c===null||!c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                                feed.channels.splice(feed.channels.indexOf(chan),1);
                            }
                            else{
                                c.send(`New notification from a followed RSS feed\n${item.link}`);
                            }
                        });
                    }
                });
                // Update feed most recent now after sending all new ones since last time
                feed.lastSent = mostRecentArticle.toISOString();
            }
        }
    });
}
function defangURL(message, whitelistDomain="TODO") {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlPattern, (url) => {
        return url.replace(/:\/\//g, '[://]').replace(/\./g, '[.]');
    });
}
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
    
}

function getLvl(lvl){
    var total=0;
    while(lvl>-1){
        total+=5*(lvl*lvl)+(50*lvl)+100;
        lvl--;
    }
    return total;
}
function isPrivateIP(ip) {
    const privateRanges = [
        /^127\./,      // Loopback
        /^10\./,       // Private
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private
        /^192\.168\./, // Private
        /^169\.254\./  // Link-local
    ];
    return privateRanges.some((range) => range.test(ip));
};
async function isUrlAllowed(inputUrl) {
    try {
        let url;
        try {
            url = new URL(inputUrl);
        } catch {
            return [false, "that is not a valid url."];
        }

        // Only allow http/https protocols
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return [false, "only http and https are allowed."];
        }

        const addresses = await new Promise((resolve, reject) => {
            dns.lookup(url.hostname, { all: true }, (err, addresses) => {
                if (err) return reject(err);
                resolve(addresses);
            });
        });

        for (const { address } of addresses) {
            if (isPrivateIP(address)) {
                return [false, "private IPs are not allowed"];
            }
        }

        // URL is safe
        return [true, "valid"];

    } catch (error) {
        return [false, "URL validation failed - general failure"];
    }
}
const validateDNSForPrivateIP = async (hostname) => {
    return new Promise((resolve, reject) => {
        dns.lookup(hostname, { all: true }, (err, addresses) => {
            if (err) return reject(err);
            for (const { address } of addresses) {
                if (isPrivateIP(address)) {
                    return reject(new Error('Redirected to restricted IP address'));
                }
            }
            resolve();
        });
    });
};
const fetchWithRedirectCheck = async (inputUrl, maxRedirects = 5) => {
    let url = new URL(inputUrl);
    let redirects = 0;

    while (redirects < maxRedirects) {
        const response = await fetch(url.href, { redirect: 'manual' });
        if (response.status < 300 || response.status >= 400) {
            return response;
        }
        const location = response.headers.get('location');
        if (!location) {
            throw new Error('Redirect response without Location header');
        }
        // Resolve the new URL relative to the original
        url = new URL(location, url);

        // Perform DNS validation to prevent redirecting to private IPs
        await validateDNSForPrivateIP(url.hostname);
        redirects += 1;
    }

    throw new Error('Too many redirects');
};


/**
* Handle the information when a user reacts to a message, for emojiboards
*
* @param {MessageReaction | import("discord.js").PartialMessageReaction} react The reaction that was added
* @returns {Promise<void>}
*/
async function doEmojiboardReaction(react) {
    const emoji = getEmojiFromMessage(
        react.emoji.requiresColons ?
        `<:${react.emoji.name}:${react.emoji.id}>` :
        react.emoji.name
    )

    // exit if the emojiboard for this emoji is not setup
    if (!(emoji in storage[react.message.guildId].emojiboards)) return;

    const emojiboard = storage[react.message.guildId].emojiboards[emoji];

    if(!emojiboard.active) return;

    // exit if this message has already been posted
    if(react.message.id in emojiboard.posted) return;

    // Exit if the message is already an emojiboard post
    if(react.message.channel.id===emojiboard.channel) return;

    const messageData    = await react.message.channel.messages.fetch(react.message.id);
    const foundReactions = messageData.reactions.cache.get(react.emoji.id || react.emoji.name);
    const selfReactions  = react.message.reactions.cache.filter(r => r.users.cache.has(react.message.author.id) && r.emoji.name === react.emoji.name)

    // exit if we haven't reached the threshold
    if((emojiboard.threshold + selfReactions.size) > foundReactions?.count) {
        return;
    }

    var replyBlip = "";
    if(messageData.type === 19){
            try {
                    var refMessage = await messageData.fetchReference();
                    replyBlip      = `_[Reply to **${refMessage.author.username}**: ${refMessage.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${refMessage.content.length>22?"...":""}](<https://discord.com/channels/${refMessage.guild.id}/${refMessage.channel.id}/${refMessage.id}>)_`;
            } catch(e){}
    }

    const resp = { files:[] };
    var i = 0;
    react.message.attachments.forEach((attached) => {
            let url=attached.url.toLowerCase();
            if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||emojiboard.messType==="0"){
                    resp.files.push(attached.url);
            }
            i++;
    });

    if(emojiboard.messType==="0"){
            resp.content=react.message.content;
            resp.username=react.message.author.globalName||react.message.author.username;
            resp.avatarURL=react.message.author.displayAvatarURL();
            var c=client.channels.cache.get(emojiboard.channel);
            if(!c.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)){
                    emojiboard.messType="2";
                    return;
            }
            var hook=await c.fetchWebhooks();
            hook=hook.find(h=>h.token);
            if(hook){
                    hook.send(resp).then(h=>{
                            emojiboard.posted[react.message.id]=`webhook${h.id}`;
                    });
            }
            else{
                    client.channels.cache.get(emojiboard.channel).createWebhook({
                            name:config.name,
                            avatar: config.pfp,
                    }).then(d=>{
                            d.send(resp).then(h=>{
                                    emojiboard.posted[react.message.id]=`webhook${h.id}`;
                            });
                    });
            }
    }
    else{
            const emojiURL = (
                    react.emoji.requiresColons ?
                    (
                            react.emoji.animated ?
                            `https://cdn.discordapp.com/emojis/${react.emoji.id}.gif` :
                            `https://cdn.discordapp.com/emojis/${react.emoji.id}.png`
                    ) :
                    undefined
            )

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
                            text: `${!emojiURL ? react.emoji.name + ' ' : ''}${react.message.channel.name}`,
                            iconURL: emojiURL
                    })
                    .setImage(react.message.attachments.first()?react.message.attachments.first().url:null)
            ];
            if(emojiboard.messType==="1"){
                    resp.content=getStarMsg(react.message);
            }
            var c=client.channels.cache.get(emojiboard.channel)
            if(!c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
                    emojiboard.active=false;
                    return;
            }
            c.send(resp).then(d=>{
                    emojiboard.posted[react.message.id]=d.id;
            });
    }

    storage[react.message.guild.id].emojiboards[emoji] = emojiboard;
    try{
        if(!storage[react.message.guild.id].emojiboards[emoji].hasOwnProperty("posters")){
            storage[react.message.guild.id].emojiboards[emoji].posters={};
        }
        if(!storage[react.message.guild.id].emojiboards[emoji].posters.hasOwnProperty(react.message.author.id)){
            storage[react.message.guild.id].emojiboards[emoji].posters[react.message.author.id]=0;
        }
        storage[react.message.guild.id].emojiboards[emoji].posters[react.message.author.id]++;
        storage[react.message.guild.id].users[react.message.author.id].stars++;
    }catch(e){}
    
}

var started24=false;
function daily(dontLoop=false){
    if(!started24&&!dontLoop){
        setInterval(daily,60000*60*24);
        started24=true;
    }
    checkRSS();
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
    fetch("https://www.bible.com/verse-of-the-day").then(d=>d.text()).then(d=>{
        var verseContainer=d.split(`mbs-3 border border-l-large rounded-1 border-black dark:border-white pli-1 plb-1 pis-2`)[1].split("</div>")[0].split("</a>");
        var now=new Date();
        var votd={
            "type":"rich",
            "title":`Verse of the Day`,
            "description":`${verseContainer[0].split(">")[verseContainer[0].split(">").length-1]}\n\\- ${verseContainer[1].split("</p>")[0].split(">")[verseContainer[1].split("</p>")[0].split(">").length-1]}`,
            "color":0x773e09,
            "url":"https://www.bible.com/verse-of-the-day",
            "footer":{
                "text":`${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`
            }
        };
        Object.keys(storage).forEach(s=>{
            if(storage[s]?.daily?.verses?.active){
                var c=client.channels.cache.get(storage[s].daily.verses.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({embeds:[votd]});
                }
                else{
                    storage[s].daily.verses.active=false;
                }
            }
        });
    });
    if(storage.dailyMeme===undefined||storage.dailyMeme===null) storage.dailyMeme=-1;
    storage.dailyMeme++;
    if(storage.dailyMeme>=fs.readdirSync("./memes").length) storage.dailyMeme=0;
    Object.keys(storage).forEach(s=>{
        if(storage[s]?.daily?.memes?.active){
            var c=client.channels.cache.get(storage[s].daily.memes.channel);
            if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                c.send({content:`## Daily Meme`,files:[`./memes/${storage.dailyMeme}.${fs.readdirSync("./memes").filter(a=>a.split(".")[0]===`${storage.dailyMeme}`)[0].split(".")[1]}`]});
            }
            else{
                storage[s].daily.memes.active=false;
            }
        }
    });

}

let rac = { // TODO: move this into fun.js subfile
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

function getStarMsg(msg){
    var starboardHeaders=[
        `Excuse me, there is a new message.`,
        `I have detected a notification for you.`,
        `Greetings, esteemed individuals, a new message has achieved popularity.`,
        `Here's the mail it never fails`,
        `Detected popularity. Shall I put it on screen for you?`,
        `And now it's time for a word from our sponsor.`,
        `Got a message for you.`,
        `It's always a good day when @ posts`
    ];
    return `**${starboardHeaders[Math.floor(Math.random()*starboardHeaders.length)].replaceAll("@",msg.member?.nickname||msg.author?.globalName||msg.author?.username||"this person")}**`;
}
function getPrimedEmbed(userId,guildIn){
    var mes=storage[userId].primedEmbed;
    if(checkDirty(guildIn,mes.content)||checkDirty(guildIn,mes.author.name)||checkDirty(guildIn,mes.server.name)||checkDirty(guildIn,mes.server.channelName)){
        return {
            "type": "rich",
            "title": `Blocked`,
            "description": `I cannot embed that message due to this server's filter.`,
            "color": 0xff0000
          };
    }
    var emb=new EmbedBuilder()
        .setColor("#006400")
        .setAuthor({
            name: mes.author.name,
            iconURL: "" + mes.author.icon,
            url: "https://discord.com/users/" + mes.author.id
        })
        .setDescription(checkDirty(config.homeServer,mes.content,true)[1]||null)
        .setTimestamp(new Date(mes.timestamp))
        .setFooter({
            text: mes.server.name + " / " + mes.server.channelName,
            iconURL: mes.server.icon
        });
    if(mes.server.channelId){
        emb=emb.setTitle("(Jump to message)")
            .setURL(`https://discord.com/channels/${mes.server.id}/${mes.server.channelId}/${mes.id}`)
    }
    return emb;
}
function textToEmojiSentiment(text) {
    // returns: emoji, whether to react (via random test)

    // Return if the message is too large (announcement that mentions stewbot among others, etc)
    if (text.length > 200) {
        return [ '😐', false ]
    }

    const result = sentiment.analyze(text);

    // Take combined score and calculate final score based on size of message
    const neutralizedScore = result.score / (result.calculation.length||1);

    // The better model takes longer, so we'll swap to the fast one to prevent ddos if necessary

    // Most words lie between 4 to -4, a very few of them go up to 5.
    var [emoji, chance] = ((score) => {
        const neutral = [ '👋', 0.2 ]
        // Positive
        if (score >= 5) return [env.beta?'<:jerry:1281416051409555486>':"<:jerry:1280238994277535846>", 1];
        if (score >= 3) return ['🧡', 1];
        if (score >= 1) return ['🍲', 0.7];
        // No sentiment - TODO: wave should only react at random
        if (score == 0) return neutral;
        // Negative
        if (score <= -4) return ['😭', 1];
        if (score <= -3) return ['💔', 1];
        if (score <= -1) return ['😕', 0.3];
        // Fallback
        return neutral;
    })(neutralizedScore)

    const toReact = Math.random() < chance;

    // The above should always return, but if a mod breaks it this will catch it
    return [emoji, toReact];
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
            client.channels.cache.get(process.env.noticeChannel).send(limitLength(what));//Notify the staff of the Kestron Support server
        break;
    }}catch(e){}
}
var uptime=0;

//Actionable events
client.once("ready",async ()=>{
    // Schedule cloud backups every hour
    startBackupThread("./storage.json", 60*60*1000, backupThreadErrorCallback, true)

    uptime=Math.round(Date.now()/1000);
    notify(1,`Started <t:${uptime}:R>`);
    console.log(`Logged into ${client.user.tag}`);
    
    client.user.setActivity("𝐒teward 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
    setInterval(()=>{
        client.user.setActivity("𝐒teward 𝐓o 𝐄xpedite 𝐖ork",{type:ActivityType.Custom},1000*60*60*4);
    },60000*5);
    var now=new Date();
    setTimeout(daily,((now.getHours()>11?11+24-now.getHours():11-now.getHours())*(60000*60))+((60-now.getMinutes())*60000));

    Object.keys(storage).forEach(key=>{
        if(storage[key].hasOwnProperty("timer")){
            if(storage[key].timer.time-Date.now()>0){
                setTimeout(()=>{finTimer(key)},storage[key].timer.time-Date.now());
            }
            else{
                finTimer(key);
            }
        }
    });
});

async function sendHook(what, msg){
    if(typeof what==="string"){
        what={"content": what}
    }
    what.content=checkDirty(config.homeServer,what.content,true)[1];
    
    // Prevent pings
    what.allowedMentions = { parse: [] };

    // Thread IDs work a little different (channel is parent, and thread ID is channel ID)
    let mainChannel;
    if (msg.channel.isThread()) {
        mainChannel = msg.channel.parent;
        // Add in thread ID so it sends it there instead of the parent channel 
        what.threadId = msg.channel.id;
    } else {
        mainChannel = msg.channel;
    }

    var hook=await mainChannel.fetchWebhooks();
    hook=hook.find(h=>h.token);
    if(hook){
        hook.send(what);
    }
    else{
        mainChannel.createWebhook({
            name: config.name,
            avatar: config.pfp,
        }).then(d=>{
            d.send(what);
        });
    }
}

client.on("messageCreate",async msg=>{
    // WARNING: DO NOT MOVE the below line - could allow exploits using AI.
    if(msg.author.id===client.user.id) return;
    if(msg.content.startsWith("~sudo")){
        if(client.channels.cache.get("986097382267715604")?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
            switch(msg.content.split(" ")[1]){
                case "permStatus":
                    var missingPerms=[];
                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                        if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                            missingPerms.push(perm);
                        }
                    });
                    if(missingPerms.length===0) missingPerms.push(`No issues found`);
                    msg.reply(`As you command.${missingPerms.map(m=>`\n- ${m}`).join("")}`);
                break;
                case "configStatus":
                    switch(msg.content.split(" ")[2]){
                        case "filter":
                            msg.reply(`As you command.\n- Active: ${storage[msg.guild.id].filter.active}\n- Censor: ${storage[msg.guild.id].filter.censor}\n- Log to a channel: ${storage[msg.guild.id].filter.log} <#${storage[msg.guild.id].filter.channel}>\n- Blocked words: ${storage[msg.guild.id].filter.blacklist.length}`);
                        break;
                        case "autoMessage":
                            if(!storage[msg.guild.id].hasOwnProperty("alm")) storage[msg.guild.id].alm=structuredClone(defaultGuild.alm);
                            msg.reply(`As you command.\n## Auto Join Messages\n- Active: ${storage[msg.guild.id].ajm.active}\n- Location: ${storage[msg.guild.id].ajm.location||storage[msg.guild.id].ajm.dm?"DM":"Channel"}\n- Channel: ${storage[msg.guild.id].ajm.channel}\n- Message: \n\`\`\`\n${storage[msg.guild.id].ajm.message}\n\`\`\`\n## Auto Leave Messages\n- Active: ${storage[msg.guild.id].alm.active}\n- Channel: ${storage[msg.guild.id].alm.channel}\n- Message: \n\`\`\`\n${storage[msg.guild.id].alm.message}\n\`\`\``);
                        break;
                    }
                break;
                case "countSet":
                    storage[msg.guild.id].counting.nextNum=+msg.content.split(" ")[2];
                    msg.reply(`The next number to enter is **${storage[msg.guild.id].counting.nextNum}**.`);
                break;
                case "runDaily":
                    daily(true);
                    msg.reply(`Running the daily function...`);
                break;
                case "runWelcome":
                    storage[msg.guild.id].sentWelcome=false;
                    msg.guild.channels.cache.forEach(chan=>{
                        if(chan.permissionsFor(client.user.id).has(PermissionFlagsBits.ViewChannel)){
                            chan?.messages?.fetch({limit:3}).then(messages=>messages.forEach(msg=>{
                                if(!storage[msg.guild.id].sentWelcome&&(msg.content?.toLowerCase().includes("stewbot")||msg.content?.includes(client.user.id)||msg.author.id===client.user.id)){
                                    var errorFields=[];
                                    var neededPerms={
                                        "AddReactions":"Without this permission, some things like the counting game will not function properly",
                                        "ViewAuditLog":"Without this permission, I cannot run deleted message logs if you set it up",
                                        "SendMessages":"Without this permission, there may be instances where I cannot respond when requested to",
                                        "ManageMessages":"Without this permission, I cannot run the filter, or the move_message options, or persistent messages",
                                        "EmbedLinks":"Without this permission, any function where I would be uploading an image will not work",
                                        "AttachFiles":"Without this permission, any function where I upload a file (primarily images) does not work",
                                        "ManageRoles":"Without this permission, I cannot help you automatically manage roles for sticky roles or auto roles",
                                        "ManageWebhooks":"Without this permission, I cannot run level-ups, the censor function of the filter, one of the emojiboard modes, anonynous admin messaging, auto join and leave messages, tickets, or a couple other things.",
                                    };
                                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                                        if(!msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])&&neededPerms.hasOwnProperty(perm)){
                                            errorFields.push({
                                                "name":`${perm}`,
                                                "value":neededPerms[perm],
                                                "inline":true
                                            });
                                        }
                                    });
                                    var embs=[{
                                        "author":{
                                            "name":`Greetings! I am Stewbot.`,
                                            "icon_url":config.pfp
                                        },
                                        "description": "I am designed to assist moderators, entertain users, and provide many quality of life and utility functions. I'm looking forward to working with you! To get started, press any of the buttons below, or type `/` and start looking through my commands! You can also right click or hold down on any message, press Apps, and see what I can do there, too!\n\nWhat you see here is only the beginning, and there's so much more to discover!",
                                        "color": 0x006400,
                                        "fields": [
                                            {
                                                "name":`${cmds.filter.config.mention} ${cmds.filter.add.mention}`,
                                                "value":"Configure the filter to keep your server clean",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds.add_emojiboard.mention}`,
                                                "value":"Setup an emojiboard for use in your server",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds["auto-join-message"].mention} ${cmds["auto-leave-message"].mention}`,
                                                "value":"Setup a customized message when a member joins or leaves the server",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds.counting.config.mention}`,
                                                "value":"Setup the counting game",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds.embed_message.mention}`,
                                                "value":"Need to display a message from another channel or server? I've got you covered.",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds.general_config.mention} ${cmds.personal_config.mention}`,
                                                "value":"Don't like some things that the bot does? Change the bot's automatic behaviours using these commands.",
                                                "inline":true
                                            },
                                            {
                                                "name":`${cmds["sticky-roles"].mention} ${cmds["auto-join-roles"].mention}`,
                                                "value":"Setup roles that stay even when the user leaves and automatically apply roles when any user joins.",
                                                "inline":true
                                            },
                                            {
                                                "name":`Have any issues or questions?`,
                                                "value":`Can't figure something out? Have questions or just want to hang out? Join the support server! https://discord.gg/mTFKpBcvae`,
                                                "inline":true
                                            }
                                        ],
                                        "footer": {
                                          "text": "Liking what you see? Press my profile and then Add App to use me anywhere, even in DMs with other people!"
                                        },
                                        "thumbnail":{
                                            "url":config.pfp
                                        }
                                      }];
                                    if(errorFields.length>0){
                                        embs.push({
                                            "description": "I ran some diagnostics, there are some permissions I am missing. This isn't urgent, but without some of these permissions I will not be able to run some of my functions. Consider allowing Administrator permission, while not required it will make all of these errors irrelevant at once.",
                                            "fields": errorFields,
                                            "color":0xff0000,
                                            "title": "Permissions Errors",
                                            "footer": {
                                              "text": "Just a couple notes"
                                            }
                                          });
                                    }
                                    msg.channel.send({content:"Greetings!",embeds:embs});
                                    storage[msg.guild.id].sentWelcome=true;
                                }
                            }));
                        }
                    });
                break;
                case "resetHackSafe":
                    delete storage[msg.guild.id].users[msg.author.id].safeTimestamp;
                    msg.reply("Removed your anti-hack safe time");
                break
                case "echo":
                    msg.channel.send(msg.content.slice("~sudo echo ".length,msg.content.length));
                break;
            }
        }
        else{
            msg.reply("I was unable to verify you.");
        }
        return;
    }

    msg.guildId=msg.guildId||"0";
    if(msg.guildId!=="0"){
        if(!storage.hasOwnProperty(msg.guildId)){
            storage[msg.guildId]=structuredClone(defaultGuild);
        }
        if(!storage[msg.guildId].users.hasOwnProperty(msg.author.id)){
            storage[msg.guildId].users[msg.author.id]=structuredClone(defaultGuildUser);
        }
    }
    if(!storage.hasOwnProperty(msg.author.id)){
        storage[msg.author.id]=structuredClone(defaultUser);
        
    }
    if(msg.guild){
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }

    // Filter
    if(storage[msg.guildId]?.filter.active){
        
        let [filtered, filteredContent, foundWords] = checkDirty(msg.guildId, msg.content, true)

        if(filtered && msg.webhookId===null){
            msg.ogContent = msg.content;
            msg.content = filteredContent;

            storage[msg.guildId].users[msg.author.id].infractions++;
            msg.delete();
            if(storage[msg.guildId].filter.censor){
                var replyBlip="";
                if(msg.type===MessageType.Reply){
                    var rMsg=await msg.fetchReference();
                    replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"").replace(/\@/ig,"[@]")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_\n`;
                }

                const filteredMessageData = {
                    "username": msg.member?.nickname||msg.author.globalName||msg.author.username,
                    "avatarURL": msg.member?.displayAvatarURL(),
                    "content": limitLength(`\`\`\`\nThe following message from ${msg.author.username} has been censored by Stewbot.\`\`\`${replyBlip}${msg.content.slice(0,1800)}`),
                }

                sendHook(filteredMessageData, msg);
            }
            if(storage[msg.author.id].config.dmOffenses&&msg.webhookId===null){
                try{msg.author.send(limitLength(`Your message in **${msg.guild.name}** was ${storage[msg.guildId].filter.censor?"censored":"deleted"} due to the following word${foundWords.length>1?"s":""} being in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.ogContent.replaceAll("`","\\`")+"```":""}`)).catch(e=>{});}catch(e){}
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                var c=client.channels.cache.get(storage[msg.guildId].filter.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send(limitLength(`I have ${storage[msg.guildId].filter.censor?"censored":"deleted"} a message from **${msg.author.username}** in <#${msg.channel.id}> for the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.ogContent.replaceAll("`","\\`").replaceAll(/(?<=https?:\/\/[^(\s|\/)]+)\./gi, "[.]").replaceAll(/(?<=https?):\/\//gi, "[://]")}\`\`\``));
                }
                else{
                    storage[msg.guildId].filter.log=false;
                }
            }
            
            return;
        }
    }
    const messageFiltered = Boolean(msg.ogContent);
    
    // Sentiment Analysis reactions
    if (!messageFiltered && !msg.author.bot && /\bstewbot\'?s?\b/i.test(msg.content)) {
        var [emoji, toReact] = textToEmojiSentiment(msg.content);
        if (toReact) {
            msg.react(emoji);
        }
     }

    // Level-up XP
    if(!msg.author.bot&&storage[msg.guildId]?.levels.active&&storage[msg.guildId]?.users[msg.author.id].expTimeout<Date.now()&&!checkDirty(config.homeServer,msg.content)){
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
                                name:config.name,
                                avatar: config.pfp
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
        
    }
    
    // If the server uses counting, but Stewbot cannot add reactions or send messages, don't do counting
    if(!msg.author.bot&&storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel&&(!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.AddReactions)||!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages))){
        storage[msg.guildId].counting.active=false;
    }
    
    // Counting
    if(!msg.author.bot&&storage[msg.guildId]?.counting.active&&msg.channel.id===storage[msg.guildId]?.counting.channel){
        var num = processForNumber(msg.content);
        if(num){
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
                            if(storage[msg.guild.id].counting.failRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                                var fr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.failRole);
                                if(!fr){
                                    storage[msg.guild.id].counting.failRoleActive=false;
                                }
                                else{
                                    if(msg.guild.members.cache.get(client.user.id).roles.highest.position>fr.rawPosition){
                                        msg.member.roles.add(fr);
                                    }
                                    else{
                                        storage[msg.guild.id].counting.failRoleActive=false;
                                    }
                                }
                            }
                            
                        }
                    }
                    else{
                        msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:"```"}`);
                        storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
                        if(storage[msg.guild.id].counting.warnRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                            var wr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.warnRole);
                            if(!wr){
                                storage[msg.guild.id].counting.warnRoleActive=false;
                            }
                            else{
                                if(msg.guild.members.cache.get(client.user.id).roles.highest.position>wr.rawPosition){
                                    msg.member.roles.add(wr);
                                }
                                else{
                                    storage[msg.guild.id].counting.warnRoleActive=false;
                                }
                            }
                        }
                        
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
                    if(storage[msg.guild.id].counting.failRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                        var fr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.failRole);
                        if(!fr){
                            storage[msg.guild.id].counting.failRoleActive=false;
                        }
                        else{
                            if(msg.guild.members.cache.get(client.user.id).roles.highest.position>fr.rawPosition){
                                msg.member.roles.add(fr);
                            }
                            else{
                                storage[msg.guild.id].counting.failRoleActive=false;
                            }
                        }
                    }
                    
                }
                else{
                    msg.reply(`⚠️ **Warning**\nNope, that's incorrect. You have been warned! Next time this will reset the count. The next number is **${storage[msg.guild.id].counting.nextNum}**.\`\`\`\nNumbers entered must be the last number plus one, (so if the last entered number is 148, the next number is 149).${storage[msg.guild.id].counting.takeTurns>0?` You also need to make sure at least ${storage[msg.guild.id].counting.takeTurns} other ${storage[msg.guild.id].counting.takeTurns===1?"person":"people"} take${storage[msg.guild.id].counting.takeTurns===1?"s":""} a turn before you take another turn.\`\`\``:"```"}`);
                    storage[msg.guild.id].users[msg.author.id].beenCountWarned=true;
                    if(storage[msg.guild.id].counting.warnRoleActive&&msg.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                        var wr=msg.guild.roles.cache.get(storage[msg.guild.id].counting.warnRole);
                        if(!wr){
                            storage[msg.guild.id].counting.warnRoleActive=false;
                        }
                        else{
                            if(msg.guild.members.cache.get(client.user.id).roles.highest.position>wr.rawPosition){
                                msg.member.roles.add(wr);
                            }
                            else{
                                storage[msg.guild.id].counting.warnRoleActive=false;
                            }
                        }
                    }
                    
                }
            }
        }
    }
    
    // Persistent messages - always at the bottom of the channel. 
    if((msg.webhookId===null||msg.webhookId===undefined)&&storage[msg.guildId]?.hasOwnProperty("persistence")){
        if(!storage[msg.guild.id].persistence.hasOwnProperty(msg.channel.id)){
            storage[msg.guild.id].persistence[msg.channel.id]={
                "active":false,
                "content":"Jerry",
                "lastPost":null
            };
        }
        if(storage[msg.guild.id].persistence[msg.channel.id].active){
            if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)&&msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                if(storage[msg.guild.id].persistence[msg.channel.id].lastPost!==null){
                    try{
                        var mes=await msg.channel.messages.fetch(storage[msg.guild.id].persistence[msg.channel.id].lastPost).catch(e=>{});
                        if(mes) mes.delete();
                    }
                    catch(e){}
                }
                var resp={
                    "content":storage[msg.guild.id].persistence[msg.channel.id].content,
                    "avatarURL":msg.guild.iconURL(),
                    "username":msg.guild.name
                };
                var hook=await msg.channel.fetchWebhooks();
                hook=hook.find(h=>h.token);
                if(hook){
                    hook.send(resp).then(d=>{
                        storage[msg.guild.id].persistence[msg.channel.id].lastPost=d.id;
                    });
                }
                else{
                    client.channels.cache.get(msg.channel.id).createWebhook({
                        name: config.name,
                        avatar: config.pfp
                    }).then(d=>{
                        d.send(resp).then(d=>{
                            storage[msg.guild.id].persistence[msg.channel.id].lastPost=d.id;
                        });
                    });
                }
            }
            else{
                if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    msg.channel.send(`I do not have sufficient permissions to manage persistent messages for this channel. Please make sure I can both manage webhooks and delete messages and then run ${cmds.set_persistent_message.mention}.`);
                }
                storage[msg.guild.id].persistence[msg.channel.id].active=false;
            }
        }
    }

    // Discord message embeds
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
                    name: checkDirty(config.homeServer,mes.member?.nickname||mes.author.globalName||mes.author.username,true)[1],
                    iconURL: "" + mes.author.displayAvatarURL(),
                    url: "https://discord.com/users/" + mes.author.id,
                })
                .setDescription(checkDirty(config.homeServer,mes.content,true)[1]||null)
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
    var progsDeleted = false;
    if(embs.length>0){
        msg.reply({content:`-# Embedded linked message${embs.length>1?"s":""}. You can prevent this behavior by surrounding message links in \`<\` and \`>\`.`,embeds:embs,files:fils,allowedMentions:{parse:[]}});
    }
    else{
        //msg.reply({content:`Failed to embed message. Try opening the context menu (holding down on mobile, right clicking on desktop) and pressing Apps -> prime_embed, then use ${cmds.embed_message.mention} and type **PRIMED** into it. If I'm not in the server you want to embed a message from, you can use me anywhere by pressing my profile, then Add App, then Use it Everywhere.`,allowedMentions:{parse:[]}});
    }
    for(var i=0;i<progs.length;i++){
        let prog=progs[i];
        var progId = prog.split("/")[prog.split("/").length-1].split("?")[0];
        var embds=[];
        await fetch(`https://kap-archive.bhavjit.com/s/${progId}`, { method: "POST" })
        .then(d => d.json().catch(e => {console.error("Error in KAP /s/ endpoint",e); return false})).then(async d=>{
            let clr = 0x00ff00, progDeleted;
            if (d?.archive?.sourceDeleted || !d) {
                clr = 0xffff00;
                progsDeleted = true;
                progDeleted = true;
                if (!d) {
                    // Fallback to /g/ endpoint if possible
                    console.warn("KAP /s/ endpoint failed. Falling back to /g/ endpoint");
                    d = await fetch(`https://kap-archive.bhavjit.com/g/${progId}`, { method: "POST" })
                        .then(d=>d.json()).then(d=>d.status === 200 ? d : false)
                        .catch(e => console.error("Error in KAP /g/ fallback",e));
                    if (!d) {
                        console.warn("KAP /g/ fallback was not successful");
                        return;
                    }
                }
            }
            embds.push({
                type: "rich",
                title: d.title,
                description: `\u200b`,
                color: clr,
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
                    url: `https://${ progDeleted ? "kap-archive.bhavjit.com/thumb/" : "www.khanacademy.org/computer-programming/i/" }${d.id}/latest.png`,
                    height: 0,
                    width: 0,
                },
                thumbnail: {
                    url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                    height: 0,
                    width: 0,
                },
                footer: {
                    text: `${ progDeleted ? "Retrieved from" : "Backed up to" } https://kap-archive.bhavjit.com/`,
                    icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                },
                url: progDeleted ? `https://kap-archive.bhavjit.com/view?p=${d.id}` : `https://www.khanacademy.org/${d.type === "PYTHON" ? "python-program" : "computer-programming"}/i/${d.id}`
            });
        }).catch(e => console.error(e));
    }
    if(embds?.length>0){
        msg.suppressEmbeds(true);
        let cont = `Backed program${embds.length>1?"s":""} up to`;
        if (progsDeleted) cont = `${embds.length>1?"Backed programs up to and/or retrieved programs from":"Program retrieved from"}`;
        msg.reply({content: `${cont} the KAP Archive, which you can visit [here](https://kap-archive.bhavjit.com/).`,embeds:embds,allowedMentions:{parse:[]}});
    }

    // Ticket system
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
                username:msg.member?.nickname||msg.author.globalName||msg.author.username,
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
                        name: config.name,
                        avatar: config.pfp
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

    // Anti-hack message
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
                            msg.reply({content:`I have detected unusual activity from this account. I have temporarily applied a timeout. To remove this timeout, please use ${cmds.captcha.mention} in a DM with me, or a moderator can remove this timeout manually.\n\nIf a mod wishes to disable this behaviour, designed to protect servers from mass spam, ping, and NSFW hacked or spam accounts, run ${cmds.general_config.mention} and specify to disable Anti Hack Protection.`,components:[new ActionRowBuilder().addComponents(...sendRow)]});
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
        
    }
    if(storage[msg.guild?.id]?.users[msg.author.id].gone?.active&&storage[msg.guild?.id]?.users[msg.author.id].gone?.autoOff){
        storage[msg.guild.id].users[msg.author.id].gone.active=false;
        
    }
    if(storage[msg.author.id].gone?.active&&storage[msg.author.id].gone?.autoOff){
        storage[msg.author.id].gone.active=false;
        
    }
});
client.on("interactionCreate",async cmd=>{
    try{
        if(!cmd.isButton()&&!cmd.isModalSubmit()&&!cmd.isChannelSelectMenu()&&!cmd.isRoleSelectMenu()&&!cmd.isStringSelectMenu()) await cmd.deferReply({ephemeral:["poll","auto_roles","submit_meme","delete_message","move_message","auto-join-roles","join-roleOption","admin_message","personal_config","timestamp","unavailable","remove_embeds","prime_embed"].includes(cmd.commandName)||cmd.options.getBoolean("private")});
    }catch(e){}
    try{
        if(cmd.guildId!==0){
            if(!storage.hasOwnProperty(cmd.guildId)){
                storage[cmd.guildId]=structuredClone(defaultGuild);
                
            }
            if(!storage[cmd.guildId].users.hasOwnProperty(cmd.user.id)){
                storage[cmd.guildId].users[cmd.user.id]=structuredClone(defaultGuildUser);
                
            }
        }
    }
    catch(e){
        cmd.guild={"id":"0"};
    }
    if(!storage.hasOwnProperty(cmd.user.id)){
        storage[cmd.user.id]=structuredClone(defaultUser);
    }

    // Slash commands
    if (commands.hasOwnProperty(cmd.commandName)) {
        const commandScript = commands[cmd.commandName];
        // List of general globals it should have access to
        const providedGlobals = {
            client,
            storage,
            notify, // TODO: schema for some commands like /filter to preload and provide these functions
            checkDirty,
            cmds,
            config
        };
        requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            providedGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }
        await commands[cmd.commandName].execute(cmd, providedGlobals);
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
                
            });
            cmd.update({"content":"\u200b",components:[]});
        break;
        case 'poll-voters':
            cmd.reply({content:limitLength(`**Voters**\n${Object.keys(storage[cmd.guildId].polls[cmd.message.id].options).map(opt=>`\n${opt}${storage[cmd.guildId].polls[cmd.message.id].options[opt].map(a=>`\n- <@${a}>`).join("")}`).join("")}`),ephemeral:true,allowedMentions:{parse:[]}});
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
                cmd.reply({ephemeral:true,content:limitLength(`I'm sorry, but I can't help with the following roles as I don't have high enough permissions to. If you'd like me to offer these roles, visit Server Settings and make sure I have a role listed above the following roles. You can do this by dragging the order around or adding roles.\n\n${badRoles.map(a=>`- **${a}**`).join("\n")}`)});
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
            resp.username=msg.member?.nickname||msg.author.globalName||msg.author.username;
            resp.avatarURL=msg.author.displayAvatarURL();
            var p=0;
            for(a of msg.attachments){
                var dots=a[1].url.split("?")[0].split(".");
                dots=dots[dots.length-1];
                await fetch(a[1].url).then(d=>d.arrayBuffer()).then(d=>{
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
                    name: config.name,
                    avatar: config.pfp,
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
    if(cmd.customId?.startsWith("remWarn-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.ManageNicknames)){
            cmd.showModal(new ModalBuilder().setTitle("Remove a Warning").setCustomId(`remWarning-${cmd.customId.split("remWarn-")[1]}`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("warning").setLabel("Warning to remove").setPlaceholder("1").setStyle(TextInputStyle.Short).setMaxLength(2))));
        }
        else{
            cmd.deferUpdate();
        }
    }
    if(cmd.customId?.startsWith("clearWarn-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.KickMembers)){
            cmd.showModal(new ModalBuilder().setTitle("Clear All Warnings - Are you sure?").setCustomId(`clearWarning-${cmd.customId.split("clearWarn-")[1]}`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("confirm").setLabel("Are you sure?").setPlaceholder("\"Yes\"").setStyle(TextInputStyle.Short).setMaxLength(3).setMinLength(3))));
        }
        else{
            cmd.deferUpdate();
        }
    }
    if(cmd.customId?.startsWith("remWarning-")){
        if(!/\d\d?/ig.test(cmd.fields.getTextInputValue("warning"))){
            cmd.deferUpdate();
        }
        else if(+cmd.fields.getTextInputValue("warning")>=storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings.length){
            cmd.deferUpdate();
        }
        else{
            storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings.splice(cmd.fields.getTextInputValue("warning")-1,1);
            cmd.reply({content:`Alright, I have removed warning \`${cmd.fields.getTextInputValue("warning")}\` from <@${cmd.customId.split("-")[1]}>.`,allowedMentioned:{parse:[]}});
        }
    }
    if(cmd.customId?.startsWith("clearWarning-")){
        if(cmd.fields.getTextInputValue("confirm").toLowerCase()!=="yes"){
            cmd.deferUpdate();
        }
        else{
            storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings=[];
            cmd.reply({content:`Alright, I have cleared all warnings for <@${cmd.customId.split("-")[1]}>`,allowedMentions:{parse:[]}});
        }
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
    if(cmd.customId?.startsWith("autoRole-")){
        let myRole=cmd.guild.members.cache.get(client.user.id).roles.highest.position;
        let id=cmd.customId.split("autoRole-")[1];
        let role=cmd.guild.roles.cache.get(id);
        if(!role){
            cmd.reply({content:`That role doesn't seem to exist anymore.`,ephemeral:true});
            return;
        }
        if(myRole<=role.rawPosition){
            cmd.reply({content:`I cannot help with that role at the moment. Please let a moderator know that for me to help with the **${cmd.roles?.get(role)?.name}**, it needs to be dragged below my highest role in the Server Settings role list.`,ephemeral:true,allowedMentions:{parse:[]}});
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
                "url": config.pfp,
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
    if(cmd.customId?.startsWith("clearTimer-")){
        if((cmd.memberPermissions.has(PermissionFlagsBits.ManageMessages)&&cmd.targetMessage.id===storage[cmd.user.id].timer?.respLocation.split("/")[1])||cmd.user.id===cmd.customId.split("-")[1]){
            delete storage[cmd.user.id].timer;
            cmd.targetMessage.edit({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setStyle(ButtonStyle.Danger).setDisabled(true))]});
            cmd.followUp(`I have cleared the timer.`);
        }
        else{
            cmd.followUp(`That is not your timer to clear.`)
        }
    }
});
client.on("messageReactionAdd",async (react,user)=>{
    if(react.message.guildId===null) return;
    if(react.message.guildId!=="0"){
        if(!storage.hasOwnProperty(react.message.guildId)){
            storage[react.message.guildId]=structuredClone(defaultGuild);
            
        }
        if(!storage[react.message.guildId].users.hasOwnProperty(user.id)){
            storage[react.message.guildId].users[user.id]=structuredClone(defaultGuildUser);
            
        }
    }
    if(!storage.hasOwnProperty(user.id)){
        storage[user.id]=structuredClone(defaultUser);
        
    }
    if(storage[react.message.guild?.id]?.filter.active&&react.message.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageMessages)){
        if(checkDirty(react.message.guild.id,`${react._emoji}`)){
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
                        name: config.name,
                        avatar: config.pfp,
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
            
        }
    }

    doEmojiboardReaction(react);
});
client.on("messageDelete",async msg=>{
    if(msg.guild?.id===undefined) return;
    if(!storage.hasOwnProperty(msg.guild.id)){
        storage[msg.guild.id]=structuredClone(defaultGuild);
    }
    if(Object.keys(storage[msg.guild.id].emojiboards).length>0){
        Object.keys(storage[msg.guild.id].emojiboards).forEach(async emoji=>{
            emoji=storage[msg.guild.id].emojiboards[emoji];
            if(emoji.posted.hasOwnProperty(msg.id)){
                if(emoji.posted[msg.id].startsWith("webhook")&&emoji.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                    var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id].split("webhook")[1]);
                    c.delete();
                }
                else if(!emoji.posted[msg.id].startsWith("webhook")){
                    var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id]);
                    c.edit({content:`I'm sorry, but it looks like this post by **${msg.author?.globalName||msg.author?.username}** was deleted.`,embeds:[],files:[]});
                }
            }
        });
    }

    // Resend if the latest counting number was deleted
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        // var num=msg.content?.match(/^(\d|,)+(?:\b)/i);
        var num = msg.content ? processForNumber(msg.content) : null;
        console.log(msg.content);
        console.log(num);
        if(num!==null&&num!==undefined){
            if(+num===storage[msg.guild.id].counting.nextNum-1){
                msg.channel.send(String(num)).then(m=>m.react("✅"));
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
                    if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({content:limitLength(`**Message from <@${firstEntry.target.id}> Deleted by <@${firstEntry.executor.id}> in <#${msg.channel.id}>**\n\n${msg.content.length>0?`\`\`\`\n${msg.content}\`\`\``:""}${msg.attachments?.size>0?`There were **${msg.attachments.size}** attachments on this message.`:""}`),allowedMentions:{parse:[]}});
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
        let [filtered, filteredContent, foundWords] = checkDirty(msg.guildId, msg.content, true)

        if(filtered){
            storage[msg.guild.id].users[msg.author.id].infractions++;
            if(storage[msg.guildId].filter.censor){
                await msg.reply(`This post by **${msg.author.globalName||msg.author.username}** sent <t:${Math.round(msg.createdTimestamp/1000)}:f> has been deleted due to retroactively editing a blocked word into the message.`);
            }
            setTimeout(()=>{msg.delete()},2000);
            if(storage[msg.author.id].config.dmOffenses&&!msg.author.bot){
                msg.author.send(limitLength(`Your message in **${msg.guild.name}** was deleted due to editing in the following word${foundWords.length>1?"s":""} that are in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.content.replaceAll("`","\\`")+"```":""}`));
            }
            if(storage[msg.guildId].filter.log&&storage[msg.guildId].filter.channel){
                client.channels.cache.get(storage[msg.guildId].filter.channel).send(limitLength(`I have deleted a message from **${msg.author.username}** in <#${msg.channel.id}> for editing in the following blocked word${foundWords.length>1?"s":""}: ||${foundWords.join("||, ||")}||\`\`\`\n${msg.content.replaceAll("`","\\`")}\`\`\``));
            }
            
            return;
        }
    }
    if(Object.keys(storage[msg.guild.id].emojiboards).length>0){
        Object.keys(storage[msg.guild.id].emojiboards).forEach(async emote=>{
            var emoji=storage[msg.guild.id].emojiboards[emote];
            if(emoji.posted.hasOwnProperty(msg.id)&&!emoji.posted[msg.id]?.startsWith("webhook")){
                var resp={files:[]};
                var replyBlip="";
                if(msg.type===19){
                    var rMsg=await msg.fetchReference();
                    replyBlip=`_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_`;
                }
                msg.attachments.forEach((attached,i) => {
                    let url=attached.url.toLowerCase();
                    if(i!==0||(!url.includes(".jpg")&&!url.includes(".png")&&!url.includes(".jpeg")&&!url.includes(".gif"))||emoji.messType==="0"){
                        resp.files.push(attached.url);
                    }
                });
                if(emote.includes(":")){
                    footer.iconURL=``;
                }
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
                        name:msg.channel.name
                    })
                    .setImage(msg.attachments.first()?msg.attachments.first().url:null)
                ];
                if(emoji.messType==="1"){
                    resp.content=getStarMsg(msg);
                }
                var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id]);
                c.edit(resp);
            }
        }); 
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
                    name: config.name,
                    avatar: config.pfp
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
        
    }
    if(!storage[member.guild.id].users.hasOwnProperty(member.id)){
        storage[member.guild.id].users[member.id]=structuredClone(defaultGuildUser);
        
    }
    if(!storage.hasOwnProperty(member.id)){
        storage[member.id]=structuredClone(defaultUser);
        
    }

    storage[member.guild.id].users[member.id].roles=member.roles.cache.map(r=>r.id);
    storage[member.guild.id].users[member.id].inServer=false;
    

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
                name: config.name,
                avatar: config.pfp
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
            if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
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
            if(c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
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
    notify(1,`Added to **a new server**!`);

    guild.channels.cache.forEach(chan=>{
        if(chan.permissionsFor(client.user.id).has(PermissionFlagsBits.ViewChannel)){
            chan?.messages?.fetch({limit:3}).then(messages=>messages.forEach(msg=>{
                if(!storage[guild.id].sentWelcome&&(msg.content?.toLowerCase().includes("stewbot")||msg.content?.includes(client.user.id)||msg.author.id===client.user.id)){
                    var errorFields=[];
                    var neededPerms={
                        "AddReactions":"Without this permission, some things like the counting game will not function properly",
                        "ViewAuditLog":"Without this permission, I cannot run deleted message logs if you set it up",
                        "SendMessages":"Without this permission, there may be instances where I cannot respond when requested to",
                        "ManageMessages":"Without this permission, I cannot run the filter, or the move_message options, or persistent messages",
                        "EmbedLinks":"Without this permission, any function where I would be uploading an image will not work",
                        "AttachFiles":"Without this permission, any function where I upload a file (primarily images) does not work",
                        "ManageRoles":"Without this permission, I cannot help you automatically manage roles for sticky roles or auto roles",
                        "ManageWebhooks":"Without this permission, I cannot run level-ups, the censor function of the filter, one of the emojiboard modes, anonynous admin messaging, auto join and leave messages, tickets, or a couple other things.",
                    };
                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                        if(!guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])&&neededPerms.hasOwnProperty(perm)){
                            errorFields.push({
                                "name":`${perm}`,
                                "value":neededPerms[perm],
                                "inline":true
                            });
                        }
                    });
                    var embs=[{
                        "author":{
                            "name":`Greetings! I am Stewbot.`,
                            "icon_url":config.pfp
                        },
                        "description": "I am designed to assist moderators, entertain users, and provide many quality of life and utility functions. I'm looking forward to working with you! To get started, press any of the buttons below, or type `/` and start looking through my commands! You can also right click or hold down on any message, press Apps, and see what I can do there, too!\n\nWhat you see here is only the beginning, and there's so much more to discover!",
                        "color": 0x006400,
                        "fields": [
                            {
                                "name":`${cmds.filter.config.mention} ${cmds.filter.add.mention}`,
                                "value":"Configure the filter to keep your server clean",
                                "inline":true
                            },
                            {
                                "name":`${cmds.add_emojiboard.mention}`,
                                "value":"Setup an emojiboard for use in your server",
                                "inline":true
                            },
                            {
                                "name":`${cmds["auto-join-message"].mention} ${cmds["auto-leave-message"].mention}`,
                                "value":"Setup a customized message when a member joins or leaves the server",
                                "inline":true
                            },
                            {
                                "name":`${cmds.counting.config.mention}`,
                                "value":"Setup the counting game",
                                "inline":true
                            },
                            {
                                "name":`${cmds.embed_message.mention}`,
                                "value":"Need to display a message from another channel or server? I've got you covered.",
                                "inline":true
                            },
                            {
                                "name":`${cmds.general_config.mention} ${cmds.personal_config.mention}`,
                                "value":"Don't like some things that the bot does? Change the bot's automatic behaviours using these commands.",
                                "inline":true
                            },
                            {
                                "name":`${cmds["sticky-roles"].mention} ${cmds["auto-join-roles"].mention}`,
                                "value":"Setup roles that stay even when the user leaves and automatically apply roles when any user joins.",
                                "inline":true
                            }
                        ],
                        "footer": {
                          "text": "Liking what you see? Press my profile and then Add App to use me anywhere, even in DMs with other people!"
                        },
                        "thumbnail":{
                            "url":config.pfp
                        }
                      }];
                    if(errorFields.length>0){
                        embs.push({
                            "description": "I ran some diagnostics, there are some permissions I am missing. This isn't urgent, but without some of these permissions I will not be able to run some of my functions. Consider allowing Administrator permission, while not required it will make all of these errors irrelevant at once.",
                            "fields": errorFields,
                            "color":0xff0000,
                            "title": "Permissions Errors",
                            "footer": {
                              "text": "Just a couple notes"
                            }
                          });
                    }
                    msg.channel.send({content:"Greetings!",embeds:embs});
                    storage[msg.guild.id].sentWelcome=true;
                }
            }));
        }
    });
});
client.on("guildDelete",async guild=>{
    delete storage[guild.id];
    notify(1,`Removed from **a server**.`);
});

//Error handling
process.on('unhandledRejection', e=>notify(1, e.stack));
process.on('unhandledException', e=>notify(1, e.stack));

//Begin
client.login(process.env.token);
