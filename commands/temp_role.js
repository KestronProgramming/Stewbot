// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, guildUserByObj, guildUserByID, GuildUsers } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const ms = require("ms")

async function finTempRole(guildId, userId, roleId) {
    const guild = await client.guilds.fetch(guildId);
    if (guild === null || guild === undefined) return;

    const guildUser = await guildUserByObj(guild, userId);
    if(!guildUser?.tempRoles?.has(roleId)){
        return;
    }
    const user = await guild.members.fetch(userId);
    const role = await guild.roles.fetch(roleId);
    if (role === null || role === undefined || user === null || user === undefined) return;
    
    if (user.roles.cache.has(role.id)) {
        user.roles.remove(role).catch(e => { });
    }
    else{
        user.roles.add(role).catch(e=>{});
    }

    guildUser.tempRoles.delete(roleId);
    guildUser.save();
}

async function scheduleTodaysTemproles() {
    // TODO_DB: index this
    const tempRoleUsers = await GuildUsers.find(
        { tempRoles: { $exists: 1, $ne: {} } }
    )    
        .select("tempRoles guildId userId")
        .lean()
    
    tempRoleUsers.forEach(user => {
        const { guildId, userId, tempRoles } = user;

        Object.entries(tempRoles).forEach(([roleId, roleEnd]) => {
            setTimeout(() => {
                finTempRole(guildId, userId, roleId);
            }, roleEnd - Date.now());
        });
    })
}

module.exports = {
    finTempRole,
    scheduleTodaysTemproles,
    
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

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Administration, Categories.Server_Only],
			shortDesc: "Temporarily add or remove a role from someone",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Specify a role to add or remove temporarily from a specified user, and how long you want it to be added or removed for. At the end of the timer, the role changes will be automatically reverted.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        const role = cmd.options.getRole("role");
        const selectUser = cmd.options.getUser("who");
        const targetMember = await cmd.guild.members.fetch(selectUser.id);
		const issuerMember = await cmd.guild.members.fetch(cmd.user.id);

        if(targetMember===null||targetMember===undefined){
            cmd.followUp({content:`I couldn't find <@${selectUser.id}>, so I can't help unfortunately.`,allowedMentions:{parse:[]}});
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

        const guildUser = await guildUserByObj(cmd.guild, selectUser.id);
        if(guildUser.tempRoles.has(role.id)){
            cmd.followUp({
                content:`This is already a temporarily assigned role for this user. You can cancel it, or wait it out.`,
                components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${selectUser.id}-${role.id}`).setStyle(ButtonStyle.Secondary))]
            });
            return;
        }
        
        var added;
        if (targetMember.roles.cache.has(role.id)) {
            added=false;
            targetMember.roles.remove(role.id).catch(e=>{});
        }
        else {
            added=true;
            targetMember.roles.add(role.id).catch(e=>{});
        }

        guildUser.tempRoles.set(role.id, Date.now()+timer);
        cmd.followUp({
            content:`Alright, I have ${added?`added`:`removed`} <@&${role.id}> ${added?`to`:`from`} <@${targetMember.id}> until <t:${Math.round((Date.now()+timer)/1000)}:f> <t:${Math.round((Date.now()+timer)/1000)}:R>`,
            components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Finish Early").setCustomId(`finishTempRole-${selectUser.id}-${role.id}`).setStyle(ButtonStyle.Secondary))]
        });
        
        setTimeout(()=>{finTempRole(cmd.guild.id,cmd.user.id,role.id)},timer);

        guildUser.save();
    },

	subscribedButtons: [/finishTempRole-.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

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
	}
};
