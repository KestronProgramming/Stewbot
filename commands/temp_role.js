// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate
module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('temp_role').setDescription('Temporarily add or remove a role from someone').addUserOption(option=>
                option.setName("who").setDescription("Who does this apply to?").setRequired(true)
            ).addRoleOption(option=>
                option.setName("role").setDescription("What role am I managing?").setRequired(true)
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes?").setMinValue(1).setMaxValue(59)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ),
		
		extra: {"contexts": [0], "integration_types": [0]},

		requiredGlobals: ["finTempRole"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
        if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageRoles)){
            cmd.followUp(`I do not have the ManageRoles permission, so I cannot run temporary roles.`);
            return;
        }
        var timer=0;
        if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
        if(cmd.options.getInteger("minutes")!==null) timer+=cmd.options.getInteger("minutes")*60000;
        if(timer<1){
            cmd.followUp(`Please set a valid time to undo the role action.`);
            return;
        }
        if(cmd.guild.members.cache.get(client.user.id).roles.highest.position<=cmd.options.getRole("role").rawPosition){
            cmd.followUp(`I cannot help with that role. If you would like me to, grant me a role that is ordered to be higher in the roles list than ${cmd.options.getRole("role").name}. You can reorder roles from Server Settings -> Roles.`);
            return;
        }
        if(!storage[cmd.guild.id].users[cmd.user.id].hasOwnProperty("tempRoles")){
            storage[cmd.guild.id].users[cmd.user.id].tempRoles={};
        }
        if(storage[cmd.guild.id].users[cmd.user.id].tempRoles.hasOwnProperty(cmd.options.getRole("role").id)){
            cmd.followUp({content:`This is already a temporarily assigned role for this user. You can cancel it, or wait it out.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${cmd.options.getUser("who").id}-${cmd.options.getRole("role").id}`).setStyle(ButtonStyle.Secondary))]});
            return;
        }
        var member=cmd.guild.members.cache.get(cmd.options.getUser("who").id);
        if(member===null||member===undefined){
            cmd.followUp({content:`I couldn't find <@${cmd.options.getUser("who").id}>, so I can't help unfortunately.`,allowedMentions:{parse:[]}});
            return;
        }
        var added;
        if(member.roles.cache.has(cmd.options.getRole("role").id)){
            added=false;
            member.roles.remove(cmd.options.getRole("role").id).catch(e=>{});
        }
        else{
            added=true;
            member.roles.add(cmd.options.getRole("role").id).catch(e=>{});
        }
        storage[cmd.guild.id].users[cmd.user.id].tempRoles[cmd.options.getRole("role").id]=Date.now()+timer;
        cmd.followUp({content:`Alright, I have ${added?`added`:`removed`} <@&${cmd.options.getRole("role").id}> ${added?`to`:`from`} <@${member.id}> until <t:${Math.round((Date.now()+timer)/1000)}:f> <t:${Math.round((Date.now()+timer)/1000)}:R>`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${cmd.options.getUser("who").id}-${cmd.options.getRole("role").id}`).setStyle(ButtonStyle.Secondary))]});
        
        setTimeout(()=>{finTempRole(cmd.guild.id,cmd.user.id,cmd.options.getRole("role").id)},timer);
    }
};
