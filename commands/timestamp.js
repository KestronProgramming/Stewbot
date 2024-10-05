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
		command: new SlashCommandBuilder().setName("timestamp").setDescription("Generate a timestamp for use in your message"),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["presets"],

		help: {
			"helpCategory": "Informational",
			"helpDesc": "Generate a timestamp that will show everyone the same time relevant to their timezone"
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(storage[cmd.user.id].config.hasSetTZ){
			cmd.followUp({content:`<t:${Math.round((new Date().setSeconds(0))/1000)}:t>`,components:presets.timestamp});
		}
		else{
			cmd.followUp(`This command needs you to set your timezone first! Run ${cmds.personal_config.mention} and specify \`configure_timezone\` to get started,`);
		}
	}
};
