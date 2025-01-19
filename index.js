// Imports
process.env=require("./env.json");
console.beta = (...args) => process.env.beta && console.log(...args);
console.beta("Importing discord")
const {Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
console.beta("Discord imported")
const translate = require("@vitalets/google-translate-api").translate; // Import requires, even though it's greyed out
const RSSParser=require("rss-parser");
const crypto = require('crypto');
const { createCanvas } = require('canvas');
const { getEmojiFromMessage, parseEmoji } = require('./util');
const config=require("./data/config.json");
// const bible=require("./data/kjv.json");
const fs=require("fs");
// const path = require("path")
const { getCommands } = require("./launchCommands.js"); // Note: current setup requires this to be before the commands.json import
const cmds=require("./data/commands.json"); global.cmds = cmds;
const dns = require('dns');
const { URL } = require('url');
console.beta("Importing backup.js")
const startBackupThread = require("./backup.js");
console.beta("Loading everything else")
var Turndown = require('turndown');
const wotdList=fs.readFileSync(`./data/wordlist.txt`,"utf-8").split("\n");
const cheerio = require('cheerio');
const { updateBlocklists } = require("./commands/badware_scanner.js")

// Preliminary setup (TODO: move to a setup.sh)
if (!fs.existsSync("tempMove")) fs.mkdirSync('tempMove');
if (!fs.existsSync("tempMemes")) fs.mkdirSync('tempMemes');
if (!fs.existsSync("./data/usage.json")) fs.writeFileSync('./data/usage.json', '{}');
const usage=require("./data/usage.json");

// Load commands modules
console.beta("Loading commands")
let commands = getCommands();
let messageListenerModules = Object.fromEntries(
    (Object.entries(commands)
            .filter(([name, command]) => command.onmessage) // Get all onmessage subscribed modules
    ).sort((a, b) => (a[1].data?.priority ?? 100) - (b[1].data?.priority ?? 100))
);

// Variables
const rssParser=new RSSParser({
    customFields: {
      item: ['description'],
    }
});
var turndown = new Turndown();
turndown.addRule('ignoreAll', {
    filter: ['img'], // Ignore image tags in description
    replacement: function () {
      return '';
    }
});
var client;

// Utility functions needed for processing some data blocks 
function escapeRegex(input) {
    return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
function hash(obj) {
    const input = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return crypto.createHash('md5').update(input).digest('hex');
}

// Database stuff
const storageLocations = ["./storage.json", "./storage2.json"];
let storageCycleIndex = 0;
function readLatestDatabase() {
    // TODO, multinode: this function will probably handle determining if the drive version or the local version is later, and copy those locally.
    // It should ideally also sort each drive location by write time, and pull them in the same way sortedLocations does here.
    //  although, it would be better to actually add a timestamp to the storage.json and read that... since upload time for the drive files is not hte same as the time the file was created, necessarily.
    //  or maybe it's close enough since under normal cases, it would only be 30 seconds off.


    // We'll overwrite these right away once we read the correct one
    const corruptedFiles = []

    // Get a list, in order of which ones we should read first
    const sortedLocations = storageLocations
        .filter(file => fs.existsSync(file)) // For file that exists,
        .map(file => ({
            file,
            mtime: fs.statSync(file).mtime   // get the last modified time
        }))
        .sort((a, b) => b.mtime - a.mtime)  // sort this array by the most frequent
        .map(({ file }) => file);
    
    for (let location of sortedLocations) {
        try {
            const data = require(location);
            if(process.env.beta) console.log(`Read database from ${location}`)

            // This shouldn't be needed, unless it was a boot-loop error that kept corrupting its own files. Plan for the worst.
            corruptedFiles.forEach(file => {
                fs.writeFileSync(file, JSON.stringify(data));
            })
            
            return data;
        } catch (e) {
            corruptedFiles.push(location)
            notify(1, `Storage location ${location} could not be loaded (*${e.message}*), trying the next one.`, true)
        }
    }

    // This case should never be hit - in theory we could try to load from the latest google drive. 
    notify(1, `No storage locations could be loaded. Tried: ${sortedLocations.join(", ")}.`);
    process.exit();
}
const storage = readLatestDatabase();
let lastStorageHash = hash(storage);
setInterval(() => {
    writeLocation = storageLocations[storageCycleIndex % storageLocations.length];
    const storageString = process.env.beta ? JSON.stringify(storage, null, 4) : JSON.stringify(storage);
    const thisWriteHash = hash(storageString);
    if (lastStorageHash !== thisWriteHash) {
        fs.writeFileSync(writeLocation, storageString);
        lastStorageHash = thisWriteHash;
        storageCycleIndex++; 
        if (process.env.beta) console.log(`Just wrote DB to ${writeLocation}`)
    }
}, 10 * 1000);


// Other data
const leetMap = require("./data/filterLeetmap.json");
const m8ballResponses = ["So it would seem", "Yes", "No", "Perhaps", "Absolutely", "Positively", "Unfortunately", "I am unsure", "I do not know", "Absolutely not", "Possibly", "More likely than not", "Unlikely", "Probably not", "Probably", "Maybe", "Random answers is not the answer"];
const pieCols=require("./data/pieCols.json");
const setDates=require("./data/setDates.json");
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

    "wotdModal":new TextInputBuilder().setCustomId("wotdInput").setLabel("Guess").setStyle(TextInputStyle.Short).setMinLength(5).setMaxLength(5).setRequired(true),

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

    "wotdModal":new ModalBuilder().setCustomId("wotdModal").setTitle("WOTD - Make a Guess").addComponents(new ActionRowBuilder().addComponents(inps.wotdModal)),

    "captcha":[new ActionRowBuilder().addComponents(inps.captcha1,inps.captcha2,inps.captcha3),new ActionRowBuilder().addComponents(inps.captcha4,inps.captcha5,inps.captcha6),new ActionRowBuilder().addComponents(inps.captcha7,inps.captcha8,inps.captcha9),new ActionRowBuilder().addComponents(inps.captchaBack,inps.captcha0,inps.captchaDone)]
};
const defaultGuild=require("./data/defaultGuild.json");
const defaultGuildUser=require("./data/defaultGuildUser.json");
const defaultUser=require("./data/defaultUser.json");

var helpCommands=[];
Object.keys(commands).forEach(commandName=>{
    var cmd=commands[commandName];
    if(cmd.data?.help?.shortDesc!==undefined&&cmd.data?.help?.shortDesc!==`Stewbot's Admins Only`&&cmd.data?.help?.helpCategories.length>0){
        const commandMention = cmds[cmd.data?.command?.name]?.mention || `\`${commandName}\` Module`; // non-command modules don't have a mention
        helpCommands.push(Object.assign({
            name: cmd.data?.command?.name || commandName,
            mention: commandMention
        },cmd.data?.help));
    }
    else if(cmd.data?.help?.shortDesc!==`Stewbot's Admins Only`){
        Object.keys(cmd.data?.help).forEach(subcommand=>{
            var subcommandHelp=cmd.data?.help[subcommand];
            const subcommandMention = cmds[cmd.data?.command?.name]?.[subcommand]?.mention || `\`${commandName}\` Module` // No case for this rn but might have one in the future
            if(subcommandHelp.helpCategories?.length>0){
                helpCommands.push(Object.assign({
                    name: `${commandName} ${subcommand}`,
                    mention: subcommandMention
                },subcommandHelp));
            }
        });
    }
});

const helpCategories = ["General", "Bot", "Information", "Entertainment", "Configuration", "Administration", "Safety", "Context Menu", "Server Only"];
function makeHelp(page,categories,filterMode,forWho){
    page=+page;
    if(categories.includes("All")){
        categories=structuredClone(helpCategories);
    }
    if(categories.includes("None")){
        categories=[];
    }
    const buttonRows=[];
    buttonRows.push(...chunkArray(chunkArray(helpCommands.filter(command=>{
        switch(filterMode){
            case 'And':
                var ret=true;
                categories.forEach(category=>{
                    if(!command.helpCategories.includes(category)){
                        ret=false;
                    }
                });
                return ret;
            break;
            case 'Or':
                var ret=false;
                categories.forEach(category=>{
                    if(command.helpCategories.includes(category)){
                        ret=true;
                    }
                });
                return ret;
            break;
            case 'Not':
                var ret=true;
                categories.forEach(category=>{
                    if(command.helpCategories.includes(category)){
                        ret=false;
                    }
                });
                return ret;
            break;
        }
    }), 9).map((chunk,i)=>
        new ButtonBuilder().setCustomId(`help-page-${i}-${forWho}`).setLabel(`Page ${i+1}`).setStyle(ButtonStyle.Primary).setDisabled(i===page)
    ),5).map(chunk=>
        new ActionRowBuilder().addComponents(
            ...chunk
        )
    ));
    buttonRows.push(...chunkArray(helpCategories, 5).map(chunk => 
        new ActionRowBuilder().addComponents(
            chunk.map(a => 
                new ButtonBuilder()
                    .setCustomId(`help-category-${a}-${forWho}`)
                    .setLabel(a)
                    .setStyle(categories.includes(a)?ButtonStyle.Success:ButtonStyle.Secondary)
            )
        )
    ));	
    buttonRows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`help-mode-And-${forWho}`).setLabel("AND Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="And"),new ButtonBuilder().setCustomId(`help-mode-Or-${forWho}`).setLabel("OR Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="Or"),new ButtonBuilder().setCustomId(`help-mode-Not-${forWho}`).setLabel("NOT Mode").setStyle(ButtonStyle.Danger).setDisabled(filterMode==="Not")));	
    
    return {
        content: `## Help Menu\nPage: ${page+1} | Mode: ${filterMode} | Categories: ${categories.length===0?`None`:categories.length===helpCategories.length?`All`:categories.join(", ")}`, embeds: [{
            "type": "rich",
            "title": `Help Menu`,
            "description": ``,
            "color": 0x006400,
            "fields": helpCommands.filter(command=>{
                switch(filterMode){
                    case 'And':
                        var ret=true;
                        categories.forEach(category=>{
                            if(!command.helpCategories.includes(category)){
                                ret=false;
                            }
                        });
                        return ret;
                    break;
                    case 'Or':
                        var ret=false;
                        categories.forEach(category=>{
                            if(command.helpCategories.includes(category)){
                                ret=true;
                            }
                        });
                        return ret;
                    break;
                    case 'Not':
                        var ret=true;
                        categories.forEach(category=>{
                            if(command.helpCategories.includes(category)){
                                ret=false;
                            }
                        });
                        return ret;
                    break;
                }
            }).slice(page*9,(page+1)*9).map(a => {
                return {
                    "name": limitLength(a.mention, 256),
                    "value": limitLength(a.shortDesc, 1024),
                    "inline": true
                };
            }),
            "thumbnail": {
                "url": config.pfp,
                "height": 0,
                "width": 0
            },
            "footer": {
                "text": `Help Menu for Stewbot. To view a detailed description of a command, run /help and tell it which command you are looking for.`
            }
        }],
        components: buttonRows
    };
}

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
async function finTimer(who,force){
    if(!storage[who].hasOwnProperty("timer")){
        return;
    }
    if(storage[who].timer.time-Date.now()>10000&&!force){
        setTimeout(()=>{finTimer(who)},storage[who].timer.time-Date.now());
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
                        msg.reply(`<@${who}>, your timer is done!${storage[who].timer.reminder.length>0?`\n\`${escapeBackticks(storage[who].timer.reminder)}\``:``}`);
                        msg.edit({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setCustomId("jerry").setStyle(ButtonStyle.Danger).setDisabled(true))]});
                    }
                    else{
                        chan.send(`<@${who}>, your timer is done!${storage[who].timer.reminder.length>0?`\n\`${escapeBackticks(storage[who].timer.reminder)}\``:``}`);
                    }
                }
                else{
                    client.users.cache.get(who).send(`Your timer is done!${storage[who].timer.reminder.length>0?`\n\`${escapeBackticks(storage[who].timer.reminder)}\``:``}`).catch(e=>{console.log(e)});
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
async function finTempRole(guild,user,role){
    if(!storage[guild].users[user].tempRoles?.hasOwnProperty(role)){
        return;
    }
    guild=client.guilds.cache.get(guild);
    if(guild===null||guild===undefined) return;
    user=guild.members.cache.get(user);
    role=guild.roles.cache.get(role);
    if(role===null||role===undefined||user===null||user===undefined) return;
    if(user.roles.cache.has(role.id)){
        user.roles.remove(role).catch(e=>{});
    }
    else{
        user.roles.add(role).catch(e=>{});
    }
    delete storage[guild.id].users[user.id].tempRoles[role.id];
}
async function finTempSlow(guild,channel,force){
    var chan=client.channels.cache.get(channel);
    if(!storage[guild]?.hasOwnProperty("tempSlow")||!storage[guild]?.tempSlow?.hasOwnProperty(channel)){
        return;
    }
    if(storage[guild].tempSlow[channel].ends-Date.now()>10000&&!force){
        setTimeout(()=>{finTempSlow(guild,channel)},storage[guild].tempSlow[channel].ends-Date.now());
        return;
    }
    if(chan===null||chan===undefined){
        client.users.cache.get(storage[guild].tempSlow[channel].invoker).send(`I was unable to remove the temporary slowmode setting in <#${channel}>.`).catch(e=>{});
        delete storage[guild].tempSlow[channel];
        return;
    }
    if(!chan.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageChannels)){
        client.users.cache.get(storage[guild].tempSlow[channel].invoker).send(`I was unable to remove the temporary slowmode setting in <#${channel}> due to not having the \`ManageChannels\` permission.`).catch(e=>{});
        delete storage[guild].tempSlow[channel];
        return;
    }
    chan.setRateLimitPerUser(storage[guild].tempSlow[channel].origMode);
    if(!storage[guild].tempSlow[channel].private){
        chan.send(`Temporary slowmode setting reverted.`);
        delete storage[guild].tempSlow[channel];
    }
}
async function finHatPull(who,force){
    if(!storage[who].hasOwnProperty("hat_pull")){
        return;
    }
    if(storage[who].hat_pull.closes-Date.now()>10000&&!force){
        if(storage[who].hat_pull.registered){
            setTimeout(()=>{finHatPull(who)},storage[who].hat_pull.closes-Date.now());
        }
        return;
    }
    var winners=[];
    for(var i=0;i<storage[who].hat_pull.winCount;i++){
        winners.push(storage[who].hat_pull.entered[Math.floor(Math.random()*storage[who].hat_pull.entered.length)]);
    }
    var chan=client.channels.cache.get(storage[who].hat_pull.location.split("/")[1]);
    if(chan===null||chan===undefined){
        client.users.cache.get(who).send(`I could not end the hat pull.\nhttps://discord.com/channels/${storage[who].hat_pull.location}${winners.map(a=>`\n- <@${a}>`).join("")}`).catch(e=>{});
        delete storage[who].hat_pull;
        return;
    }
    var cont=`This has ended! ${winners.length===0?`Nobody entered though.`:winners.length>1?`Here are our winners!${winners.map(a=>`\n- <@${a}>`).join("")}`:`Here is our winner: <@${winners[0]}>!`}`;
    var msg=await chan.messages.fetch(storage[who].hat_pull.location.split("/")[2]);
    if(msg===null||msg===undefined){
        chan.send(cont);
    }
    else{
        msg.edit({components:[]});
        msg.reply(cont);
    }
    delete storage[who].hat_pull;
}
async function finTempBan(guild,who,force){
    if(!storage[guild].tempBans.hasOwnProperty(who)){
        return;
    }
    if(storage[guild].tempBans[who].ends>Date.now()+10000&&!force){
        if(storage[guild].tempBans[who].ends-Date.now()<60000*60*24){
            setTimeout(()=>{finTempBan(guild,who)},storage[guild].tempBans[who].ends-Date.now());
        }
        return;
    }
    var g=client.guilds.cache.get(guild);
    if(g===null||g===undefined){
        try{
            client.users.cache.get(storage[guild].tempBans[who].invoker).send(`I was unable to unban <@${who}>.`).catch(e=>{});
        }
        catch(e){}
        delete storage[guild].tempBans[who];
        return;
    }
    if(!g.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.BanMembers)){
        try{
            client.users.cache.get(storage[guild].tempBans[who].invoker).send(`I no longer have permission to unban <@${who}>.`).catch(e=>{});
        }
        catch(e){}
        delete storage[guild].tempBans[who];
        return;
    }
    try{
        g.members.unban(who).catch(e=>{});
    }
    catch(e){}
    if(!storage[guild].tempBans[who].private){
        try{
            client.users.cache.get(who).send(`You have been unbanned in ${g.name}.`).catch(e=>{});
        }
        catch(e){}
    }
    delete storage[guild].tempBans[who];
}

function checkDirty(guildID, what, filter=false, applyGlobalFilter=false) {
    // If filter is false, it returns: hasBadWords
    // If filter is true, it returns [hadBadWords, censoredMessage, wordsFound]

    const originalContent = what; // Because we're preprocessing content, if the message was clean allow the original content without preprocessing 

    if (!guildID || !what) 
        if (!filter) return false
        else [false, what, []]

    // Preprocessing - anything here is destructive and will be processed this way if filtered
    what = String(what).replace(/<:(\w+):[0-9]+>/g, ":$1:") // unsnowflake emojis
    what = what.replace(/[\u200B-\u200D\u00AD]/g, ""); // strip 0-widths
    what = what.normalize("NFKD"); // unicode variants
    what = what.replace(/(\s)\s+/g, "$1"); // collapse spacing

    let dirty = false;
    let foundWords = []; // keep track of all filtered words to later tell the user what was filtered

    // Mostly for stewbot-created content (like AI), filter from both our and their server
    let blacklist = storage[guildID]?.filter?.blacklist;
    if (applyGlobalFilter) {
        const globalBlacklist = storage[config.homeServer]?.filter?.blacklist || [];
        blacklist = [...new Set([...(blacklist || []), ...globalBlacklist])];
    }

    if (blacklist) for (blockedWord of blacklist) {
        // Ignore the new beta json format for now
        if (typeof(blockedWord) !== 'string') {
            continue
        }

        // Unsnowflake blocked word to match unsnowflaked message
        blockedWord = blockedWord.replace(/<:(\w+):[0-9]+>/g, ":$1:");
        
        let blockedWordRegex;
        try {
            let word = escapeRegex(blockedWord)

            // More flexible matching
            if (word.length > 3) {
                for (let key in leetMap) { // Leet processing
                    if (leetMap.hasOwnProperty(key)) {
                        const replacement = leetMap[key];
                        word = word.replaceAll(key, replacement)
                    }
                }
                
                // This rule needs a ton more work, things like '(A|4|@|\\()\\(B\\|C\\+\\)\\+D' break it
                // word = word.replace(/(?:\\\S)|(?:\([^()]+\))|./g, '$1.{0,1}');

                word = word+"(ing|s|ed|er|ism|ist|es|ual)?" // match variations
            }
            blockedWordRegex = new RegExp(`(\\b|^)${word}(\\b|$)`, "ig")
        } catch (e) {
            // This should only ever be hit on old servers that have invalid regex before the escapeRegex was implemented
            if (!e?.message?.includes?.("http")) notify(1, "Caught filter error:\n" + JSON.stringify(e.message) + "\n" + e.stack);
            // We can ignore this filter word
            continue
        }

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
        } else {
            what = originalContent; // Put snowflakes back how they were
        }
        
        return [dirty, what, foundWords];
    }
}; global.checkDirty = checkDirty; // This function is important enough we can make it global

function escapeBackticks(text){
    return text.replace(/(?<!\\)(?:\\\\)*`/g, "\\`");
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

function backupThreadErrorCallback(error) {
    notify(1, String(error));
}

global.limitLength = function(s, size=1999) { // Used everywhere, so global function.
    s = String(s);
    return s.length>size?s.slice(0,size-3)+"...":s;
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
    var newPfp = null;
    var today=new Date();

    setDates.forEach(holiday=>{
        // if(holiday.days.includes(`${today.getMonth()+1}/${today.getDate()-1}`)){
        //     ret="main.jpg";
        // }
        if(holiday.days.includes(`${today.getMonth()+1}/${today.getDate()}`)){
            newPfp=holiday.pfp;
        }
    });
    if(today.getMonth()===10&&today.getDay()===4&&Math.floor(today.getDate()/7)===4){
        newPfp="turkey.jpg";
    }
    if(today.getMonth()===4&&today.getDay()===1&&today.getDate()+7>31){
        newPfp="patriot.jpg";
    }
    if(today.getMonth()+1===Easter(today.getFullYear()).split("/")[0]&&today.getDate()===Easter(today.getFullYear()).split("/")[1]){
        newPfp="easter.jpg";
    }
    
    newPfp = newPfp || "main.jpg"; // avoid null storage issues
    if (newPfp !== storage.pfp) {
        storage.pfp = newPfp;
        client.user.setAvatar(`./pfps/${newPfp}`);
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
                feed.fails = 0;
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

                for (item of parsed.items.reverse()) {
                    let thisArticleDate = new Date(item.isoDate);
                    if(lastSentDate < thisArticleDate){
                        // Keep track of most recent
                        if (mostRecentArticle < thisArticleDate) {
                            mostRecentArticle = thisArticleDate;
                        }

                        // Parse before sending to each channel
                        try {
                            // Extract theoretically required fields per https://www.rssboard.org/rss-specification
                            const link = item.link || parsed.link; // default to channel URL
                            let baseUrl = '';
                            if (link) { // Attempt to get baseURL for turndown parsing
                                try {
                                    baseUrl = new URL(link).origin;
                                } catch (e) {
                                    baseUrl = ''; // fallback if URL is invalid
                                }
                            }

                            let parsedDescription = turndown.turndown(item.description?.replace?.(/href="\/(.*?)"/g, `href="${(baseUrl)}/$1"`) || "");
                            let content =  parsedDescription || item.contentSnippet || turndown.turndown(item.content || "") || 'No Summary Available';
                            content = content.replace(/&quot;/g, '"')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>');

                            const embed = new EmbedBuilder()
                                .setColor(0x5faa66)
                                .setTitle(limitLength(item.title || parsed.description || 'No Title', 256)) // If no title, grab the feed description
                                .setDescription(limitLength(content, 1000));
                            if (link) embed.setURL(link)
                            
                            // Optional fields
                            const creator = item.creator || item["dc:creator"] || parsed.title || "Unknown Creator"; // 
                            const imageUrl = item?.image?.url || parsed?.image?.url;
                            if (creator) embed.setAuthor({ name: creator })
                            if (imageUrl) embed.setThumbnail(imageUrl);

                            // If the description has an image, attempt to load it as a large image (image *fields* are usually thumbnails / logos)
                            const $ = cheerio.load(item.description || "");
                            const contentImage = $('img').attr('src');
                            if (contentImage) embed.setImage(contentImage);

                            // Send this feed to everyone following it
                            for (chan of feed.channels) {
                                let c=client.channels.cache.get(chan);
                                if(c===undefined||c===null||!c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                                    feed.channels.splice(feed.channels.indexOf(chan),1);
                                }
                                else{
                                    try {
                                        c.send({ 
                                            content: `-# New notification from [a followed RSS feed](${item.link})`,
                                            embeds: [ embed ]
                                        })
                                    } catch (e) {
                                        notify(1, "RSS channel error: " + e.message + "\n" + e.stack);
                                    }
                                }
                            }

                        } catch (e) {
                            notify(1, "RSS feed error: " + e.message + "\n" + e.stack);
                        }
                    }
                };
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
    if (react.message.guildId == '0') return; // DMs patch

    const emoji = getEmojiFromMessage(
        react.emoji.requiresColons ?
        `<:${react.emoji.name}:${react.emoji.id}>` :
        react.emoji.name
    )

    // exit if the emojiboard for this emoji is not setup
    if (!(emoji in storage[react.message.guildId].emojiboards)) return;

    const emojiboard = storage[react.message.guildId].emojiboards[emoji];

    if(!emojiboard.active) return;

    if(!emojiboard.isMute){
        // exit if this message has already been posted
        if(react.message.id in emojiboard.posted) return;

        // Exit if the message is already an emojiboard post
        if(react.message.channel.id===emojiboard.channel) return;
    }

    const messageData    = await react.message.channel.messages.fetch(react.message.id);
    const foundReactions = messageData.reactions.cache.get(react.emoji.id || react.emoji.name);
    const selfReactions  = react.message.reactions.cache.filter(r => r.users.cache.has(react.message.author.id) && r.emoji.name === react.emoji.name)

    // exit if we haven't reached the threshold
    if((emojiboard.threshold+selfReactions.size)>foundReactions?.count){
        return;
    }

    if(emojiboard.isMute){
        var member=messageData.guild.members.cache.get(messageData.author.id);
        if(member===null||member===undefined){
            member=await messageData.guild.members.fetch(messageData.author.id);
        }
        if(member===null||member===undefined){
            return;
        }
        if(!member.bannable||!messageData.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ModerateMembers)||member.bot||member.permissions.has(PermissionFlagsBits.Administrator)){
            return;
        }
        try{
            member.timeout(emojiboard.length,`I was configured with /groupmute_config to do so.`).catch(e=>{});
        }
        catch(e){}
        return;//If it's a groupmute, don't bother with emojiboard stuff.
    }

    var replyBlip="";
    if(messageData.type===19){
        try {
            var refMessage=await messageData.fetchReference();
            replyBlip=`_[Reply to **${refMessage.author.username}**: ${refMessage.content.slice(0,22).replace(/(https?\:\/\/|\n)/ig,"")}${refMessage.content.length>22?"...":""}](<https://discord.com/channels/${refMessage.guild.id}/${refMessage.channel.id}/${refMessage.id}>)_`;
        }catch(e){}
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
    
    // Daily devo
    var dailyDevo=[];
    fetch("https://www.biblegateway.com/devotionals/niv-365-devotional/today").then(d=>d.text()).then(d=>{
        var temp=turndown.turndown(d.split(`<div class="col-xs-12">`)[1].split("</div>")[0].trim()).split("\\n");
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
    }).catch(e => {
        notify(1, "Devo daily: " + e.stack);
    });

    // Verse of the day
    fetch("https://www.bible.com/verse-of-the-day").then(d=>d.text()).then(d=>{
        var now=new Date();
        const nextData = JSON.parse(d.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/)[1])
        const verse = nextData.props.pageProps.verses[0];
        const versionData = nextData.props.pageProps.versionData; 

        // var verseContainer=d.split(`mbs-3 border border-l-large rounded-1 border-black dark:border-white pli-1 plb-1 pis-2`)[1].split("</div>")[0].split("</a>");
        var votd={
            "type":"rich",
            "title":`Verse of the Day`,
            // "description":`${verseContainer[0].split(">")[verseContainer[0].split(">").length-1]}\n\\- ${verseContainer[1].split("</p>")[0].split(">")[verseContainer[1].split("</p>")[0].split(">").length-1]}`,
            "description":`${verse.content}\n\n\\- **${verse.reference.human}** (${versionData.abbreviation})`,
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
    }).catch(e => {
        notify(1, "Verse Of The Day error: " + e.stack);
    });

    // Daily meme process
    if(storage.dailyMeme===undefined||storage.dailyMeme===null) storage.dailyMeme=-1;
    storage.dailyMeme++;
    if(storage.dailyMeme >= fs.readdirSync("./memes").length) storage.dailyMeme=0;

    // Per-server daily checks
    Object.keys(storage).forEach(s => {
        // Daily meme posting
        try {
            if(storage[s]?.daily?.memes?.active){
                var c=client.channels.cache.get(storage[s].daily.memes.channel);
                if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                    c.send({content:`## Daily Meme\n-# Meme \\#${storage.dailyMeme}`,files:[`./memes/${storage.dailyMeme}.${fs.readdirSync("./memes").filter(a=>a.split(".")[0]===`${storage.dailyMeme}`)[0].split(".")[1]}`]});
                }
                else{
                    storage[s].daily.memes.active=false;
                }
            }
        } catch (e) {
            notify(1, "Daily meme error: " + e.stack);
        }
        
        // Hat pull, i.e. giveaways
        try {
            if(storage[s]?.hasOwnProperty("hat_pull")){
                if(storage[s].hat_pull.ends-Date.now()<=60000*60*24){
                    storage[s].hat_pull.registered=true;
                    if(storage[s].hat_pull.ends-Date.now()>0){
                        setTimeout(()=>{finHatPull(s)},storage[s].hat_pull.ends-Date.now());
                    }
                    else{
                        finHatPull(s);
                    }
                }
            }
        } catch (e) {
            notify(1, "hat_pull timer creating error: " + e.stack);
        }
        
        // Temoving temp bans / setting timeouts to remove temp bans when it's within 24 hours of them
        try {
            if(storage[s]?.hasOwnProperty("tempBans")){
                Object.keys(storage[s].tempBans).forEach(ban=>{
                    if(storage[s].tempBans[ban].ends-Date.now()>0&&!storage[s].tempBans[ban].registered){
                        setTimeout(()=>{finTempBan(s,ban)},storage[s].tempBans[ban].ends-Date.now());
                    }
                    else if(!storage[s].tempBans[ban].registered){
                        finTempBan(s,ban);
                    }
                });
            }
        } catch (e) {
            notify(1, "Error creating tempBan removing timer: " + e.stack);
        }
    });

    // Set wotd
    storage.wotd=wotdList[Math.floor(Math.random()*wotdList.length)];
    notify(1, `WOTD is now ||${storage.wotd}||, use \`~sudo setWord jerry\` to change it.`)

    // Update badware blocklists
    updateBlocklists()
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

function sendWelcome(guild) {
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
}



var ints=Object.keys(GatewayIntentBits).map(a=>GatewayIntentBits[a]);
ints.splice(ints.indexOf(GatewayIntentBits.GuildPresences),1);
ints.splice(ints.indexOf("GuildPresences"),1);
client=new Client({
    intents:ints,
    partials:Object.keys(Partials).map(a=>Partials[a])
});
function notify(urgencyLevel,what,useWebhook=false) {
    console.beta(what);
    try{switch(urgencyLevel){
        default:
        case 0:
            client.users.cache.get(process.env.ownerId).send(what);//Notify Kestron06 directly
        break;
        case 1:
            if (useWebhook) {
                fetch(process.env.logWebhook, {
                    'method': 'POST',
                    'headers': {
                        "Content-Type": "application/json"
                    },
                    'body': JSON.stringify({
                        'username': "Stewbot Notify Webhook", 
                        "content": limitLength(what)
                    })
                })
            }
            else client.channels.cache.get(process.env.noticeChannel).send(limitLength(what));//Notify the staff of the Kestron Support server
        break;
    }}catch(e){
        if (process.env.beta) console.log("Couldn't send notify()")
    }
}
function betaLog(error) {
    if (!process.env.beta) return;
    if (error instanceof Error) {
        error = e.stack;
    }
    notify(1, error)
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
        try {
            if(storage[key]?.hasOwnProperty("timer")){
                if(storage[key].timer.time-Date.now()>0){
                    setTimeout(()=>{finTimer(key)},storage[key].timer.time-Date.now());
                }
                else{
                    finTimer(key);
                }
            }
            if(storage[key]?.hasOwnProperty("hat_pull")){
                if(storage[key].hat_pull.ends-Date.now()<=60000*60*24){
                    storage[key].hat_pull.registered=true;
                    if(storage[key].hat_pull.ends-Date.now()>0){
                        setTimeout(()=>{finHatPull(key)},storage[key].hat_pull.ends-Date.now());
                    }
                    else{
                        finHatPull(key);
                    }
                }
            }
            if(storage[key]?.hasOwnProperty("tempSlow")){
                Object.keys(storage[key].tempSlow).forEach(slow=>{
                    if(storage[key].tempSlow[slow].ends-Date.now()>0){
                        setTimeout(()=>{finTempSlow(key,slow)},storage[key].tempSlow[slow].ends-Date.now());
                    }
                    else{
                        finTempSlow(key,slow);
                    }
                });
            }
            if(storage[key]?.hasOwnProperty("tempBans")){
                Object.keys(storage[key].tempBans).forEach(ban=>{
                    if(storage[key].tempBans[ban].ends-Date.now()>0){
                        setTimeout(()=>{finTempBan(key,ban)},storage[key].tempBans[ban].ends-Date.now());
                        storage[key].tempBans[ban].registered=true;
                    }
                    else{
                        finTempBan(key,ban);
                    }
                });
            }
            if(storage[key]?.hasOwnProperty("users")){
                Object.keys(storage[key].users).forEach(user=>{
                    if(storage[key].users[user].hasOwnProperty("tempRoles")){
                        Object.keys(storage[key].users[user].tempRoles).forEach(role=>{
                            if(storage[key].users[user].tempRoles[role]-Date.now()>0){
                                setTimeout(()=>{finTempRole(key,user,role)},storage[key].users[user].tempRoles[role]-Date.now());
                            }
                            else{
                                finTempRole(key,user,role);
                            }
                        });
                    }
                });
            }
        } catch (e) {
            notify(1, "Error in dailies:\n" + e.stack);
        }
    });
});

global.sendHook = async function(what, msg) {
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

client.on("messageCreate",async msg => {
    if(msg.author.id===client.user.id) return;

    // Create guild objects if they don't exist should stay up top
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
        // Disable features in the server that the bot does not have permissions for.
        Object.keys(PermissionFlagsBits).forEach(perm=>{
            if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                noPerms(msg.guild.id,perm);
            }
        });
    }
    
    // Dispatch to listening modules
    const psudoGlobals = {
        client,
        storage,
        notify,
        checkDirty,
        cmds,
        config
    };
    Object.entries(messageListenerModules).forEach(([name, module]) => {
        // Check if this command is blocked with /block_module
        const commandPath = `${module.data?.command?.name || name}`; // ||name handles non-command modules
        // If this is a guild, check for blocklist
        if (msg.guild?.id) {
            let guildBlocklist = storage[msg.guild.id].blockedCommands || []
            guildBlocklist = guildBlocklist.map(blockCommand => blockCommand.replace(/^\//, '')) // Backwards compatability with block_command which had a leading /
            if (guildBlocklist.includes(commandPath)) {
                return; // Ignore this module
            }
        }
        // Check global blacklist from home server
        const globalBlocklist = storage[config.homeServer]?.blockedCommands || []
        if (globalBlocklist.includes(commandPath)) {
            return;
        }

        module.onmessage(msg, psudoGlobals);
    })

    // The sudo handler uses so many globals, it can stay in index.js for now
    if(msg.content.startsWith("~sudo ")&&!process.env.beta||msg.content.startsWith("~betaSudo ")&&process.env.beta){
        const devadminChannel = await client.channels.fetch("986097382267715604");
        await devadminChannel.guild.members.fetch(msg.author.id);

        // if(client.channels.cache.get("986097382267715604")?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
        if(devadminChannel?.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.SendMessages)){
            switch(msg.content.split(" ")[1]){
                case "permStatus":
                    var missingPerms=[];
                    Object.keys(PermissionFlagsBits).forEach(perm=>{
                        if(!msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits[perm])){
                            missingPerms.push(perm);
                        }
                    });
                    if(missingPerms.length===0) missingPerms.push(`No issues found`);
                    msg.reply(`As you command. My highest role is ${msg.guild.members.cache.get(client.user.id).roles.highest.name} at ${msg.guild.members.cache.get(client.user.id).roles.highest.rawPosition}.${missingPerms.map(m=>`\n- ${m}`).join("")}`);
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
                    sendWelcome(msg.guild);
                break;
                case "resetHackSafe":
                    delete storage[msg.guild.id].users[msg.author.id].safeTimestamp;
                    msg.reply("Removed your anti-hack safe time");
                break
                case "echo":
                    msg.channel.send(msg.content.slice("~sudo echo ".length,msg.content.length));
                break;
                case "setWord":
                    storage.wotd=msg.content.split(" ")[2].toLowerCase();
                    msg.reply(storage.wotd);
                break;
                case "checkRSS":
                    checkRSS();
                break;
                case "updateBlocklists":
                    updateBlocklists();
                break;
            }
        }
        else{
            msg.reply("I was unable to verify you.");
        }
        return;
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
    if(msg.reference&&msg.channel instanceof DMChannel&&!msg.author.bot){
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
    if(msg.guild && !msg.author.bot){
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
                                // sendRow.push(new ButtonBuilder().setCustomId("del-"+msg.author.id).setLabel(`Delete the Messages in Question`).setStyle(ButtonStyle.Primary));

                                // Instead just delete dirrectly
                                for(var i=0;i<storage[msg.guild.id].users[msg.author.id].lastMessages.length;i++){
                                    try{
                                        var badMess=await client.channels.cache.get(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[0]).messages.fetch(storage[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[1]);
                                        badMess.delete().catch(e=>{console.log(e)});
                                        storage[msg.guild.id].users[msg.author.id].lastMessages.splice(i,1);
                                        i--;
                                    }
                                    catch(e){console.log(e)}
                                }
                            }
                            await msg.reply({content:`I have detected unusual activity from <@${msg.author.id}>. I have temporarily applied a timeout. To remove this timeout, please use ${cmds.captcha.mention} in a DM with me, or a moderator can remove this timeout manually.\n\nIf a mod wishes to disable this behaviour, designed to protect servers from mass spam, ping, and NSFW hacked or spam accounts, run ${cmds.general_config.mention} and specify to disable Anti Hack Protection.`,components:[new ActionRowBuilder().addComponents(...sendRow)]});
                            setTimeout(_ => { msg.delete() }, 50)
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
    const commandScript = commands[cmd.commandName];
    if (!commandScript && (cmd.isCommand() || cmd.isAutocomplete())) return; // Ignore any potential cache issues 

    // Manage deferring
    try{
        if(
            !cmd.isButton() &&
            !cmd.isModalSubmit() &&
            !cmd.isChannelSelectMenu() &&
            !cmd.isRoleSelectMenu() &&
            !cmd.isStringSelectMenu()
        ) {
            const isPrivate = cmd.options.getBoolean("private");
            const isPrivateDefined = isPrivate !== null;
            const ephemeral = 
                isPrivateDefined ? cmd.options.getBoolean("private") : 
                commandScript?.data.deferEphemeral || // Slash commands base off this property.
                [ "join-roleOption" ].includes(cmd.commandName); // Backup for buttons that need to be ephemeral. 
            
            await cmd.deferReply({
                ephemeral
            });
        }
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

    // Autocomplete
    if (cmd.isAutocomplete()) {
        // Dispatch to relevent command if registered
        // List of general globals it should have access to
        const psudoGlobals = {
            client,
            storage,
            notify, // TODO: schema for some commands like /filter to preload and provide these functions
            checkDirty,
            cmds,
            config
        };

        requestedGlobals = commandScript.data?.requiredGlobals || commandScript.requestGlobals?.() || [];
        for (var name of requestedGlobals) {
            psudoGlobals[name] = eval(name.match(/[\w-]+/)[0]);
        }
        commands?.[cmd.commandName]?.autocomplete?.(cmd, psudoGlobals);
        return;
    }

    // Slash commands
    if (commands.hasOwnProperty(cmd.commandName)) {
        const commandPathWithSubcommand = `${cmd.commandName} ${cmd.options._subcommand ? cmd.options.getSubcommand() : "<none>"}`; //meh but it works
        const commandPath = `${cmd.commandName}`;
        // If this is a guild, check for blocklist
        if (cmd.guild?.id) {
            let guildBlocklist = storage[cmd.guild.id].blockedCommands || []
            guildBlocklist = guildBlocklist.map(blockedCommand => blockedCommand.replace(/^\//, '')) // Backwards compatability with block_command which had a leading /

            if (guildBlocklist.includes(commandPath) || guildBlocklist.includes(commandPathWithSubcommand)) {
                let response = "This command has been blocked by this server.";
                if (cmd.member.permissions.has('Administrator')) {
                    response += `\nYou can use ${cmds.block_module.mention} to unblock it.`
                }
                return cmd.followUp(response);
            }
        }
        // Check global blacklist from home server
        const globalBlocklist = storage[config.homeServer]?.blockedCommands || []
        if (globalBlocklist.includes(commandPath) || globalBlocklist.includes(commandPathWithSubcommand)) {
            return cmd.followUp("This command has temporarily been blocked by Stewbot admins.");
        }
        
        // Checks passed, run command
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
        if(!usage.hasOwnProperty(cmd.commandName)) usage[cmd.commandName]=0;
        usage[cmd.commandName]++;
        fs.writeFileSync("./data/usage.json",JSON.stringify(usage));
    }

    //Buttons, Modals, and Select Menus
    // MODULARIZE: use regex matching, maybe, for who to send buttons to?
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
        case 'revertTempSlow':
            if(!cmd.channel.permissionsFor(cmd.user.id).has(PermissionFlagsBits.ManageChannels)){
                cmd.reply({content:`You don't have sufficient permissions to use this button.`,ephemeral:true});
                break;
            }
            if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageChannels)){
                cmd.reply({content:`I don't have the \`ManageChannels\` permission and so I'm unable to revert the slowmode setting.`,ephemeral:true});
                break;
            }
            finTempSlow(cmd.guild.id,cmd.channel.id,true);
            cmd.message.edit({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Revert Now").setCustomId("revertTempSlow").setDisabled(true))]});
            cmd.reply({content:`Alright, reverted the setting early.`,ephemeral:true});
        break;
        case 'enterHatPull':
            await cmd.deferUpdate();
            Object.keys(storage).forEach(key=>{
                if(storage[key].hasOwnProperty("hat_pull")){
                    if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                        if(!storage[key].hat_pull.entered.includes(cmd.user.id)){
                            storage[key].hat_pull.entered.push(cmd.user.id);
                        }
                        else{
                            cmd.followUp({content:`You've already entered this`,ephemeral:true});
                        }
                    }
                }
            });
        break;
        case 'leaveHatPull':
            await cmd.deferUpdate();
            Object.keys(storage).forEach(key=>{
                if(storage[key].hasOwnProperty("hat_pull")){
                    if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                        if(storage[key].hat_pull.entered.includes(cmd.user.id)){
                            storage[key].hat_pull.entered.splice(storage[key].hat_pull.entered.indexOf(cmd.user.id),1);
                        }
                        else{
                            cmd.followUp({content:`You haven't entered this`,ephemeral:true});
                        }
                    }
                }
            });
        break;
        case 'closeHatPull':
            await cmd.deferUpdate();
            Object.keys(storage).forEach(key=>{
                if(storage[key].hasOwnProperty("hat_pull")){
                    if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                        if(key===cmd.user.id||cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){
                            finHatPull(key,true);
                        }
                        else{
                            cmd.followUp({content:`This isn't yours to close`,ephemeral:true});
                        }
                    }
                }
            });
        break;
        case 'cancelHatPull':
            await cmd.deferUpdate();
            Object.keys(storage).forEach(key=>{
                if(storage[key].hasOwnProperty("hat_pull")){
                    if(storage[key].hat_pull.location===`${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`){
                        if(key===cmd.user.id||cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){
                            cmd.message.edit({components:[]});
                            delete storage[key].hat_pull;
                        }
                        else{
                            cmd.followUp({content:`This isn't yours to cancel`,ephemeral:true});
                        }
                    }
                }
            });
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
            inp=+inp;
            var t=new Date(+cmd.message.content.split(":")[1]*1000);
            if(24-t.getHours()<storage[cmd.user.id].config.timeOffset){
                inp++;
            }
            if(t.getHours()-storage[cmd.user.id].config.timeOffset<0){
                inp--;
            }
            cmd.update(`<t:${Math.round(t.setDate(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
        break;
        case "wotdModal":
            var guess=cmd.fields.getTextInputValue("wotdInput").toLowerCase();
            if(!/^[a-z]{5}$/.test(guess)){
                cmd.reply({content:`Please enter a valid word.`,ephemeral:true});
                break;
            }
            if(checkDirty(config.homeServer,guess)){
                cmd.reply({content:`I am not willing to process this word.`,ephemeral:true});
                break;
            }
            if(!wotdList.includes(guess)){
                cmd.reply({content:`This is not a valid word.`,ephemeral:true});
                break;
            }
            var priorGuesses=cmd.message.content.split("\n").slice(1,7);
            var nextInp=-1;
            var accuracies={};
            var won=false;
            if(guess===storage.wotd) won=true;
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
                if(storage.wotd.split("")[i]===char){
                    guessAccuracy.push(`**${char.toUpperCase()}** `);
                    accuracies[char.toUpperCase()]=`**`;
                }
                else if(storage.wotd.includes(char)){
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
                cmd.update({content:`# WOTD Game\n${priorGuesses.join("\n")}\n\n${`QWERTYUIOP`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ASDFGHJKL`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ZXCVBNM`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n## Word: ||${storage.wotd.toUpperCase()}||`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(`Make a Guess`).setCustomId(`wotd-${cmd.user.id}`).setStyle(ButtonStyle.Primary).setDisabled(true),new ButtonBuilder().setLabel(`Based on Wordle`).setURL(`https://www.nytimes.com/games/wordle/index.html`).setStyle(ButtonStyle.Link))]});
            }
            else{
                cmd.update(`# WOTD Game\n${priorGuesses.join("\n")}\n\n${`QWERTYUIOP`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ASDFGHJKL`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}\n${`ZXCVBNM`.split("").map(lett=>`${accuracies[lett]}${lett}${accuracies[lett]}`).join(" ")}`);
            }
        break;

        //Select Menus
        case 'role-addOption':
            let myRole=cmd.guild.members.cache.get(client.user.id).roles.highest.position;
            var badRoles=[];
            var rows=[];
            var tempRow=[];
            cmd.values.forEach(role=>{
                if(cmd.roles.get(role).name===null||cmd.roles.get(role).name===undefined) return;
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
        if(role===undefined||role===null){
            cmd.reply({content:`That role doesn't seem to exist anymore.`,ephemeral:true});
            return;
        }
        if(myRole<=role.rawPosition){
            cmd.reply({content:`I cannot help with that role at the moment. Please let a moderator know that for me to help with the **${cmd.roles?.get(role)?.name}**, it needs to be dragged below my highest role in the Server Settings role list.`,ephemeral:true,allowedMentions:{parse:[]}});
        }
        else{
            if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
                cmd.reply({content:`I cannot apply roles at the moment. Please let the moderators know to grant me the MANAGE_ROLES permission, and to place any roles they want me to manage below my highest role in the roles list.`,ephemeral:true});
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
    if(cmd.customId?.startsWith("help-")){
        var opts=cmd.customId.split("-");
        if(opts[3]!==cmd.user.id){
            cmd.reply({content:`This isn't your help command! Use ${cmds.help.mention} to start your own help command.`,ephemeral:true});
        }
        else{
            switch(opts[1]){
                case 'page':
                    cmd.update(makeHelp(+opts[2],cmd.message.content.split("Categories: ")[1].split(", "),cmd.message.content.split("Mode: ")[1].split(" |")[0],cmd.user.id));
                break;
                case 'category':
                    var cats=cmd.message.content.split("Categories: ")[1]?.split(", ");
                    if(cats.length===0) cats=["None"];
                    if(cats.includes("All")){
                        cats=[opts[2]];
                    }
                    else if(cats.includes(opts[2])){
                        cats.splice(cats.indexOf(opts[2]),1);
                    }
                    else{
                        if(cats.includes("None")) cats=[];
                        cats.push(opts[2]);
                    }
                    cmd.update(makeHelp(0,cats,cmd.message.content.split("Mode: ")[1].split(" |")[0],cmd.user.id));
                break;
                case 'mode':
                    cmd.update(makeHelp(0,cmd.message.content.split("Categories: ")[1].split(", "),opts[2],cmd.user.id));
                break;
            }
        }
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
                // await cmd.reply({content:`Done. Do you wish to delete the messages in question as well?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("del-"+target.id).setLabel("Yes").setStyle(ButtonStyle.Success))],ephemeral:true});
                await cmd.reply({content:`Attempted to kick.`, ephemeral:true});
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
                if(!storage[cmd.user.id].hasOwnProperty("timedOutIn")) storage[cmd.user.id].timedOutIn=[];
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
            cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: \`${inp}\``);
        }
        else{
            cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: \`${cmd.message.content.split("Entered: ")[1].replaceAll("`","")}${action}\``);
        }
    }
    if(cmd.customId?.startsWith("clearTimer-")){
        if((cmd.member?.permissions?.has(PermissionFlagsBits.ManageMessages)&&cmd.message.id===storage[cmd.user.id].timer?.respLocation.split("/")[1])||cmd.user.id===cmd.customId.split("-")[1]){
            delete storage[cmd.user.id].timer;
            cmd.message.edit({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Clear Timer").setStyle(ButtonStyle.Danger).setDisabled(true).setCustomId("disabled"))]});
            cmd.reply({content:`I have cleared the timer.`,ephemeral:true});
        }
        else{
            cmd.reply({content:`That is not your timer to clear.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("finishTempRole-")){
        if(cmd.member.permissions.has(PermissionFlagsBits.ManageRoles)){
            cmd.deferUpdate();
            finTempRole(cmd.guild.id,cmd.customId.split("-")[1],cmd.customId.split("-")[2],true);
            cmd.message.edit({components:[]});
        }
        else{
            cmd.reply({content:`You do not have sufficient permissions.`,ephemeral:true});
        }
    }
    if(cmd.customId?.startsWith("wotd-")){
        if(cmd.user.id!==cmd.customId.split("-")[1]){
            cmd.reply({content:`This is not your game.`,ephemeral:true});
        }
        else{
            cmd.showModal(presets.wotdModal);
        }
    }
    if(cmd.customId?.startsWith("unban-")){
        if(!cmd.memberPermissions.has(PermissionFlagsBits.BanMembers)){
            cmd.reply({content:`You do not have permission to use this button.`,ephemeral:true});
        }
        else{
            cmd.update({components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel("Unban Now").setCustomId(`unban`).setDisabled(true))]});
            finTempBan(cmd.guild.id,cmd.customId.split("-")[1],true);
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

    //TODO: Check if any servers didn't get converted to emojiboard in the storage.json, and if there are any stragglers convert the format and remove the following if statement and its contents
    if(react.message.channel.id!==storage[react.message.guildId]?.starboard.channel&&(storage[react.message.guildId]?.starboard.emoji===react._emoji.name||storage[react.message.guildId]?.starboard.emoji===react._emoji.id)&&storage[react.message.guildId]?.starboard.active&&storage[react.message.guildId]?.starboard.channel&&!storage[react.message.guildId]?.starboard.posted.hasOwnProperty(react.message.id)){
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
            if(emoji.isMute) return;
            if(emoji.posted.hasOwnProperty(msg.id)){
                try {
                    if(emoji.posted[msg.id].startsWith("webhook")&&emoji.channel?.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
                        var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id].split("webhook")[1]);
                        c.delete();
                    }
                    else if(!emoji.posted[msg.id].startsWith("webhook")){
                        var c=await client.channels.cache.get(emoji.channel).messages.fetch(emoji.posted[msg.id]);
                        c.edit({content:`I'm sorry, but it looks like this post by **${msg.author?.globalName||msg.author?.username}** was deleted.`,embeds:[],files:[]});
                    }
                } catch(e) {
                    // Cache issues, nothing we can do
                    betaLog(e);
                }
            }
        });
    }

    // Resend if the latest counting number was deleted
    if(storage[msg.guild.id]?.counting.active&&storage[msg.guild.id]?.counting.channel===msg.channel.id){
        // var num=msg.content?.match(/^(\d|,)+(?:\b)/i);
        var num = msg.content ? processForNumber(msg.content) : null;
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
    if(msg.guild?.id===undefined||client.user.id===msg.author?.id) return;//Currently there's no use for messageUpdate in DMs, only in servers. If this ever changes, remove the guildId check and add more further down
    if(!storage.hasOwnProperty(msg.author.id)){
        storage[msg.author.id]=structuredClone(defaultUser);   
    }
    if(!storage.hasOwnProperty(msg.guildId)){
        storage[msg.guildId]=structuredClone(defaultGuild);
    }
    if(!storage[msg.guildId].users.hasOwnProperty(msg.author.id)){
        storage[msg.guildId].users[msg.author.id]=structuredClone(defaultGuildUser);
    }
    if(storage[msg.guild.id]?.filter.active){
        let [filtered, filteredContent, foundWords] = checkDirty(msg.guildId, msg.content, true)

        if(filtered){
            storage[msg.guild.id].users[msg.author.id].infractions++;
            if(storage[msg.guildId].filter.censor){
                msg.channel.send({content:`A post by <@${msg.author.id}> sent at <t:${Math.round(msg.createdTimestamp/1000)}:f> <t:${Math.round(msg.createdTimestamp/1000)}:R> has been deleted due to retroactively editing a blocked word into the message.`,allowedMentions:{parse:[]}});
            }
            msg.delete();
            if(storage[msg.author.id].config.dmOffenses&&!msg.author.bot){
                msg.author.send(limitLength(`Your message in **${msg.guild.name}** was deleted due to editing in the following word${foundWords.length>1?"s":""} that are in the filter: ||${foundWords.join("||, ||")}||${storage[msg.author.id].config.returnFiltered?"```\n"+msg.content.replaceAll("`","\\`")+"```":""}`)).catch(e=>{});
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
            if(emoji.isMute) return;
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
                    if (role && role.id !== member.guild.id) {
                        if(myRole>role.rawPosition){
                            member.roles.add(role);
                            addedStickyRoles++;
                        }
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
                if(role!==undefined&&role!==null){
                    if(myRole>role.rawPosition){
                        member.roles.add(role);
                    }
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

    sendWelcome(guild);
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
