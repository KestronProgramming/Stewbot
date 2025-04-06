// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("sticky-roles").setDescription("Add roles back to a user who left and rejoined")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Should I add roles back to users who left and rejoined?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: { 
			helpCategories: [Categories.General, Categories.Administration, Categories.Configuration, Categories.Server_Only, Categories.Safety],
			shortDesc: "Add roles back to a user who left and rejoined",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`If a user leaves the server and then comes back and this setting is enabled, Stewbot will automatically reapply the roles the user had beforehand. This is useful for roles that limit or enhance the user's permissions.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			storage[cmd.guildId].stickyRoles=false;
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run sticky roles.`);
			return;
		}

		guildByObj(cmd.guild, {
			"stickyRoles": cmd.options.getBoolean("active")
		})

		cmd.followUp("Sticky roles configured. Please be aware I can only manage roles lower than my highest role in the server roles list.");
	}
};
