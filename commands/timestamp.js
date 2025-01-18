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

		deferEphemeral: true,

		help: {
			helpCategories: ["General","Information","Entertainment"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "Generate a timestamp for use in your message",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Generates a timestamp string. Pasting the output will automatically correct the time set to show the correct time for any user regardless of timezone.\n
				For example, if there was a timestamp for 4 EST, a user in PST would see 1.`
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
