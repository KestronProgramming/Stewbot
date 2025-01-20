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
		command: new SlashCommandBuilder().setName("auto_roles").setDescription("Setup a message with auto roles").addStringOption(option=>
				option.setName("message").setDescription("The message to be sent with the role options").setRequired(true)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["presets"],

		deferEphemeral: true,

		help: {
			helpCategories: ["General","Administration","Configuration","Server Only"],
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
			shortDesc: "Setup a message with auto roles",
			detailedDesc: 
				`In the channel this command is used in, Stewbot will post a configurable message with buttons to add and remove the selected roles from themselves. Start by using the command with the message, and then Stewbot will prompt for the roles.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto roles.`);
			return;
		}
		cmd.followUp({"content":`${checkDirty(config.homeServer,cmd.options.getString("message"),true)[1]}`,"ephemeral":true,"components":[presets.rolesCreation]});
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["role-addOption", /autoRole-.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId == "role-addOption") {
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
	}
};
