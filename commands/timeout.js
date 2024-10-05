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
		command: new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user")
			.addUserOption(option=>
				option.setName("target").setDescription("Who to timeout?").setRequired(true)
			).addIntegerOption(option=>
				option.setName("hours").setDescription("Hours to timeout the user for?")
			).addIntegerOption(option=>
				option.setName("minutes").setDescription("Minutes to timeout the user for?")
			).addIntegerOption(option=>
				option.setName("seconds").setDescription("Seconds to timeout the user for?")
			).addStringOption(option=>
				option.setName("reason").setDescription("What is the reason for this timeout?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
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
		
		if(cmd.options.getUser("target").id===client.id){
			cmd.followUp(`I cannot timeout myself. I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement.`);
			return;
		}
		if(cmd.user.id===cmd.options.getUser("target").id){
			cmd.followUp(`I cannot timeout you as the one invoking the command. If you feel the need to timeout yourself, consider changing your actions and mindset instead.`);
			return;
		}
		var time=(cmd.options.getInteger("hours")*60000*60)+(cmd.options.getInteger("minutes")*60000)+(cmd.options.getInteger("seconds")*1000);
		cmd.guild.members.cache.get(cmd.options.getUser("target").id).timeout(time>0?time:60000,`Instructed to timeout by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
		cmd.followUp({content:`I have attempted to timeout <@${cmd.options.getUser("target").id}>`,allowedMentions:{parse:[]}});
	}
};
