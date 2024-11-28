// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

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

		requiredGlobals: ["getPrimedEmbed"],

		help: {
            "helpCategory":"Informational",
            "helpDesc":"Embed Discord message links with a command, useful for DMs with anyone if you install the bot to your account"
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

    // Suggust PRIMED so mobile users don't have to type it out
    async autocomplete(cmd) {
        cmd.respond([{
            name: "PRIMED",
            value: "PRIMED"
        }]);
    }
};
