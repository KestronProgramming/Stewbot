// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const chrono = require('chrono-node');

function getOffsetDateByUTCOffset(timestamp, targetOffset) {
	const date = new Date(timestamp);
	const serverOffset = date.getTimezoneOffset();
	const targetOffsetMinutes = targetOffset * 60;
	const offsetDiff = -serverOffset - targetOffsetMinutes;
	return new Date(date.getTime() + (offsetDiff * 60 * 1000));
}

function parseTextDateIfValid(text, timezone) {
	// returns null if invalid
	if (!text) return null;

	startingTime = chrono.parseDate(text);

	if (isNaN(startingTime?.getTime())) return null;
	
	startingTime = getOffsetDateByUTCOffset(startingTime, myTimezone);

	if (isNaN(startingTime?.getTime())) return null;
}

const components = {
	timestamp: [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("tsHour").setLabel("Hour").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("tsMinutes").setLabel("Minutes").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("tsSeconds").setLabel("Seconds").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("tsDay").setLabel("Day").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("tsYear").setLabel("Year").setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("tsMonth").setPlaceholder("Month...").addOptions(
			new StringSelectMenuOptionBuilder().setLabel("January").setValue("0"),
			new StringSelectMenuOptionBuilder().setLabel("February").setValue("1"),
			new StringSelectMenuOptionBuilder().setLabel("March").setValue("2"),
			new StringSelectMenuOptionBuilder().setLabel("April").setValue("3"),
			new StringSelectMenuOptionBuilder().setLabel("May").setValue("4"),
			new StringSelectMenuOptionBuilder().setLabel("June").setValue("5"),
			new StringSelectMenuOptionBuilder().setLabel("July").setValue("6"),
			new StringSelectMenuOptionBuilder().setLabel("August").setValue("7"),
			new StringSelectMenuOptionBuilder().setLabel("September").setValue("8"),
			new StringSelectMenuOptionBuilder().setLabel("October").setValue("9"),
			new StringSelectMenuOptionBuilder().setLabel("November").setValue("10"),
			new StringSelectMenuOptionBuilder().setLabel("December").setValue("11")
        )),
        new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("tsType").setPlaceholder("Display Type...").addOptions(
            new StringSelectMenuOptionBuilder().setLabel("Relative").setDescription("Example: 10 seconds ago").setValue("R"),
            new StringSelectMenuOptionBuilder().setLabel("Short Time").setDescription("Example: 1:48 PM").setValue("t"),
            new StringSelectMenuOptionBuilder().setLabel("Short Date").setDescription("Example: 4/19/22").setValue("d"),
            new StringSelectMenuOptionBuilder().setLabel("Short Time w/ Seconds").setDescription("Example: 1:48:00 PM").setValue("T"),
            new StringSelectMenuOptionBuilder().setLabel("Long Date").setDescription("Example: April 19, 2022").setValue("D"),
            new StringSelectMenuOptionBuilder().setLabel("Long Date & Short Time").setDescription("April 19, 2022 at 1:48 PM").setValue("f"),
            new StringSelectMenuOptionBuilder().setLabel("Full Date").setDescription("Example: Tuesday, April 19, 2022 at 1:48 PM").setValue("F")
        )),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("howToCopy").setLabel("How to Copy").setStyle(ButtonStyle.Danger), 
            new ButtonBuilder().setCustomId("onDesktop").setLabel("On Desktop").setStyle(ButtonStyle.Success)
        ),
    ],

    tsHourModal: new ModalBuilder()
        .setCustomId("tsHourModal")
        .setTitle("Set the Hour for the Timestamp")
        .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsHourInp").setLabel("The hour of day...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(4).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsAmPm").setLabel("If you used 12 hour, AM/PM").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(false))
        ),
    tsMinutesModal: new ModalBuilder()
        .setCustomId("tsMinutesModal")
        .setTitle("Set the Minutes for the Timestamp")
        .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsMinutesInp").setLabel("The minutes...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true))
        ),
    tsSecondsModal: new ModalBuilder()
        .setCustomId("tsSecondsModal")
        .setTitle("Set the Seconds for the Timestamp")
        .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsSecondsInp").setLabel("The seconds...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true))
        ),
    tsDayModal: new ModalBuilder()
        .setCustomId("tsDayModal")
        .setTitle("Set the Day for the Timestamp")
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsDayInp").setLabel("The day of the month...").setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true))),
    tsYearModal: new ModalBuilder()
        .setCustomId("tsYearModal")
        .setTitle("Set the Year for the Timestamp")
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("tsYearInp").setLabel("The year...").setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(4).setRequired(true))),
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("timestamp").setDescription("Generate a timestamp for use in your message").addStringOption(option=>
			option.setName("quick-input").setDescription("Attempt to parse a sentence into a date.")
		),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: ["General","Information","Entertainment"],			shortDesc: "Generate a timestamp for use in your message",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Generates a timestamp string. Pasting the output will automatically correct the time set to show the correct time for any user regardless of timezone.\n
				For example, if there was a timestamp for 4 EST, a user in PST would see 1.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(storage[cmd.user.id].config.hasSetTZ){
			const myTimezone = storage[cmd.user.id].config.timeOffset;
			const quickInput = cmd.options.getString("quick-input");
			let startingTime = parseTextDateIfValid(quickInput)
			if (!startingTime) startingTime = new Date();
			
			cmd.followUp({content:`<t:${Math.round(( startingTime )/1000)}:t>`,components:components.timestamp});
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
				cmd.showModal(components.tsHourModal);
			break;
			case 'tsMinutes':
				cmd.showModal(components.tsMinutesModal);
			break;
			case 'tsSeconds':
				cmd.showModal(components.tsSecondsModal);
			break;
			case 'tsDay':
				cmd.showModal(components.tsDayModal);
			break;
			case 'tsYear':
				cmd.showModal(components.tsYearModal);
			break;

			// Modals
			case "tsYearModal":
				var inp=cmd.fields.getTextInputValue("tsYearInp").padStart(4,"20");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCFullYear(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsMinutesModal":
				var inp=cmd.fields.getTextInputValue("tsMinutesInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCMinutes(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsSecondsModal":
				var inp=cmd.fields.getTextInputValue("tsSecondsInp");
				if(!/^\d+$/.test(inp)) {
					cmd.deferUpdate();
					break;
				}
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCSeconds(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
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
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCHours(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;

			case "tsDayModal":
				var inp=cmd.fields.getTextInputValue("tsDayInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				inp=+inp;
				var t=new Date(+cmd.message.content.split(":")[1]*1000);
				if(24-t.getUTCHours()<storage[cmd.user.id].config.timeOffset){
					inp++;
				}
				if(t.getUTCHours()-storage[cmd.user.id].config.timeOffset<0){
					inp--;
				}
				cmd.update(`<t:${Math.round(t.setUTCDate(inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
        
			// Menus
			case 'tsMonth':
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCMonth(cmd.values[0])/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case 'tsType':
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000)/1000)}:${cmd.values[0]}>`);
			break;
		}
	}
};
