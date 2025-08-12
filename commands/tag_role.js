// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

async function checkTagUpdate(packet) {
    if (packet.t !== 'GUILD_MEMBER_UPDATE') return;

    // Monitor guild tags to apply a given role to all users who apply the tag. This is not yet supported by discord.js so we have to do it ourself
    const guildFromPacket = packet.d.guild_id;
    const clan = packet?.d?.user?.clan || packet?.d?.user?.primary_guild;
    const tagInUse = clan?.identity_guild_id;
    const isGuildsTag = guildFromPacket == tagInUse;

    const guild = await guildByID(guildFromPacket);

    if (guild.guildTagRole && guild.guildTagRoleActive) {
        // If the guild is set to apply tags
        
        const discordGuild = await client.guilds.fetch(guildFromPacket).catch(e => null);
        if (discordGuild) {
            try {
                const member = await discordGuild.members.fetch(packet.d.user.id);
                const role = discordGuild.roles.cache.get(guild.guildTagRole);
                const memberHasRole = member.roles.cache.get(role.id);
                if (member && role) {
                    if (isGuildsTag && !memberHasRole) 
                        await member.roles.add(role, "Applied for adopting Guild Tag");
                    
                    if (!isGuildsTag && memberHasRole)
                        await member.roles.remove(role, "Removed for removing Guild Tag");
                }
            } catch (e) { console.log(e); }
        }
    }
}

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


		let response = [];
		if (role) {
			response.push(`Tag role set to ${role.toString()}`);
		}
		if (active !== null) {
			response.push(`Tag role is now ${active ? "enabled" : "disabled"}.`);
		}

		cmd.followUp(response.join("\n"));

		await guild.save();
	},

	async [Events.Raw] (packet) {
		checkTagUpdate(packet);
	},
};
