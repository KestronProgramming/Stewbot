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
			"helpCategory":"Administration",
			"helpDesc":"Moderate a user"
		},
	},

	async execute(cmd, context) {
		applyContext(context);

		const targetMember = cmd.guild.members.cache.get(cmd.options.getUser("target").id);
		const issuerMember = cmd.guild.members.cache.get(cmd.user.id);
		const reason = cmd.options.getString("reason");	

		if (targetMember.id === cmd.guild.ownerId) {
			return cmd.followUp({
				content: "I cannot kick the owner of this server.",
				ephemeral: true
			});
		}

		if (issuerMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
			return cmd.followUp({
				content: "You cannot kick this user because they have a role equal to or higher than yours.",
				ephemeral: true
			});
		}
		
		targetMember.kick(`Instructed to kick by ${cmd.user.username}${reason ? ": "+reason : "."}`);
		cmd.followUp({content:`I have attempted to kick <@${targetMember.id}>`,allowedMentions:{parse:[]}});
	}
};
