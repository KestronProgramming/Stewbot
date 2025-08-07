// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user")
			.addUserOption(option=>
				option.setName("target").setDescription("Who to timeout?").setRequired(true)
			).addIntegerOption(option=>
				option.setName("preset_length").setDescription("Some quick access options for times to timeout").addChoices(
					{name:"1 min",value:60000},
					{name:"5 min",value:60000*5},
					{name:"10 min",value:600000},
					{name:"1 hour",value:60000*60},
					{name:"1 day",value:60000*60*24},
					{name:"1 week",value:60000*60*24*7}
				)
			).addIntegerOption(option=>
				option.setName("hours").setDescription("Hours to timeout for").setMinValue(1,23)
			).addIntegerOption(option=>
				option.setName("minutes").setDescription("Minutes to timeout for").setMinValue(1,59)
			).addIntegerOption(option=>
				option.setName("days").setDescription("Days to timeout for").setMinValue(1,30)
			).addStringOption(option=>
				option.setName("reason").setDescription("What is the reason for this timeout?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Administration, Categories.General, Categories.Server_Only],
			shortDesc: "Timeout a user",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Timeout a specified user for a configurable amount of time`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const targetMember = cmd.guild.members.cache.get(cmd.options.getUser("target").id);
		const issuerMember = cmd.guild.members.cache.get(cmd.user.id);

		if (targetMember.id === cmd.guild.ownerId) {
			return cmd.followUp("I cannot timeout the owner of this server.");
		}
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ModerateMembers)){
			cmd.followUp(`I cannot timeout right now as I'm missing the ModerateMembers permission.`);
			return;
		}
		if(targetMember.bot){
			cmd.followUp(`I cannot timeout bots. ${targetMember.id===client.user.id?`I apologize for any inconveniences I may have caused. You can use ${cmds.report_problem.mention} if there's something that needs improvement. You can try reconfiguring me as well.`:`Try reconfiguring the bot, or removing it if necessary.`}`);
			return;
		}
		if(cmd.user.id===targetMember.id){
			cmd.followUp(`I cannot timeout you as the one invoking the command. If you feel the need to timeout yourself, consider changing your actions and mindset instead.`);
			return;
		}
		if (issuerMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
			return cmd.followUp("You cannot timeout this user because they have a role equal to or higher than yours.");
		}
		var timer=0;
		if(cmd.options.getInteger("preset_length")!==null) timer=cmd.options.getInteger("preset_length");
		if(cmd.options.getInteger("days")!==null) timer+=cmd.options.getInteger("days")*60000*60*24;
		if(cmd.options.getInteger("hours")!==null) timer+=cmd.options.getInteger("hours")*60000*60;
		if(cmd.options.getInteger("minutes")!==null) timer+=cmd.options.getInteger("minutes")*60000;
		if(timer<1) timer=60000*15;
		cmd.guild.members.cache.get(targetMember.id).timeout(timer,`Instructed to timeout by ${cmd.user.username}: ${cmd.options.getString("reason")}`);
		cmd.followUp({content:`I have attempted to timeout <@${targetMember.id}>.`,allowedMentions:{parse:[]}});
	}
};
