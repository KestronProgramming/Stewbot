// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

// If a custom emoji exists in the message, extract it's name and URL.
function getEmojiData(emoji) {
	const matches = emoji?.match?.(/<(a)?:([\w~_]+):(\d+)>/);
	const animated = Boolean(matches?.[1]);
	const emojiName = matches?.[2];
	const emojiId = matches?.[3];
	let url = null;
	if (emojiId) {
		url = `https://cdn.discordapp.com/emojis/${emojiId}.${animated?"gif":"png"}`; //ɡɪf/
	}
	return {url, emojiName};
}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder()
					.setName('clone_emoji')
					.setDescription('Upload an emoji from another server to this one')
					.addStringOption(option =>
						option.setName("action").setDescription("The action to preform").setChoices(
							{ name: "Prime emoji", value: "prime_emoji" },
							{ name: "Clone from primed emoji", value: "clone_primed" },
							{ name: "Clone from primed_embed", value: "clone_embed" },
							{ name: "Clone from direct emoji (nitro)", value: "direct_clone" },
						).setRequired(true)
					)
					.addStringOption(option=>
                        option
                            .setName("emoji")
                            .setDescription("The emoji if priming / direct cloning")
                            .setRequired(false)
                    ),
		
		requiredGlobals: [],

		help: {
			helpCategory: "Administration",
			helpDesc: "Add emojis from other servers",
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		const action = cmd.options.getString("action");
		const emoji = cmd.options.getString("emoji");
		
		// Error checking all at once
		if ([
			"direct_clone", 
			"clone_primed", 
			"clone_embed",
		].includes(action)) {
			if (!cmd.guild) {
				return cmd.followUp(`I must be installed in this server to add emojis. If you need to add me, you can use [this link](${config.install})`);
			}
			if (!(await cmd.guild.members.fetch(cmd.user.id)).permissions?.has(PermissionFlagsBits.CreateGuildExpressions)) {
				return cmd.followUp(`You must have permission to upload emojis to run this command.`);
			}
			if (!cmd.guild.members.me.permissions.has(PermissionFlagsBits.CreateGuildExpressions)) {
				return cmd.followUp(`I must have permission to upload emojis to use this feature.`);
			}
		}
	
		try {
			switch (action) {
				case "prime_emoji":
					delete storage[cmd.user.id].primedEmojiURL;
					delete storage[cmd.user.id].primedName;

					var {url, emojiName} = getEmojiData(emoji);

					if (!emoji) {
						return cmd.followUp("Please provide a server emoji with these options.");
					}
					else if (!url) {
						return cmd.followUp("This does not appear to be valid server emoji.");
					}
					storage[cmd.user.id].primedEmojiURL = url;
					storage[cmd.user.id].primedName = emojiName || "unnamed";
					return cmd.followUp(`Emoji primed. Use it in a server with ${cmds.clone_emoji.mention}`);

				case "clone_primed":
					const primedURL = storage[cmd.user.id].primedEmojiURL;
					const primedName = storage[cmd.user.id].primedName;
					if (!primedURL) {
						return cmd.followUp("You have not primed an emoji yet. Run this command with the `Prime emoji` option in another server to clone the emoji, and run this here again to upload the emoji.");
					}
					const newEmoji = await cmd.guild.emojis.create({
						attachment: primedURL,
						name: primedName
					});
					return cmd.followUp(`Emoji cloned: ${newEmoji}`)

				case "clone_embed":
					const primedContent = storage[cmd.user.id].primedEmbed?.content;
					if (!primedContent) {
						return cmd.followUp(`You haven't primed any messages. To do this, install [Stewbot](${config.install}) ("Add to My Apps"), right-click a message > Apps > \`prime_embed\`.`)
					}

					var {url, emojiName} = getEmojiData(primedContent);
					if (!url) {
						return cmd.followUp("The primed message does not appear to have a valid server emoji.");
					}
					const newEmoji2 = await cmd.guild.emojis.create({
						attachment: url,
						name: emojiName || "unnamed"
					});
					return cmd.followUp(`Emoji cloned: ${newEmoji2}`)

				case "direct_clone":
					var {url, emojiName} = getEmojiData(emoji);
					if (!url) {
						return cmd.followUp("The primed message does not appear to have a valid server emoji.");
					}
					const newEmoji3 = await cmd.guild.emojis.create({
						attachment: url,
						name: emojiName || "unnamed"
					});
					return cmd.followUp(`Emoji cloned: ${newEmoji3}`)

			}
		} catch (e) {
			notify(1, "Caught clone_emoji error: "+e);
			try{ cmd.followUp(`There seems to have been an error, perhaps the message had an invalid emoji?`); }catch{}
		}
	}
};
