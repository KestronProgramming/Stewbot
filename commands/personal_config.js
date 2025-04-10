// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
const { chmodSync } = require("fs");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate


const tzConfig = [new ActionRowBuilder().addComponents(
	new ButtonBuilder().setCustomId("tzUp").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
	new ButtonBuilder().setCustomId("tzDown").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
	new ButtonBuilder().setCustomId("tzSave").setEmoji("✅").setStyle(ButtonStyle.Success)
)]


module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("personal_config").setDescription("Configure the bot for you personally")
			.setDescription("Configure the bot for you personally").addBooleanOption(option=>
				option.setName("ai_pings").setDescription("Respond with an AI message to pings or DMs")
			).addBooleanOption(option=>
				option.setName("dm_infractions").setDescription("If you get filtered, should I DM you?")
			).addBooleanOption(option=>
				option.setName("dm_infraction_content").setDescription("If dm_infractions is true, should I include the content of the filtered message?")
			).addBooleanOption(option=>
				option.setName("embeds").setDescription("If you link a Discord message, should I embed a preview for you?")
			).addBooleanOption(option=>
				option.setName("level_up_messages").setDescription("Do you want to receive messages letting you know you leveled up?")
			).addBooleanOption(option=>
				option.setName("configure_timezone").setDescription("Open up a menu to configure your timezone?")
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.General, Categories.Bot, Categories.Configuration],
			shortDesc: "Configure the bot for you personally",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure options for your personal interactions with the bot. This includes options such as if the bot tells you when you're filtered, if it automatically embeds certain links you post, or if you want it to not ping you whenb you level up in a server. You can also set your timezone for use with ${cmds.timestamp.mention}`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(cmd.options.getBoolean("ai_pings")!==null) storage[cmd.user.id].config.aiPings=cmd.options.getBoolean("ai_pings");
		if(cmd.options.getBoolean("dm_infractions")!==null) storage[cmd.user.id].config.dmOffenses=cmd.options.getBoolean("dm_infractions");
		if(cmd.options.getBoolean("dm_infraction_content")!==null) storage[cmd.user.id].config.returnFiltered=cmd.options.getBoolean("dm_infraction_content");
		if(cmd.options.getBoolean("embeds")!==null) storage[cmd.user.id].config.embedPreviews=cmd.options.getBoolean("embeds");
		if(cmd.options.getBoolean("level_up_messages"!==null)) storage[cmd.user.id].config.levelUpMsgs=cmd.options.getBoolean("level_up_messages");
		
		// Timezone response is more complex so respond differently at the end if we're configuring that 
		if(!cmd.options.getBoolean("configure_timezone")){
			cmd.followUp("Configured your personal setup");
		}
		else {
			const cur = new Date();
			const curHour = cur.getUTCHours();
			const curMinute = cur.getUTCMinutes();

			if(!storage[cmd.user.id].config.hasSetTZ) storage[cmd.user.id].config.timeOffset=0;
			cmd.followUp({
                content: `## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${
                    curHour + storage[cmd.user.id].config.timeOffset === 0
                        ? "12"
                        : curHour +
                              storage[cmd.user.id].config.timeOffset > 12
                        	? curHour + storage[cmd.user.id].config.timeOffset - 12
                        	: curHour + storage[cmd.user.id].config.timeOffset
                }:${(curMinute + "").padStart(2, "0")} ${
                    curHour + storage[cmd.user.id].config.timeOffset > 11
                        ? "PM"
                        : "AM"
                }\n${(
                    curHour + storage[cmd.user.id].config.timeOffset + ""
                ).padStart(2, "0")}${(curMinute + "").padStart(2, "0")}`,
                
				components: tzConfig,
            });
		}
	},

	subscribedButtons: ["tzUp", "tzDown", "tzSave"],
	async onbutton(cmd, context) {
		applyContext(context);

		const cur = new Date();
		const curHour = cur.getUTCHours();
		const curMinute = cur.getUTCMinutes();

		switch(cmd.customId) {
			case 'tzUp':
				if(!storage[cmd.user.id].config.hasOwnProperty("timeOffset")){
					storage[cmd.user.id].config.timeOffset=0;
					storage[cmd.user.id].config.hasSetTZ=false;
				}
				storage[cmd.user.id].config.timeOffset++;
				
				cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(curHour+storage[cmd.user.id].config.timeOffset)===0?"12":(curHour+storage[cmd.user.id].config.timeOffset)>12?(curHour+storage[cmd.user.id].config.timeOffset)-12:(curHour+storage[cmd.user.id].config.timeOffset)}:${(curMinute+"").padStart(2,"0")} ${(curHour+storage[cmd.user.id].config.timeOffset)>11?"PM":"AM"}\n${((curHour+storage[cmd.user.id].config.timeOffset)+"").padStart(2,"0")}${(curMinute+"").padStart(2,"0")}`);
			break;
			case 'tzDown':
				if(!storage[cmd.user.id].config.hasOwnProperty("timeOffset")){
					storage[cmd.user.id].config.timeOffset=0;
					storage[cmd.user.id].config.hasSetTZ=false;
				}
				storage[cmd.user.id].config.timeOffset--;

				cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(curHour+storage[cmd.user.id].config.timeOffset)===0?"12":(curHour+storage[cmd.user.id].config.timeOffset)>12?(curHour+storage[cmd.user.id].config.timeOffset)-12:(curHour+storage[cmd.user.id].config.timeOffset)}:${(curMinute+"").padStart(2,"0")} ${(curHour+storage[cmd.user.id].config.timeOffset)>11?"PM":"AM"}\n${((curHour+storage[cmd.user.id].config.timeOffset)+"").padStart(2,"0")}${(curMinute+"").padStart(2,"0")}`);
			break;
			case 'tzSave':
				storage[cmd.user.id].config.hasSetTZ=true;
				
				cmd.update({content:`## Timezone Configured\n\nUTC ${storage[cmd.user.id].config.timeOffset}`,components:[]});
			break;
		}
	}
};
