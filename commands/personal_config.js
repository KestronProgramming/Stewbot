// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
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
			).addBooleanOption(option=>
				option.setName("attachment_protection").setDescription("Protect you from leaking personal information in your message attachments")
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

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const user = await userByObj(cmd.user);
		
		if (cmd.options.getBoolean("ai_pings") !== null) user.config.aiPings = cmd.options.getBoolean("ai_pings");
		if (cmd.options.getBoolean("dm_infractions") !== null) user.config.dmOffenses = cmd.options.getBoolean("dm_infractions");
		if (cmd.options.getBoolean("dm_infraction_content") !== null) user.config.returnFiltered = cmd.options.getBoolean("dm_infraction_content");
		if (cmd.options.getBoolean("embeds") !== null) user.config.embedPreviews = cmd.options.getBoolean("embeds");
		if (cmd.options.getBoolean("level_up_messages") !== null) user.config.levelUpMsgs = cmd.options.getBoolean("level_up_messages");
		if (cmd.options.getBoolean("attachment_protection") !== null) user.config.attachmentProtection = cmd.options.getBoolean("attachment_protection");
		
		// Timezone response is more complex so respond differently at the end if we're configuring that 
		if(!cmd.options.getBoolean("configure_timezone")){
			cmd.followUp("Configured your personal setup");
		}
		else {
			const cur = new Date();
			const curHour = cur.getUTCHours();
			const curMinute = cur.getUTCMinutes();

			if(!user.config.hasSetTZ) user.config.timeOffset=0;
			cmd.followUp({
                content: `## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${
                    curHour + user.config.timeOffset === 0
                        ? "12"
                        : curHour +
                              user.config.timeOffset > 12
                        	? curHour + user.config.timeOffset - 12
                        	: curHour + user.config.timeOffset
                }:${(curMinute + "").padStart(2, "0")} ${
                    curHour + user.config.timeOffset > 11
                        ? "PM"
                        : "AM"
                }\n${(
                    curHour + user.config.timeOffset + ""
                ).padStart(2, "0")}${(curMinute + "").padStart(2, "0")}`,
                
				components: tzConfig,
            });
		}

		await user.save();
	},

	subscribedButtons: ["tzUp", "tzDown", "tzSave"],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		const user = await userByObj(cmd.user);

		const cur = new Date();
		const curHour = cur.getUTCHours();
		const curMinute = cur.getUTCMinutes();

		switch(cmd.customId) {
			case 'tzUp':
				user.config.timeOffset++;
				cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(curHour+user.config.timeOffset)===0?"12":(curHour+user.config.timeOffset)>12?(curHour+user.config.timeOffset)-12:(curHour+user.config.timeOffset)}:${(curMinute+"").padStart(2,"0")} ${(curHour+user.config.timeOffset)>11?"PM":"AM"}\n${((curHour+user.config.timeOffset)+"").padStart(2,"0")}${(curMinute+"").padStart(2,"0")}`);
			break;
			case 'tzDown':
				// NOTE: it would be better of the offset is stored in the buttons until they click save.
				user.config.timeOffset--;
				cmd.update(`## Timezone Configuration\n\nPlease use the buttons to make the following number your current time (you can ignore minutes)\n${(curHour+user.config.timeOffset)===0?"12":(curHour+user.config.timeOffset)>12?(curHour+user.config.timeOffset)-12:(curHour+user.config.timeOffset)}:${(curMinute+"").padStart(2,"0")} ${(curHour+user.config.timeOffset)>11?"PM":"AM"}\n${((curHour+user.config.timeOffset)+"").padStart(2,"0")}${(curMinute+"").padStart(2,"0")}`);
			break;
			case 'tzSave':
				user.config.hasSetTZ=true;
				
				cmd.update({
					content:`## Timezone Configured\n\nUTC ${user.config.timeOffset}`,
					components:[]
				});
			break;
		}

		user.save();
	}
};
