// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { ContextMenuCommandBuilder, AttachmentBuilder, ApplicationCommandType, ActionRowBuilder, PermissionFlagsBits, ChannelSelectMenuBuilder, ChannelType, MessageType, GuildMember } = require("discord.js");
function applyContext(context = {}) {
	for (const key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const config = require("../data/config.json");

module.exports = {
	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("move_message").setType(ApplicationCommandType.Message),

		// Optional fields

		extra: {
			"contexts": [0], "integration_types": [0],
			"desc": "Move a message from one channel into another"
		},

		requiredGlobals: [],

		deferEphemeral: true,

		help: {
			helpCategories: [Categories.Administration, Categories.Server_Only, Categories.Context_Menu],
			shortDesc: "Move a message from one channel into another",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This command will have Stewbot take a message and move it to a different channel. This command is accessed from the context menu, which on mobile is accessed by holding down on a message or on desktop by right clicking, and then pressing "Apps".`
		},
	},

    /** @param {import('discord.js').ContextMenuCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		if (!cmd.isMessageContextMenuCommand()) return; // Should not

		const botMember = cmd.guild?.members?.me ?? cmd.guild?.members?.cache?.get(client.user.id);
		if (!botMember) {
			await cmd.followUp("I cannot determine my permissions in this server.");
			return;
		}

		if (!botMember.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
			await cmd.followUp("I do not have the `MANAGE_WEBHOOKS` permission, so I cannot move this message.");
			return;
		}
		
		if (
			cmd.member instanceof GuildMember && 
			(
				cmd.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
				cmd.user.id === cmd.targetMessage.author.id
			)
		) {
			cmd.followUp({
                content: `Where do you want to move message \`${cmd.targetMessage.id}\` by **${cmd.targetMessage.author.username}**?`,
                ephemeral: true,
                components: [
					new ActionRowBuilder().addComponents(
						new ChannelSelectMenuBuilder()
							.setCustomId("move-message")
							.setChannelTypes(ChannelType.GuildText)
							.setMaxValues(1)
							.setMinValues(1)
					).toJSON()
				],
			});
		}
		else {
			cmd.followUp(`To use this command, you need to either be the one to have sent the message, or be a moderator with the MANAGE MESSAGES permission.`);
		}
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["move-message"],
	
    /** @param {import('discord.js').ButtonInteraction | import('discord.js').AnySelectMenuInteraction | import('discord.js').ModalSubmitInteraction } cmd */
    async onbutton(cmd, context) {
		applyContext(context);
		
		if (cmd.isModalSubmit()) return;
		if (cmd.isButton()) return;

		// Select Menus
		const targetChannel = client.channels.cache.get(cmd.values[0]);
		if (!targetChannel || !targetChannel.isTextBased?.()) {
			await cmd.update({ content: "Cannot move the message to the selected channel.", components: [] });
			return;
		}

		const botMember = cmd.guild?.members?.me ?? cmd.guild?.members?.cache?.get(client.user.id);
		if (
			!targetChannel.isTextBased?.()|| 
			!("guild" in targetChannel) ||
			!("createWebhook" in targetChannel) ||
			!botMember?.permissionsIn(targetChannel).has(PermissionFlagsBits.ManageWebhooks)
		) {
			await cmd.update({ content: "I do not have permission to create webhooks in that channel.", components: [] });
			return;
		}

		const sourcePerms = botMember.permissionsIn(cmd.channel);
		if (!sourcePerms.has(PermissionFlagsBits.ViewChannel)) {
			await cmd.update({ content: "I can no longer view the original channel to move this message.", components: [] });
			return;
		}

		const msg = await cmd.channel.messages.fetch(cmd.message.content.split("`")[1]);
		const resp = { files: [] };
		let replyBlip = "";
		if (msg.type === MessageType.Reply) {
			try {
				const rMsg = await msg.fetchReference();
				replyBlip = `_[Reply to **${rMsg.author.username}**: ${rMsg.content.slice(0,22).replace(/(https?:\/\/|\n)/ig,"")}${rMsg.content.length>22?"...":""}](<https://discord.com/channels/${rMsg.guild.id}/${rMsg.channel.id}/${rMsg.id}>)_\n`;
			} catch (err) {
				replyBlip = "";
			}
		}
		resp.content=`\`\`\`\nThis message has been moved from ${cmd.channel.name} by Stewbot.\`\`\`${replyBlip}${msg.content}`;
		resp.username=msg.member?.nickname||msg.author.globalName||msg.author.username;
		resp.avatarURL=msg.author.displayAvatarURL();
		let p=0;
		const files = [];
		for (const attachment of msg.attachments.values()) {
			const parts = attachment.url.split("?")[0].split(".");
			const extension = parts[parts.length-1];
			await fetch(attachment.url).then(d=>d.arrayBuffer()).then(d=>{
				const fileName = `${p}.${extension}`;
				const moveAttachment = new AttachmentBuilder(Buffer.from(d), { name: fileName });
				files.push(moveAttachment)
			});
			p++;
		}
		resp.files = files;
		let webhooks = await targetChannel.fetchWebhooks();
		let hook = webhooks.find(h => h.token);
		if (hook) {
			await hook.send(resp);
		}
		else {
			const newHook = await targetChannel.createWebhook({
				name: config.name,
				avatar: config.pfp,
			});
			await newHook.send(resp);
		}
		if (sourcePerms.has(PermissionFlagsBits.ManageMessages) && msg.deletable) {
			await msg.delete();
		}
		await cmd.update({"content":"\u200b",components:[]});
	}
};
