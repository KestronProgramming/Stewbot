// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const fs = require("node:fs")
const Turndown = require('turndown');
var turndown = new Turndown();

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("daily-config").setDescription("Configure daily postings")
            .addStringOption(option=>
                option.setName("type").setDescription("What kind of daily post are you configuring?").addChoices(
                    {"name":"Devotionals","value":"devos"},
                    {"name":"Memes","value":"memes"},
                    {"name":"Verse of the Day","value":"verses"}
                ).setRequired(true)
            ).addBooleanOption(option=>
                option.setName("active").setDescription("Should I run this daily type?").setRequired(true)
            ).addChannelOption(option=>
                option.setName("channel").setDescription("The channel for me to post this daily type in").addChannelTypes(ChannelType.GuildText).setRequired(true)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["Information","Entertainment","Administration","Configuration","Server Only"],
			shortDesc: "Configure daily postings",
			detailedDesc: 
				`Configure daily devotions, a daily verse of the day, and/or a daily meme to be posted to any channel you'd like every day at noon UTC.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
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
        storage[cmd.guildId].daily[cmd.options.getString("type")].active=cmd.options.getBoolean("active");
        storage[cmd.guildId].daily[cmd.options.getString("type")].channel=cmd.options.getChannel("channel").id;
        if(!cmd.options.getChannel("channel").permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            cmd.followUp(`I can't send messages in that channel, so I can't run daily ${cmd.options.getString("type")}.`);
            return;
        }
        cmd.followUp(`${storage[cmd.guildId].daily[cmd.options.getString("type")].active?"A":"Dea"}ctivated daily \`${cmd.options.getString("type")}\` for this server in <#${storage[cmd.guildId].daily[cmd.options.getString("type")].channel}>.`);
	},

    async daily(context) {
		applyContext(context);

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
            notify("Devo daily: " + e.stack);
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
            notify("Verse Of The Day error: " + e.stack);
        });

        // Send the daily meme to each server
        if(storage.dailyMeme===undefined||storage.dailyMeme===null) storage.dailyMeme=-1;
        storage.dailyMeme++;
        if(storage.dailyMeme >= fs.readdirSync("./memes").length) storage.dailyMeme=0;
        Object.keys(storage).forEach(s => {
            try {
                if(storage[s]?.daily?.memes?.active){
                    var c=client.channels.cache.get(storage[s].daily.memes.channel);
                    if(c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        c.send({
                            content: `## Daily Meme\n-# Meme \\#${storage.dailyMeme}`,
                            files: [
                                `./memes/${storage.dailyMeme}.${
                                    fs.readdirSync("./memes")
                                        .filter((a) =>
                                            a.split(".")[0] ===
                                            `${storage.dailyMeme}`
                                        )[0]
                                        .split(".")[1]
                                }`,
                            ],
                        });
                    }
                    else{
                        storage[s].daily.memes.active=false;
                    }
                }
            } catch (e) {
                notify("Daily meme error: " + e.stack);
            }
        })
    }
};
