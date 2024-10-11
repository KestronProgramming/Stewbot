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
				option.setName("length").setDescription("Amount of time to timeout the user for?").addChoices(
					{name:"1 min",value:60000},
					{name:"5 min",value:60000*5},
					{name:"10 min",value:600000},
					{name:"1 hour",value:60000*60},
					{name:"1 day",value:60000*60*24},
					{name:"1 week",value:60000*60*24*7}
				).setRequired(true)
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
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ModerateMembers)){
			cmd.followUp(`I cannot timeout right now as I'm missing the ModerateMembers permission.`);
			return;
		}
		if(cmd.options.getUser("target").bot){
			cmd.followUp(`I cannot timeout bots. ${cmd.options.getUser("target").id===client.user.id?`I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement. You can try reconfiguring me as well.`:`Try reconfiguring the bot, or removing it if necessary.`}`);
			return;
		}
		if(cmd.user.id===cmd.options.getUser("target").id){
			cmd.followUp(`I cannot timeout you as the one invoking the command. If you feel the need to timeout yourself, consider changing your actions and mindset instead.`);
			return;
		}
		cmd.guild.members.cache.get(cmd.options.getUser("target").id).timeout(cmd.options.getInteger("length"),`Instructed to timeout by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
		cmd.followUp({content:`I have attempted to timeout <@${cmd.options.getUser("target").id}>`,allowedMentions:{parse:[]}});
	}
};
