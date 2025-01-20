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
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["timestamp", "howToCopy", "onDesktop", /ts.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		switch(cmd.customId) {
			// Buttons
			case 'howToCopy':
            	cmd.reply({content:`## Desktop\n- Press the \`On Desktop\` button\n- Press the copy icon on the top right of the code block\n- Paste it where you want to use it\n## Mobile\n- Hold down on the message until the context menu appears\n- Press \`Copy Text\`\n- Paste it where you want to use it`,ephemeral:true});
			break;
			case 'onDesktop':
				cmd.reply({content:`\`\`\`\n${cmd.message.content}\`\`\``,ephemeral:true});
			break;
			case 'tsHour':
				cmd.showModal(presets.tsHourModal);
			break;
			case 'tsMinutes':
				cmd.showModal(presets.tsMinutesModal);
			break;
			case 'tsSeconds':
				cmd.showModal(presets.tsSecondsModal);
			break;
			case 'tsDay':
				cmd.showModal(presets.tsDayModal);
			break;
			case 'tsYear':
				cmd.showModal(presets.tsYearModal);
			break;

			// Modals
			case "tsYearModal":
				var inp=cmd.fields.getTextInputValue("tsYearInp").padStart(4,"20");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setYear(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsMinutesModal":
				var inp=cmd.fields.getTextInputValue("tsMinutesInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setMinutes(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsSecondsModal":
				var inp=cmd.fields.getTextInputValue("tsSecondsInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setSeconds(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsHourModal":
				var inp=cmd.fields.getTextInputValue("tsHourInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				inp=+inp-storage[cmd.user.id].config.timeOffset;
				if(cmd.fields.getTextInputValue("tsAmPm").toLowerCase()[0]==="p"&&inp<13){
					inp+=12;
				}
				while(inp>23){
					inp-=24;
				}
				while(inp<0){
					inp+=24;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setHours(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsDayModal":
				var inp=cmd.fields.getTextInputValue("tsDayInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				inp=+inp;
				var t=new Date(+cmd.message.content.split(":")[1]*1000);
				if(24-t.getHours()<storage[cmd.user.id].config.timeOffset){
					inp++;
				}
				if(t.getHours()-storage[cmd.user.id].config.timeOffset<0){
					inp--;
				}
				cmd.update(`<t:${Math.round(t.setDate(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
        
			// Menus
			case 'tsMonth':
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setMonth(cmd.values[0])/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case 'tsType':
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000)/1000)}:${cmd.values[0]}>`);
			break;
		}
	}
};
