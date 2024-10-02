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
		command: new SlashCommandBuilder().setName("delete").setDescription("Delete messages")
			.addIntegerOption(option=>
				option.setName("amount").setDescription("The amount of the most recent messages to delete").setMinValue(1).setMaxValue(100).setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],
	},

	async execute(cmd, context) {
		applyContext(context);
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
			cmd.followUp(`I do not have the necessary permissions to execute this command.`);
			return;
		}
		cmd.channel.bulkDelete(cmd.options.getInteger("amount")+1);
	}
};
