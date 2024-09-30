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
		command: new SlashCommandBuilder().setName("ticket").setDescription("Set up a ticket system here for users to contact mods").addChannelOption(option=>
				option.setName("channel").setDescription("The channel for tickets to be opened in on the staff end").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategory: "Administration",
			helpDesc: "Setup a ticket system so that users can communicate directly and privately with moderators",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		cmd.followUp({embeds:
			[{
				"type": "rich",
				"title": `${cmd.guild.name} Moderator Tickets`,
				"description": `Press the button below to open up a private ticket with ${cmd.guild.name} moderators.`,
				"color": 0x006400,
				"thumbnail": {
					"url": cmd.guild.iconURL(),
					"height": 0,
					"width": 0
				},
				"footer": {
					"text": `Tickets will take place over DMs, make sure to have DMs open to ${client.user.username}.`
				}
			}], 
			components:	[
				new ActionRowBuilder()
				.addComponents(new ButtonBuilder().setCustomId(`ticket-${cmd.options.getChannel("channel").id}`)
				.setLabel("Create private ticket with staff")
				.setStyle(ButtonStyle.Success))
			]
		});
	}
};
