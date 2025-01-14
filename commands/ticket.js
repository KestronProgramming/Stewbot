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
			helpCategories: ["Administration","Configuration","Server Only"],
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
			shortDesc: "Set up a ticket system here for users to contact mods",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Use this command in the channel you would like Stewbot to post the ticket message in. This message will contain a button that will connect the user's DMs with Stewbot to a thread in the channel specified during command setup.`
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
