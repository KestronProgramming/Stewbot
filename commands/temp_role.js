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
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
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

        const role = cmd.options.getRole("role");
        const user = cmd.options.getUser("who");
        const targetMember = cmd.guild.members.cache.get(user.id);
		const issuerMember = cmd.guild.members.cache.get(cmd.user.id);

        if(targetMember===null||targetMember===undefined){
            cmd.followUp({content:`I couldn't find <@${user.id}>, so I can't help unfortunately.`,allowedMentions:{parse:[]}});
            return;
        }

        // Maybe we should check to see if this user has power over the target, and that they have power over the role?
        if (role.comparePositionTo(issuerMember.roles.highest) >= 0) {
            return cmd.followUp(`You cannot add this role because it is equal to or higher than your highest role.`);
        }

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
        if(cmd.guild.members.cache.get(client.user.id).roles.highest.position<=role.rawPosition){
            cmd.followUp(`I cannot help with that role. If you would like me to, grant me a role that is ordered to be higher in the roles list than ${role.name}. You can reorder roles from Server Settings -> Roles.`);
            return;
        }
        if(!storage[cmd.guild.id].users[cmd.user.id].hasOwnProperty("tempRoles")){
            storage[cmd.guild.id].users[cmd.user.id].tempRoles={};
        }
        if(storage[cmd.guild.id].users[cmd.user.id].tempRoles.hasOwnProperty(role.id)){
            cmd.followUp({content:`This is already a temporarily assigned role for this user. You can cancel it, or wait it out.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${user.id}-${role.id}`).setStyle(ButtonStyle.Secondary))]});
            return;
        }
        var added;
        if(targetMember.roles.cache.has(role.id)){
            added=false;
            targetMember.roles.remove(role.id).catch(e=>{});
        }
        else{
            added=true;
            targetMember.roles.add(role.id).catch(e=>{});
        }
        storage[cmd.guild.id].users[cmd.user.id].tempRoles[role.id]=Date.now()+timer;
        cmd.followUp({content:`Alright, I have ${added?`added`:`removed`} <@&${role.id}> ${added?`to`:`from`} <@${targetMember.id}> until <t:${Math.round((Date.now()+timer)/1000)}:f> <t:${Math.round((Date.now()+timer)/1000)}:R>`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${user.id}-${role.id}`).setStyle(ButtonStyle.Secondary))]});
        
        setTimeout(()=>{finTempRole(cmd.guild.id,cmd.user.id,role.id)},timer);
    }
};
