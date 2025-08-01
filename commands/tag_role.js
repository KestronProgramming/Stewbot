// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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
		command: new SlashCommandBuilder()
			.setName("tag_role")
			.setDescription("Give a role for applying the server Guild Tag.")
			.addRoleOption(option =>
				option
					.setName("role")
					.setDescription("The role to give to users applying the server tag")
					.setRequired(false)
			)
			.addBooleanOption(option =>
				option
					.setName("active")
					.setDescription("Enable or disable the tag role functionality")
					.setRequired(false)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

		help: {
			helpCategories: [Categories.Server_Only, Categories.Administration],
			shortDesc: "Configure the role that gets applied when someone sets your Guild Tag",
			detailedDesc:
				`Lets you set or clear a role that is automatically applied to users who apply your server tag. 
You can disable the feature using the \`active\` flag.`,
		},
	},

	/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
	async execute(cmd, context) {
        applyContext(context);

		if (!cmd.guild) {
			return cmd.reply("This feature must be run in a server. It assigns a role to be given to users who adopt the guild's tag.")
		}
        
		const role = cmd.options.getRole("role");
		const active = cmd.options.getBoolean("active");

		const guild = await guildByObj(cmd.guild);

		if (!role && active === null) {
			return cmd.followUp("Please provide either a role to set or toggle the active state.");
		}

		if (role) {
			const member = await cmd.guild.members.fetch(cmd.user.id);
			const userHighestRole = member.roles.highest;
			if (role.position >= userHighestRole.position && cmd.guild.ownerId !== cmd.user.id) {
				return cmd.followUp("You can only set a tag role that is lower than your highest role.");
			}
		}

		if (role) {
			guild.guildTagRole = role.id;
		}

		if (active !== null) {
			guild.guildTagRoleActive = active;
		}

		await guild.save();

		let response = [];
		if (role) {
			response.push(`Tag role set to ${role.toString()}`);
		}
		if (active !== null) {
			response.push(`Tag role is now ${active ? "enabled" : "disabled"}.`);
		}

		cmd.followUp(response.join("\n"));
	},
};
