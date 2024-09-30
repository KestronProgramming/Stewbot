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
		command: new SlashCommandBuilder().setName("captcha").setDescription("Use this command if I've timed you out for spam"),
		
		// Optional fields
		
		extra: {"contexts":[1],"integration_types":[0,1]},

		requiredGlobals: ["presets"],
	},

	async execute(cmd, context) {
		applyContext(context);
		
		var captcha="";
		for(var ca=0;ca<5;ca++){
			captcha+=Math.floor(Math.random()*10);
		}
		cmd.followUp({content:`Please enter the following: \`${captcha}\`\n\nEntered: \`\``,components:presets.captcha});
	}
};
