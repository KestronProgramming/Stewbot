// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

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
			helpCategories: [Categories.Information, Categories.Entertainment, Categories.Server_Only],
			shortDesc: "View the next number to count at",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`For the server counting game, if active, see the number that needs to be entered next, and if anybody is unable to take the next turn.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({content:limitLength(storage[cmd.guildId].counting.active?`The next number to enter ${cmd.channel.id!==storage[cmd.guildId].counting.channel?`in <#${storage[cmd.guildId].counting.channel}> `:""}is \`${storage[cmd.guildId].counting.nextNum}\`.${storage[cmd.guildId].counting.takeTurns>0&&Object.keys(storage[cmd.guildId].users).filter(a=>storage[cmd.guildId].users[a].countTurns>0).length>0?`\nYou need to wait for ${storage[cmd.guildId].counting.takeTurns} other ${storage[cmd.guildId].counting.takeTurns===1?`person`:`people`} to post before taking another turn in this server. The following users have posted within this danger zone:\n${Object.keys(storage[cmd.guildId].users).filter(a=>storage[cmd.guildId].users[a].countTurns>0).map(b=>`- <@${b}>`).join("\n")}`:``}`:`Counting isn't active in this server! Use ${cmds.counting.config.mention} to set it up.`),allowedMentions:{parse:[]}});
	}
};
