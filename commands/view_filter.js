// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: null,

	detailedHelp() {
		return false;
	},

	requestGlobals() {
		return []
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(storage[cmd.guildId].filter.blacklist.length>0&&storage[cmd.guildId].filter.active){
			cmd.followUp({"content":`**Warning!** There is no guarantee what kinds of words may be in the blacklist. There is a chance it could be heavily dirty or offensive. To continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
		}
		else{
			cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds.filter.add.mention}.`);
		}
    }
};
