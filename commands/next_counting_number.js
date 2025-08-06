// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, GuildUsers } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { limitLength } = require("../utils.js")

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

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);

		if (guild.counting.active) {

			const nextNumberText = `The next number to enter${
				cmd.channel.id!==guild.counting.channel
					?` in <#${guild.counting.channel}>`
					:""
				} is \`${guild.counting.nextNum}\``

			const turnLimitedCounters = await GuildUsers.find({
				guildId: cmd.guild.id,
				countTurns: { $gt: 0 }
			}).lean();

			let turnLimitedMessage = "";
			if (turnLimitedCounters.length) {
				// Number of users that you need to wait for
				turnLimitedMessage +=  `\n\nYou need to wait for ${guild.counting.takeTurns} other ${
					guild.counting.takeTurns===1? `person`: `people`
				} to post before taking another turn in this server. `

				// List of users who can't post
				turnLimitedMessage += `The following users have posted within this danger zone:\n${
					turnLimitedCounters.map(user => `- <@${user.userId}>`).join("\n")
				}`;
			}
			
			cmd.followUp({
				content: limitLength(`${nextNumberText}.${turnLimitedMessage}`),
				allowedMentions:{ parse:[] } 
			});
		}

		else {
			cmd.followUp({ content: `Counting isn't active in this server! Use ${cmds.counting.config.mention} to set it up.` })
		}
	}
};
