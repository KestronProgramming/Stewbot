// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

// const chrono = require('chrono-node');
// function parseTextDateIfValid_Chrono(text, myTimezone) {
// 	// returns null if invalid
// 	if (!text) return null;

// 	var startingTime = chrono.parseDate(text);
// 	if (isNaN(startingTime?.getTime())) return null;
	
// 	startingTime = getOffsetDateByUTCOffset(startingTime, myTimezone);
// 	if (isNaN(startingTime?.getTime())) return null;

// 	return startingTime;
// }

const sherlock = require('sherlockjs');
function parseTextDateIfValid_Sherlock(text, myTimezone) {
	if (!text) return null;

	const result = sherlock.parse(text);
	if (!result.startDate || isNaN(result.startDate.getTime())) return null;

	const startingTime = getOffsetDateByUTCOffset(result.startDate, myTimezone);
	return isNaN(startingTime?.getTime()) ? null : startingTime;
}

// require('sugar');
// function parseTextDateIfValid_Sugar(text, myTimezone) {
// 	if (!text) return null;

// 	const date = Date.create(text); // Sugar’s date parsing
// 	if (!date || isNaN(date.getTime())) return null;

// 	const startingTime = getOffsetDateByUTCOffset(date, myTimezone);
// 	return isNaN(startingTime?.getTime()) ? null : startingTime;
// }

// require('datejs');
// function parseTextDateIfValid_DateJS(text, myTimezone) {
// 	if (!text) return null;

// 	const date = Date.parse(text); // returns Date object
// 	if (!date || isNaN(date.getTime())) return null;

// 	const startingTime = getOffsetDateByUTCOffset(date, myTimezone);
// 	return isNaN(startingTime?.getTime()) ? null : startingTime;
// }

// const nlp = require('compromise');
// require('compromise-dates')(nlp);
// function parseTextDateIfValid_Compromise(text, myTimezone) {
// 	if (!text) return null;

// 	const doc = nlp(text);
// 	const dates = doc.dates().get();
// 	if (!dates.length || !dates[0].data?.length) return null;

// 	const parsed = dates[0].data[0];
// 	const date = new Date(parsed.date || parsed.start);
// 	if (isNaN(date.getTime())) return null;

// 	const startingTime = getOffsetDateByUTCOffset(date, myTimezone);
// 	return isNaN(startingTime?.getTime()) ? null : startingTime;
// }



// Select which lib to use
const parseTextDateIfValid_Version = parseTextDateIfValid_Sherlock;

function getOffsetDateByUTCOffset(timestamp, targetOffset) {
	const date = new Date(timestamp);
	const serverOffset = date.getTimezoneOffset();
	const targetOffsetMinutes = targetOffset * 60;
	const offsetDiff = -serverOffset - targetOffsetMinutes;
	return new Date(date.getTime() + (offsetDiff * 60 * 1000));
}


const components = {
    timestamp: [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("tsHour")
                .setLabel("Hour")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsMinutes")
                .setLabel("Minutes")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsSeconds")
                .setLabel("Seconds")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsDay")
                .setLabel("Day")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("tsYear")
                .setLabel("Year")
                .setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("tsMonth")
                .setPlaceholder("Month...")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("January")
                        .setValue("0"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("February")
                        .setValue("1"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("March")
                        .setValue("2"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("April")
                        .setValue("3"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("May")
                        .setValue("4"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("June")
                        .setValue("5"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("July")
                        .setValue("6"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("August")
                        .setValue("7"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("September")
                        .setValue("8"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("October")
                        .setValue("9"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("November")
                        .setValue("10"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("December")
                        .setValue("11")
                )
        ),
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("tsType")
                .setPlaceholder("Display Type...")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Relative")
                        .setDescription("Example: 10 seconds ago")
                        .setValue("R"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Time")
                        .setDescription("Example: 1:48 PM")
                        .setValue("t"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Date")
                        .setDescription("Example: 4/19/22")
                        .setValue("d"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Short Time w/ Seconds")
                        .setDescription("Example: 1:48:00 PM")
                        .setValue("T"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Long Date")
                        .setDescription("Example: April 19, 2022")
                        .setValue("D"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Long Date & Short Time")
                        .setDescription("April 19, 2022 at 1:48 PM")
                        .setValue("f"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Full Date")
                        .setDescription(
                            "Example: Tuesday, April 19, 2022 at 1:48 PM"
                        )
                        .setValue("F")
                )
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("howToCopy")
                .setLabel("How to Copy")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("onDesktop")
                .setLabel("On Desktop")
                .setStyle(ButtonStyle.Success)
        ),
    ],

    tsHourModal: new ModalBuilder()
        .setCustomId("tsHourModal")
        .setTitle("Set the Hour for the Timestamp")
        .addComponents(
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsHourInp")
                    .setLabel("The hour of day...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(4)
                    .setRequired(true)
            ),
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsAmPm")
                    .setLabel("If you used 12 hour, AM/PM")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(false)
            )
        ),
    tsMinutesModal: new ModalBuilder()
        .setCustomId("tsMinutesModal")
        .setTitle("Set the Minutes for the Timestamp")
        .addComponents(
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsMinutesInp")
                    .setLabel("The minutes...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsSecondsModal: new ModalBuilder()
        .setCustomId("tsSecondsModal")
        .setTitle("Set the Seconds for the Timestamp")
        .addComponents(
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsSecondsInp")
                    .setLabel("The seconds...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsDayModal: new ModalBuilder()
        .setCustomId("tsDayModal")
        .setTitle("Set the Day for the Timestamp")
        .addComponents(
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsDayInp")
                    .setLabel("The day of the month...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true)
            )
        ),
    tsYearModal: new ModalBuilder()
        .setCustomId("tsYearModal")
        .setTitle("Set the Year for the Timestamp")
        .addComponents(
			// @ts-ignore
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("tsYearInp")
                    .setLabel("The year...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(4)
                    .setRequired(true)
            )
        ),
};

module.exports = {
	parseTextDateIfValid_Version,
	
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
			helpCategories: [Categories.General, Categories.Information, Categories.Entertainment],
			shortDesc: "Generate a timestamp for use in your message",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Generates a timestamp string. Pasting the output will automatically correct the time set to show the correct time for any user regardless of timezone.\n
				For example, if there was a timestamp for 4 EST, a user in PST would see 1.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const user = await userByObj(cmd.user);
		
		if(user.config.hasSetTZ){
			const myTimezone = user.config.timeOffset;
			const quickInput = cmd.options.getString("quick-input");
			let startingTime = parseTextDateIfValid_Version(quickInput, myTimezone)
			if (!startingTime) startingTime = new Date();
			
			cmd.followUp({
                content: `<t:${Math.round(Number(startingTime) / 1000)}:t>`,
				// @ts-ignore
				components: components.timestamp
			});
		}
		else{
			// @ts-ignore
			cmd.followUp(`This command needs you to set your timezone first! Run ${cmds.personal_config.mention} and specify \`configure_timezone\` to get started,`);
		}
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["timestamp", "howToCopy", "onDesktop", /ts.*/],
	
    /** @param {import('discord.js').ButtonInteraction | import('discord.js').AnySelectMenuInteraction | import('discord.js').ModalSubmitInteraction } cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		const user = await userByObj(cmd.user);

		switch(cmd.customId) {
			// Buttons
			case 'howToCopy':
            	cmd.reply({content:`## Desktop\n- Press the \`On Desktop\` button\n- Press the copy icon on the top right of the code block\n- Paste it where you want to use it\n## Mobile\n- Hold down on the message until the context menu appears\n- Press \`Copy Text\`\n- Paste it where you want to use it`,ephemeral:true});
			break;
			case 'onDesktop':
				cmd.reply({content:`\`\`\`\n${cmd.message.content}\`\`\``,ephemeral:true});
			break;
			case 'tsHour':
				if (!cmd.isButton()) return;
				cmd.showModal(components.tsHourModal);
			break;
			case 'tsMinutes':
				if (!cmd.isButton()) return;
				cmd.showModal(components.tsMinutesModal);
			break;
			case 'tsSeconds':
				if (!cmd.isButton()) return;
				cmd.showModal(components.tsSecondsModal);
			break;
			case 'tsDay':
				if (!cmd.isButton()) return;
				cmd.showModal(components.tsDayModal);
			break;
			case 'tsYear':
				if (!cmd.isButton()) return;
				cmd.showModal(components.tsYearModal);
			break;

			// Modals
			case "tsYearModal":
				if (!cmd.isModalSubmit()) return;
				var inp=cmd.fields.getTextInputValue("tsYearInp").padStart(4,"20");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				// @ts-ignore
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCFullYear(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsMinutesModal":
				if (!cmd.isModalSubmit()) return;
				var inp=cmd.fields.getTextInputValue("tsMinutesInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				// @ts-ignore
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCMinutes(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsSecondsModal":
				if (!cmd.isModalSubmit()) return;
				var inp=cmd.fields.getTextInputValue("tsSecondsInp");
				if(!/^\d+$/.test(inp)) {
					cmd.deferUpdate();
					break;
				}
				// @ts-ignore
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCSeconds(+inp)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case "tsHourModal":
				if (!cmd.isModalSubmit()) return;
				var inp = cmd.fields.getTextInputValue("tsHourInp");
				if(!/^\d+$/.test(inp)){
					cmd.deferUpdate();
					break;
				}
				let numberInput = Number(inp) - user.config.timeOffset;
				if(cmd.fields.getTextInputValue("tsAmPm").toLowerCase()[0]==="p"&&numberInput<13){
					numberInput+=12;
				}
				while(numberInput>23){
					numberInput-=24;
				}
				while(numberInput<0){
					numberInput+=24;
				}
				// @ts-ignore
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCHours(numberInput)/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;

			case "tsDayModal":
				if (!cmd.isModalSubmit()) return;
				var inpStr = cmd.fields.getTextInputValue("tsDayInp");
				if (!/^\d+$/.test(inpStr)) {
					cmd.deferUpdate();
					break;
				}
				var inpNum = +inpStr;
				var t = new Date(+cmd.message.content.split(":")[1] * 1000);
				if (24 - t.getUTCHours() < user.config.timeOffset) {
					inpNum++;
				}
				if (t.getUTCHours() - user.config.timeOffset < 0) {
					inpNum--;
				}
                // @ts-ignore
				cmd.update(`<t:${Math.round(t.setUTCDate(inpNum) / 1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
        
			// Menus
			case 'tsMonth':
                // @ts-ignore
				cmd.update(`<t:${Math.round(new Date(+cmd.message.content.split(":")[1]*1000).setUTCMonth(cmd.values[0])/1000)}:${cmd.message.content.split(":")[2].split(">")[0]}>`);
			break;
			case 'tsType':
                // @ts-ignore
				cmd.update(`<t:${Math.round(new Date(Number(cmd.message.content.split(":")[1]) * 1000).getTime() / 1000)}:${cmd.values[0]}>`);
			break;
		}
	}
};
