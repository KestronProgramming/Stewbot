// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("set_persistent_message").setDescription("Set a message that will ALWAYS be visible as the latest message posted in this channel")
            .addBooleanOption(option=>
                option.setName("active").setDescription("Should the persistent message be actively run in this channel?").setRequired(true)
            ).addStringOption(option=>
                option.setName("content").setDescription("The message to have persist").setMinLength(1)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

        help:{
            helpCategories: [Categories.General, Categories.Information, Categories.Configuration, Categories.Administration, Categories.Server_Only],
			shortDesc: "Set a message that will ALWAYS be visible as the latest message posted in this channel",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure a persistent message that will, in the server's name, always be persistently posted on the bottom of this channel.`
        }
	},

	async execute(cmd, context) {
		applyContext(context);

        // If we're changing settings, clear the old message since we'll send a new one
        if (storage[cmd.guild.id]?.persistence?.[cmd.channel.id]?.lastPost) {
            try {
                var lastPersistent = await cmd.channel.messages.fetch(storage[cmd.guild.id].persistence[cmd.channel.id].lastPost);
                if (lastPersistent) await lastPersistent.delete();
            } catch {}
        }
        
        // Initialize data
        if(!storage[cmd.guild.id].hasOwnProperty("persistence")){
            storage[cmd.guild.id].persistence={};
        }
        if(!storage[cmd.guild.id].persistence.hasOwnProperty(cmd.channel.id)){
            storage[cmd.guild.id].persistence[cmd.channel.id]={
                "active":   false,
                "content":  "<Persistent Message Placeholder>",
                "lastPost": null
            };
        }

        storage[cmd.guild.id].persistence[cmd.channel.id].active=cmd.options.getBoolean("active");

        if(cmd.options.getString("content")!==null) storage[cmd.guild.id].persistence[cmd.channel.id].content=cmd.options.getString("content");
        if(cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)&&cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ReadMessageHistory)&&cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
            cmd.followUp(`I have set your settings for this channel's persistent messages.`);

            var resp={
                "content":checkDirty(config.homeServer,storage[cmd.guild.id].persistence[cmd.channel.id].content,true)[1],
                "avatarURL":cmd.guild.iconURL(),
                "username":cmd.guild.name
            };

            // If they just set it to active, send the message
            if (storage[cmd.guild.id].persistence[cmd.channel.id].active) {
                // Discord server name edge case
                if (resp?.username?.toLowerCase().includes("discord")) {
                    resp.username = "[SERVER]"
                }
                var hook=await cmd.channel.fetchWebhooks();
                hook=hook.find(h=>h.token);
                if(hook){
                    hook.send(resp).then(d=>{
                        storage[cmd.guild.id].persistence[cmd.channel.id].lastPost=d.id;
                    });
                }
                else{
                    client.channels.cache.get(cmd.channel.id).createWebhook({
                        name: config.name,
                        avatar: config.pfp
                    }).then(d=>{
                        d.send(resp).then(d=>{
                            storage[cmd.guild.id].persistence[cmd.channel.id].lastPost=d.id;
                        });
                    });
                }
            }
        }
        else{
            cmd.followUp(`I need to be able to read message history, delete messages, and manage webhooks to use persistent messages. Without these permissions I cannot manage persistent messages here.`);
            storage[cmd.guild.id].persistence[cmd.channel.id].active=false;
        }
	},

    async onmessage(msg, context) {
		applyContext(context);

        // Persistent messages, if the server has them enabled
        if ((!msg.webhookId) && storage[msg.guildId]?.hasOwnProperty("persistence")){
            if(storage[msg.guild.id].persistence?.[msg.channel.id]?.active) {
                if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks) && msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages) && msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ReadMessageHistory)){
                    if(storage[msg.guild.id].persistence[msg.channel.id].lastPost!==null){
                        try{
                            var mes=await msg.channel.messages.fetch(storage[msg.guild.id].persistence[msg.channel.id].lastPost).catch(e=>{});
                            if(mes?.hasOwnProperty("content")) mes.delete().catch(e=>{});
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
                else {
                    if(msg.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
                        msg.channel.send(`I do not have sufficient permissions to manage persistent messages for this channel. Please make sure I can manage webhooks, read message history, and delete messages and then run ${cmds.set_persistent_message.mention}.`);
                    }
                    storage[msg.guild.id].persistence[msg.channel.id].active=false;
                }
            }
        }
    }
};
