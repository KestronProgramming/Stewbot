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
		command: new SlashCommandBuilder().setName("delete").setDescription("Delete any number of messages")
			.addIntegerOption(option=>
				option.setName("amount").setDescription("The amount of the most recent messages to delete").setMinValue(1).setMaxValue(99).setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: ["General","Administration","Server Only"],
			/*
				- General
				- Information
				- Bot
				- Administration
				- Configuration
				- Entertainment
				- Context Menu
				- Other/Misc
				- Server Only
				- User Install Only
			*/
			shortDesc: "Delete any number of messages",
			detailedDesc: 
				`Delete the specified number of messages in bulk. Must be less than a hundred for each time this command is used.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageMessages)){
			cmd.followUp(`I do not have the necessary permissions to execute this command.`);
			return;
		}

		const privateBuffer = cmd.options.getBoolean("private") ? 0 : 1;
		const requestedNum = cmd.options.getInteger("amount");
		let numToDelete = requestedNum + privateBuffer;
		let dateLimited = false; // JANKY: Store truthy original number of messages if more than we can do was requested 
		
		// Try flat out doing it (instead of fetching first, that could eat a ton of ram if there are a lot of messages)
		try {
			await cmd.channel.bulkDelete(numToDelete);
		} catch {
			// Fetch how many messages there were (verify under the given limit) there were in the past 14 days
			dateLimited = true;
			const messages = await cmd.channel.messages.fetch({ limit: numToDelete });
			const twoWeeksAgo = Date.now() - 12096e5; // 14 days in ms
			numToDelete = messages.filter(msg => msg.createdTimestamp >= twoWeeksAgo).size;
			try {
				await cmd.channel.bulkDelete(numToDelete);
			} catch(e) {
				notify(1, `Error bulk deleting: ${e.stack}`)
				dateLimited = -1 // idk, this is a good open place to note we had an error
			}
		}

		let response = `I have cleared ${numToDelete} messages at <@${cmd.user.id}>'s direction.`
		if (dateLimited) {
			response += `\nPlease note, I couldn't delete the full requested ${requestedNum} because some are older than two weeks.`
		}
		if (dateLimited === -1) {
			response = `My apologies, an unknown error was encountered. This error has been reported, feel free to use ${cmds.report_problem.mention} to report additional details.`
		}

		if (!cmd.options.getBoolean("private")) {
            setTimeout(() => {
                cmd.channel.send({content: response, allowedMentions: { parse: [] }});
            }, 2000);
		}
	}
};
