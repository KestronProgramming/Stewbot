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
		command: new SlashCommandBuilder().setName("view_filter").setDescription("View the list of blacklisted words for this server").setDMPermission(false).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		extra: {"contexts":[0],"integration_types":[0]},
		
		// Optional fields
		requiredGlobals: [],

		help: {
			helpCategory: "Informational",
			helpDesc: "Defines a word",
			helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(storage[cmd.guildId].filter.blacklist.length>0&&storage[cmd.guildId].filter.active){
			cmd.followUp({"content":`## ⚠️ Warning\nWhat follows _may_ be considered dirty, or offensive, as these are words that **${cmd.guild.name}** has decided to not allow.\n-# If you would like to continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
		}
		else{
			cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds.filter.add.mention}.`);
		}
    }
};
