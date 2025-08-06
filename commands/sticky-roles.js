// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, GuildUsers, guildByID, userByID, guildByObj, guildUserByObj, guildUserByID, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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

	// This module should be run before auto-join-roles
	priority: 50,

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const updates = {
			"stickyRoles": cmd.options.getBoolean("active")
		}
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			updates.stickyRoles=false;
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run sticky roles.`);
			return;
		}

		// Push updates
		await guildByObj(cmd.guild, updates)

		cmd.followUp("Sticky roles configured. Please be aware I can only manage roles lower than my highest role in the server roles list.");
	},

	/** @param {import("discord.js").GuildMember} member */
	async [Events.GuildMemberAdd](member, readGuildStore) {

		// Track whether we added any roles to know whether or not to apply auto join roles.
		let addedStickyRoles = 0;

		if (readGuildStore.stickyRoles) {
			let myUser = await member.guild?.members.fetch(client.user.id)
			if (!myUser?.permissions.has(PermissionFlagsBits.ManageRoles)) {
				Guilds.updateOne({ id: readGuildStore.id }, { 
					$set: { "stickyRoles": false }
				})
			}
			else {
				const guildUser = await guildUserByObj(member.guild, member.id);
				let myRole = myUser.roles.highest.position;

				for (const roleId of guildUser.roles) {
					try {
						var role = await member.guild.roles.fetch(roleId);
						if (role && role.id !== member.guild.id) {
							if (myRole > role.rawPosition) {
								member.roles.add(role).catch(e => null);
								addedStickyRoles++;
							}
						}
					}
					catch (e) { }
				}
			}
		}

		// Signal to auto-join-roles
		if (addedStickyRoles > 0) member.addedStickyRoles = true;
	},

	async [Events.GuildMemberRemove] (member, readGuildStore) {
		// Save all this user's roles
		await guildUserByID(member.guild.id, member.id, {
			"roles": member.roles.cache.map(r => r.id) 
		}, true);
	}
};
