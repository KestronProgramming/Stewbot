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
		command: new SlashCommandBuilder().setName("next_counting_number").setDescription("View the next number to count at").addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategory: "Informational",
			helpDesc: "If counting is active, the next number to post to keep it going",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp(storage[cmd.guildId].counting.active?`The next number to enter ${cmd.channel.id!==storage[cmd.guildId].counting.channel?`in <#${storage[cmd.guildId].counting.channel}> `:""}is \`${storage[cmd.guildId].counting.nextNum}\`.`:`Counting isn't active in this server! Use ${cmds.filter.config.mention} to set it up.`);
	}
};
