// #region CommandBoilerplate
const CategoriesEnum = require("./modules/Categories");
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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

// 
// TEMPLATE.js is an exhaustive template showcasing every feature available to modules.
//  Any module/command can be derived from these.
// 


module.exports = {
	data: {
		command: new SlashCommandBuilder().setName("pin").setDescription("Allow users to pin messages without giving them deletion permissions")
			.addSubcommand(command=>
				command.setName("config").setDescription("Configure pin settings")
					.addBooleanOption(option=>
						option.setName("disable").setDescription("Stop allowing users with the role to pin messages.")
					)
					.addRoleOption(option=>
						option.setName("role").setDescription("The role that can pin messages")
					)
					.addBooleanOption(option=>
						option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					)
			)
			.addSubcommand(command=>
				command.setName("add").setDescription("Pin a message").addStringOption(option=>
					option.setName("message").setDescription("The ID or link to the message").setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			)
			.addSubcommand(command=>
				command.setName("remove").setDescription("Unpin a message").addStringOption(option=>
					option.setName("message").setDescription("The ID or link to the message").setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			),
		
		help: {
			helpCategories: [ Categories.Configuration, Categories.Administration, Categories.Server_Only ],
			shortDesc: "Allow users to pin messages without giving them deletion permissions",
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`On Discord, the \`Manage Messages\` permission allows users to pin messages, however it also allows them to delete messages.\n
				This command allows users with a given role to pin messages without granting them permission to delete messages.\n
				Run the \`config\` subcommand to set it up.`,
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const subcommand = cmd.options.getSubcommand();
		const guild = await cmd.guild.fetch();
		const userInServer = await guild.members.fetch(cmd.user.id);

		// Configure
		if (subcommand == "config") {
			if (
				!userInServer.permissions.has(PermissionFlagsBits.ManageRoles) ||
				!userInServer.permissions.has(PermissionFlagsBits.ManageMessages)
			) return cmd.followUp("You must have `Manage_Messages` and `Manage Roles` permissions to configure pins.")
			
			const role = cmd.options.getRole("role");

			await guildByObj(cmd.guild, {
				"pinners": role.id
			});

			return cmd.followUp(`That role is now set as the pinner role. Users with that role can pin messages with ${cmds.pin.add.mention}`)
		}

		// Actually pin
		const message = cmd.options.getString("message");
		const messageId = message.startsWith("http") ? message.split("/").pop() : message;

		const allowedRole = await Guilds.findOne({ id: cmd.guild.id })
			.select("pinners")
			.lean()

		const userHasAllowedRole = allowedRole.pinners && userInServer.roles.cache.some(role => role.id === allowedRole.pinners)

		if ( userInServer.permissions.has(PermissionFlagsBits.ManageMessages) || userHasAllowedRole ) {
			const botMember = await guild.members.fetch(cmd.client.user.id);

			if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
				return cmd.followUp("I don't have permission to pin messages. Please ensure I have the `Manage Messages` permission.");
			}

			const targetMessage = await cmd.channel.messages.fetch(messageId).catch(e => null);
			if (!targetMessage) {
				return cmd.followUp("Sorry, I couldn't find that message");
			}

			const pinning = subcommand == "add"; 

			const actionMsg = pinning ? "Message pinned" : "Message unpinned";

			await targetMessage[pinning ? "pin" : "unpin"](`${actionMsg} by ${cmd.user.username}`);
			return cmd.followUp(actionMsg);
		}
		
		cmd.followUp(`Sorry, you don't have permission to manage pins.`);
	},

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {GuildUserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context) {
		applyContext(context);
		// `context` currently does not respect requested globals
	},

	async autocomplete(cmd) {

	},

	async daily(context) {
		applyContext(context);
		
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["example", /example/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		
	}
};
