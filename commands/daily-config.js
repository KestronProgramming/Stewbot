// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, MessageAttachment , AttachmentBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const fs = require("node:fs")
const Turndown = require('turndown');
var turndown = new Turndown();

async function sendDailiesToSubscribed(type, message={}) {
    const dailySubbedGuilds = await Guilds.find({ 
        [`daily.${type}.active`]: true 
    }).lean();

    const erroredGuilds = [];

    for (const guild of dailySubbedGuilds) {
        const subbedChannel = guild.daily[type].channel;
        try {
            const channel = await client.channels.fetch(subbedChannel);
            
            if (channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
                await channel.send(message);
            } else {
                erroredGuilds.push(guild.id);
            }
        } catch (err) {
            // Let's not just delete all errors
            // Report the error, if need be later we can add specific error types that delete it
            notify(`Error in sending ${type} daily to specific server:\n` + err.stack)

            // erroredGuilds.push(guild.id);
        }
    }

    // Disable on guilds without perms
    if (erroredGuilds.length > 0) {
        await Guilds.updateMany(
            { id: { $in: erroredGuilds } }, 
            { $set: {
                [`daily.${type}.active`]: false 
            } }
        );
    }
}

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
			helpCategories: [Categories.Information, Categories.Entertainment, Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Configure daily postings",
			detailedDesc: 
				`Configure daily devotions, a daily verse of the day, and/or a daily meme to be posted to any channel you'd like every day at noon UTC.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        const updates = {};

        const type = cmd.options.getString("type");
        const channel = cmd.options.getChannel("channel");

        // Push changes
        updates[`daily.${type}.active`] = cmd.options.getBoolean("active");
        updates[`daily.${type}.channel`] = channel.id;

        await guildByObj(cmd.guild, updates);
        
        if(!channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
            cmd.followUp(`I can't send messages in that channel, so I can't run daily ${type}.`);
            return;
        }

        cmd.followUp(
            `${updates[`daily.${type}.active`]
                ? "A"
                :"Dea"
            }ctivated daily \`${type}\` for this server in <#${channel.id}>.`
        );
	},

    async daily(context) {
		applyContext(context);

        // Daily devo
        var dailyDevo=[];
        try {
            const req = await fetch("https://www.biblegateway.com/devotionals/niv-365-devotional/today")
            const d = await req.text();

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

            await sendDailiesToSubscribed("devos", {embeds: dailyDevo});

        } catch (e) {
            notify("Devo daily: " + e.stack);
        }
        
        // Verse of the day
        try {
            const req = await fetch("https://www.bible.com/verse-of-the-day")
            const d = await req.text();
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
    
            await sendDailiesToSubscribed("verses", {embeds: [votd]});
    
        } catch {
            notify("Verse Of The Day error: " + e.stack);
        };

        // Send the daily meme to each server
        try {
            const botSettings = await ConfigDB.findOneAndUpdate(
                {}, 
                { $inc: { dailyMeme: 1 } }, 
                { new: true }
            ).select("dailyMeme").lean();
            const memes = await fs.promises.readdir("./memes");
            const selectedMemeName = memes[botSettings.dailyMeme % memes.length];

            console.log(botSettings.dailyMeme)
                
            // Read the selected meme file into a buffer
            const selectedMemeBuffer = await fs.promises.readFile(`./memes/${selectedMemeName}`);

            // Create an attachment from the buffer
            const attachment = new AttachmentBuilder(selectedMemeBuffer, { 
                name: selectedMemeName,
                description: "Today's daily meme."
            });

            await sendDailiesToSubscribed("memes", {
                content: `## Daily Meme\n-# Meme \\#${botSettings.dailyMeme}`,
                files: [ attachment ],
            });
        } catch (e) {
            notify("Meme Of The Day error: " + e.stack);
        };
    }
};
