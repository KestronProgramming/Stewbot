// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const { getPrimedEmbed } = require("./prime_embed.js")

const kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(cs|computer-programming|hour-of-code|python-program)\/[a-z,\d,-]+\/\d+(?!>)\b/gi;
const discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d+)\/\d+\/\d+(?!>)\b/gi;

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("embed_message").setDescription("Embed a message link from another channel or server")
            .addStringOption(option=>
                option.setName("link").setDescription("The message link, or PRIMED if you used the /prime_embed context menu command").setRequired(true)
                .setAutocomplete(true) // Autocomplete suggests a static `PRIMED` which is nice for mobile users
            ),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: ["General","Information","Entertainment"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Embed a message link from another channel or server",
			detailedDesc: 
				`This command allows you to enter a message link from any channel or server you are in and have Stewbot to display it. If Stewbot does not share the server with you, you can still embed it by installing Stewbot to use everywhere (click his PFP and then "Add App" to do so) and then using the "prime_embed" context menu command (right click on desktop, hold down on mobile, then press Apps) on the message you'd like to embed, and then using this command and entering "PRIMED".`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(cmd.options.getString("link").toLowerCase()==="primed"&&storage[cmd.user.id].hasOwnProperty("primedEmbed")){
            var primer=getPrimedEmbed(cmd.user.id,cmd.guild?.id);
            cmd.followUp({"content":`-# Embedded primed message. Use the context menu command \`/prime_embed\` and type \`PRIMED\` into ${cmds.embed_message.mention} to do the same.`,embeds:[primer],files:primer.title==="Blocked"?[]:storage[cmd.user.id].primedEmbed.attachmentURLs});
        }
        else{
            try{
                let slashes=cmd.options.getString("link").split("channels/")[1].split("/");
                let embs=[];
                try{
                    var channelLinked=await client.channels.cache.get(slashes[slashes.length-2]);
                    var mes=await channelLinked.messages.fetch(slashes[slashes.length-1]);
                    if(checkDirty(cmd.guild?.id,mes.content) || checkDirty(cmd.guild?.id,mes.author.nickname||mes.author.globalName||mes.author.username) || checkDirty(cmd.guild?.id,mes.guild.name) || checkDirty(cmd.guild?.id,mes.channel.name)||checkDirty(config.homeServer,mes.content) || checkDirty(config.homeServer,mes.author.nickname||mes.author.globalName||mes.author.username) || checkDirty(config.homeServer,mes.guild.name) || checkDirty(config.homeServer,mes.channel.name)){
                        cmd.followUp(`I'm sorry, I am unable to embed that message due to its content.`);
                        return;
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
                    cmd.followUp({content:embs.length>0?`-# Embedded linked message`:`Failed to embed message. Try opening the context menu (holding down on mobile, right clicking on desktop) and pressing Apps -> prime_embed, then use ${cmds.embed_message.mention} and type **PRIMED** into it. If I'm not in the server you want to embed a message from, you can use me anywhere by pressing my profile, then Add App, then Use it Everywhere.`,embeds:embs});
                }
                catch(e){
                    console.log(e);
                    cmd.followUp(`I'm sorry, I can't access that message.`);
                }
            }
            catch(e){
                cmd.followUp(`I didn't get that. Are you sure this is a valid message link? You can get one by accessing the context menu on a message, and pressing \`Copy Message Link\`.`);
            }
        }
        
	},

    // Watch for discord message embeds
    async onmessage(msg, context) {
		applyContext(context);
        
        // Discord message embeds
        var links=msg.content.match(discordMessageRegex)||[];
        var progs=msg.content.match(kaProgramRegex)||[];
        if(!storage[msg.author.id].config.embedPreviews||!storage[msg.guildId]?.config.embedPreviews||!msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)||!msg.channel.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.EmbedLinks)){
            // If the embed shouldn't be posted, force set it to nothing
            links=[];
            progs=[];
        }
        var embs=[];
        var fils=[];
        for(var i=0;i<links.length;i++){
            let linkIDs=links[i].split("channels/")[1].split("/");
            try{
                var channelLinked=await client.channels.fetch(linkIDs[linkIDs.length-2]);
                var mes=await channelLinked.messages.fetch(linkIDs[linkIDs.length-1]);
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
                await channelLinked.guild.members.fetch(msg.author.id);
                if(channelLinked.permissionsFor(msg.author.id)?.has(PermissionFlagsBits.ViewChannel)){
                    embs.push(messEmbed);
                }
            }
            catch(e){
                notify(`Error embeding message:\n${e.stack}`)
            }
        }
        var progsDeleted = false;
        if(embs.length>0){
            msg.reply({content:`-# Embedded linked message${embs.length>1?"s":""}. You can prevent this behavior by surrounding message links in \`<\` and \`>\`.`,embeds:embs,files:fils,allowedMentions:{parse:[]}});
        }

        // Khan Academy program embeds
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


    },

    // Suggest PRIMED so mobile users don't have to type it out
    async autocomplete(cmd) {
        cmd.respond([{
            name: "PRIMED",
            value: "PRIMED"
        }]);
    }
};
