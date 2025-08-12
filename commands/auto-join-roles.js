// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("auto-join-roles").setDescription("Automatically add roles to a user when they join the server")
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Automatically add roles to a user when they join the server",
			detailedDesc: 
				`Configures a set of roles added to every user whenever they join the server. If you have sticky roles enabled, and the user has been in the server before, sticky roles will override any auto join roles.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		if(!cmd.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)){
			cmd.followUp(`I do not have the MANAGE_ROLES permission for this server, so I cannot run auto join roles.`);
			return;
		}
		cmd.followUp({
            content: `Select all of the roles you'd like the user to have upon joining`,
            ephemeral: true,
            components: [
				new ActionRowBuilder().addComponents(
					new RoleSelectMenuBuilder()
						.setCustomId("join-roleOption")
						.setMinValues(1)
						.setMaxValues(20)
						.setPlaceholder(
							"Select all the roles you would like to add to new users"
						)
				).toJSON(),
			],
        });
	},

	/** @param {import("discord.js").GuildMember} member */
	async [Events.GuildMemberAdd](member, readGuildStore) {

		// @ts-ignore - addedStickyRoles is a property we set in higher priority modules
		if (!member.addedStickyRoles && readGuildStore.autoJoinRoles) {
			if (!member.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageRoles)) {
				Guilds.updateOne({ id: readGuildStore.id }, { 
					$set: { "autoJoinRoles": [] }
				})

			}
			if (readGuildStore.autoJoinRoles.length > 0) {
				readGuildStore.autoJoinRoles.forEach(roleId => {
					let myRole = member.guild.members.cache.get(client.user.id).roles.highest.position;
					var role = member.guild.roles.cache.find(r => r.id === roleId);
					if (role !== undefined && role !== null) {
						if (myRole > role.rawPosition) {
							member.roles.add(role);
						}
					}
				});
			}
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
	async [Events.InteractionCreate] (cmd) {
		if (!cmd.isRoleSelectMenu()) return;
		if (cmd.customId !== "join-roleOption") return;

		let myHighestRolePos = cmd.guild.members.cache.get(client.user.id).roles.highest.position;
		let goodRoles = [];
		let cantRoles = [];
		cmd.values.forEach(role => {
			if (myHighestRolePos <= cmd.roles.get(role).position) {
				cantRoles.push(cmd.roles.get(role).id);
			}
			else {
				goodRoles.push(cmd.roles.get(role).id);
			}
		});
		if (cantRoles.length > 0) {
			cmd.reply({
				ephemeral: true,
				content: 
					`I'm sorry, but I don't have a high enough permission to handle the following roles. If you'd like my help with these, go into Roles in the Server Settings, and drag a role I have above the roles you want me to manage.\n`+
					`<@&${cantRoles.join(">, <@&")}>`, 
			});
		}
		else {
			await guildByObj(cmd.guild, {
				autoJoinRoles: goodRoles
			})
			cmd.reply({content:`Alright, I will add these roles to new members: <@&${goodRoles.join(">, <@&")}>`,allowedMentions:{parse:[]},ephemeral:true});
		}
	}
};
