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
		command: new SlashCommandBuilder().setName("ban").setDescription("Ban a user")
			.addUserOption(option=>
				option.setName("target").setDescription("Who to ban?").setRequired(true)
			).addStringOption(option=>
				option.setName("reason").setDescription("What is the reason for this ban?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["cmds"],

		help: {
			"helpCategory":"Administration",
			"helpDesc":"Moderate a user"
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(cmd.options.getUser("target").id===client.user.id){
			cmd.followUp(`I cannot ban myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement.`);
			return;
		}
		if(cmd.user.id===cmd.options.getUser("target").id){
			cmd.followUp(`I cannot ban you as the one invoking the command. If you feel the need to ban yourself, consider changing your actions and mindset instead.`);
			return;
		}
		var b=cmd.guild.members.cache.get(cmd.options.getUser("target").id);
		if(b.bannable){
			b.ban({reason:`Instructed to ban by ${cmd.user.username}: ${cmd.options.getString("reason")}`});
			cmd.followUp(`I have banned <@${cmd.options.getUser("target").id}>`);
			return;
		}
		else{
			cmd.followUp(`I cannot ban this person. Make sure that I have a role higher than their highest role in the server settings before running this command.`);
			return;
		}
	}
};
