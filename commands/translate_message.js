// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const translate = require("@vitalets/google-translate-api").translate; // Import requires, even though it's greyed out

module.exports = {
	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("translate_message").setType(ApplicationCommandType.Message),
		
		// Optional fields
		
		extra: {
			"contexts":[0,1,2],"integration_types":[0,1],
			"desc":"Attempt to autodetect the language of a message and translate it"
		},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Information, Categories.Context_Menu],
			shortDesc: "Attempt to autodetect the language of the message and translate it",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Tries to autodetect the language of a message, and translate it into English. This is a context menu command, accessed by holding down on a message on mobile or right clicking on desktop, and pressing "Apps".`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		translate(cmd.targetMessage.content,{
			to:cmd.locale.slice(0,2)
		}).then(t=>{
			t.text=checkDirty(config.homeServer,t.text,true)[1];
			if(cmd.guildId&&storage[cmd.guildId]?.filter.active) t.text=checkDirty(cmd.guildId,t.text,true)[1];
			cmd.followUp(`Attempted to translate${t.text!==cmd.targetMessage.content?`:\n\`\`\`\n${escapeBackticks(t.text)}\n\`\`\`\n-# If this is incorrect, try using ${cmds.translate.mention}.`:`, but I was unable to. Try using ${cmds.translate.mention}.`}`);
		});
	}
};
