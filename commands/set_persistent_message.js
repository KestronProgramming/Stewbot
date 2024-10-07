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
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.guild.id].hasOwnProperty("persistence")){
            storage[cmd.guild.id].persistence={};
        }
        if(!storage[cmd.guild.id].persistence.hasOwnProperty(cmd.channel.id)){
            storage[cmd.guild.id].persistence[cmd.channel.id]={
                "active":false,
                "content":"Jerry",
                "lastPost":null
            };
        }
        storage[cmd.guild.id].persistence[cmd.channel.id].active=cmd.options.getBoolean("active");
        if(cmd.options.getString("content")!==null) storage[cmd.guild.id].persistence[cmd.channel.id].content=cmd.options.getString("content");
        if(cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)){
            cmd.followUp(`I have set your settings for this channel's persistent messages.`);

            var resp={
                "content":checkDirty(config.homeServer,storage[cmd.guild.id].persistence[cmd.channel.id].content,true)[1],
                "avatarURL":cmd.guild.iconURL(),
                "username":cmd.guild.name
            };
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
        else{
            cmd.followUp(`I need to be able to delete messages as well as manage webhooks for this channel. Without these permissions I cannot manage persistent messages here.`);
            storage[cmd.guild.id].persistence[cmd.channel.id].active=false;
        }
	}
};
