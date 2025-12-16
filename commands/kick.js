// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("kick").setDescription("Kick a user")
			.addUserOption(option=>
				option.setName("target").setDescription("Who to kick?").setRequired(true)
			).addStringOption(option=>
				option.setName("reason").setDescription("What is the reason for this kick?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Administration, Categories.Server_Only],
			shortDesc: "Kick a user",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Removes the specified user from the server, the user will be able to rejoin if they find a new invite.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		if (!cmd.guild) {
			cmd.followUp("This command must be used in a server.");
			return;
		}
		if (!cmd.guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
			cmd.followUp("I need the `Kick Members` permission to do that.");
			return;
		}

		const targetUser = cmd.options.getUser("target");
		const targetMember = targetUser ? cmd.guild.members.cache.get(targetUser.id) : null;
		const issuerMember = cmd.guild.members.cache.get(cmd.user.id);
		const reason = cmd.options.getString("reason");	

		if (!targetMember) {
			cmd.followUp("I couldn't find that member.");
			return;
		}
		if (!issuerMember) {
			cmd.followUp("I couldn't verify your server membership.");
			return;
		}

		if (targetMember.id === cmd.guild.ownerId) {
			return cmd.followUp("I cannot kick the owner of this server.");
		}

		if(targetMember.id===client.user.id){
			// @ts-ignore
			return cmd.followUp(`I cannot kick myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement.`);
		}

		if(cmd.user.id===targetMember.id){
			return cmd.followUp(`I cannot ban you as the one invoking the command. If you feel the need to ban yourself, consider changing your actions and mindset instead.`);
		}

		if (issuerMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
			return cmd.followUp("You cannot kick this user because they have a role equal to or higher than yours.");
		}
		
		if (!targetMember.kickable) {
			cmd.followUp("I cannot kick that user due to role hierarchy or permissions.");
			return;
		}

		targetMember.kick(`Instructed to kick by ${cmd.user.username}${reason ? ": "+reason : "."}`).catch(() => null);
		cmd.followUp({content:`I have attempted to kick <@${targetMember.id}>`,allowedMentions:{parse:[]}});
	}
};
