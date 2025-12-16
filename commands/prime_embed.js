// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Embed } = require("discord.js");
function applyContext(context = {}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { isDirty, censor } = require("./filter");

/** @returns {Promise<EmbedBuilder>} */
async function getPrimedEmbed(userId, guildIn){
	const user = await userByID(userId);
	const mes = user?.primedEmbed;

	if (!mes) {
		return new EmbedBuilder()
			.setColor(0xff0000)
			.setTitle("Blocked")
			.setDescription("No primed message found.");
	}

	const blocked = await Promise.all([
		isDirty(mes.content, guildIn),
		isDirty(mes.author.name, guildIn),
		isDirty(mes.server.name, guildIn),
		isDirty(mes.server.channelName, guildIn)
	]);

	if (blocked.some(Boolean)) {
		return new EmbedBuilder()
			.setColor(0xff0000)
			.setTitle("Blocked")
			.setDescription("I cannot embed that message due to this server's filter.");
	}

	let emb=new EmbedBuilder()
		.setColor("#006400")
		.setAuthor({
			name: mes.author.name,
			iconURL: "" + mes.author.icon,
			url: "https://discord.com/users/" + mes.author.id
		})
		.setDescription(await censor(mes.content) || null)
		.setTimestamp(new Date(mes.timestamp))
		.setFooter({
			text: `${mes.server.name} / ${mes.server.channelName}`,
			iconURL: mes.server.icon || undefined
		});
	if(mes.server.channelId){
		emb=emb.setTitle("(Jump to message)")
			.setURL(`https://discord.com/channels/${mes.server.id}/${mes.server.channelId}/${mes.id}`);
	}
	return emb;
}

module.exports = {
	getPrimedEmbed,

	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("prime_embed").setType(ApplicationCommandType.Message),

		// Optional fields

		extra: {
			"contexts": [0, 1, 2], "integration_types": [0, 1],
			"desc": "Get a message ready to be embedded using /embed_message"
		},

		requiredGlobals: [],

		deferEphemeral: true,
		
		help:{
			helpCategories: [Categories.Information, Categories.General, Categories.Entertainment, Categories.Context_Menu],
			shortDesc: "Get a message ready to be embedded with /embed_message",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				// @ts-ignore
				`After using this command on a message, you can type PRIMED into ${cmds.embed_message.mention} to have the bot embed it. This can be used for DMs, or servers the bot doesn't share with you if you install it to use anywhere. (Press the bot's PFP, then select "Add App", and then "Use it Everywhere"). This is a context menu command, which can be accessed by holding down on a message on mobile, or right clicking on desktop, and then selecting "Apps".`
		}
	},

    /** @param {import('discord.js').MessageContextMenuCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		if (!cmd.isMessageContextMenuCommand()) return;

		const primedEmbed = {
			"content": cmd.targetMessage.content,
			"timestamp": cmd.targetMessage.createdTimestamp,
			"author": {
				"icon": cmd.targetMessage.author.displayAvatarURL(),
				"name": cmd.targetMessage.author.globalName || cmd.targetMessage.author.username,
				"id": cmd.targetMessage.author.id
			},
			"server": {
				// @ts-ignore
				"channelName": cmd.targetMessage.channel?.name ? cmd.targetMessage.channel.name : (cmd.targetMessage.author.globalName || cmd.targetMessage.author.username),
				"name": cmd.targetMessage.guild?.name ? cmd.targetMessage.guild.name : "",
				"channelId": cmd.targetMessage.channel?.id,
				"id": cmd.targetMessage.guild?.id ? cmd.targetMessage.guild.id : "@me",
				"icon": cmd.targetMessage.guild ? cmd.targetMessage.guild.iconURL() : cmd.targetMessage.author.displayAvatarURL()
			},
			"id": cmd.targetMessage.id,
			"attachmentURLs": []
		};
		cmd.targetMessage.attachments.forEach(a => {
			primedEmbed.attachmentURLs.push(a.url);
		});

		await Users.updateOne(
			{ id: cmd.user.id },
			{
				$set: { primedEmbed: primedEmbed }
			},
			{ upsert: true }
		);

		cmd.followUp({ 
			// @ts-ignore
			content: `I have prepared the message to be embedded. Use ${cmds.embed_message.mention} and type **PRIMED** to embed this message.`, 
			embeds: [
				await getPrimedEmbed(cmd.user.id, cmd.guild)
			], 
			files: primedEmbed.attachmentURLs
		});
	}
};
