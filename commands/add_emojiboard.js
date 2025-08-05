// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Component } = require("discord.js");
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

const { getEmojiFromMessage, parseEmoji } = require('../util');

function getStarMsg(msg){
	var starboardHeaders = [
		`Excuse me, there is a new message.`,
		`I have detected a notification for you.`,
		`Greetings, esteemed individuals, a new message has achieved popularity.`,
		`Here's the mail it never fails`,
		`Detected popularity. Shall I put it on screen for you?`,
		`And now it's time for a word from our sponsor.`,
		`Got a message for you.`,
		`It's always a good day when @ posts`
	];
	return `**${starboardHeaders[Math.floor(Math.random()*starboardHeaders.length)].replaceAll("@",msg.member?.nickname||msg.author?.globalName||msg.author?.username||"this person")}**`;
}

async function doEmojiboardReaction(react) {
    /**
    * Handle the information when a user reacts to a message, for emojiboards
    *
    * @param {MessageReaction } react: The reaction that was added
    * @param {import("./modules/database.js").RawGuildDoc } readGuild: Optional read-only guild DB
    * @returns {Promise<void>}
    */

    if (react.message.guildId == '0') return; // DMs patch

    const emoji = getEmojiFromMessage(
        react.emoji.requiresColons ?
            `<:${react.emoji.name}:${react.emoji.id}>` :
            react.emoji.name
    );

    const guild = await guildByID(react.message.guildId);
    const emojiboards = guild.emojiboards;

    // exit if the emojiboard for this emoji is not setup
    if (!emojiboards.has(emoji)) return;

    const emojiboard = emojiboards.get(emoji);
    if (!emojiboard.active) return;

    // Exit conditions
    if (!emojiboard.isMute) {
        // exit if this message has already been posted
        if (emojiboard.posted.has(react.message.id)) return;

        // Exit if the message is already an emojiboard post
        if (react.message.channel.id === emojiboard.channel) return;
    }

    const messageData = await react.message.channel.messages.fetch(react.message.id);
    const foundReactions = messageData.reactions.cache.get(react.emoji.id || react.emoji.name);
    const selfReactions = react.message.reactions.cache.filter(r => r.users.cache.has(react.message.author.id) && r.emoji.name === react.emoji.name)

    // exit if we haven't reached the threshold
    if ((emojiboard.threshold + selfReactions.size) > foundReactions?.count) {
        return;
    }

    if (emojiboard.isMute) {
        var member = messageData.guild.members.cache.get(messageData.author.id);
        if (member === null || member === undefined) {
            member = await messageData.guild.members.fetch(messageData.author.id);
        }
        if (member === null || member === undefined) {
            return;
        }
        if (!member.bannable || !messageData.guild.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ModerateMembers) || member.bot || member.permissions.has(PermissionFlagsBits.Administrator)) {
            return;
        }
        try {
            member.timeout(emojiboard.length, `I was configured with /groupmute_config to do so.`).catch(e => { });
        }
        catch (e) { }
        return;//If it's a groupmute, don't bother with emojiboard stuff.
    }

    var replyBlip = "";
    if (messageData.type === 19) {
        try {
            var refMessage = await messageData.fetchReference();
            replyBlip = `_[Reply to **${refMessage.author.username}**: ${refMessage.content.slice(0, 22).replace(/(https?\:\/\/|\n)/ig, "")}${refMessage.content.length > 22 ? "..." : ""}](<https://discord.com/channels/${refMessage.guild.id}/${refMessage.channel.id}/${refMessage.id}>)_`;
        } catch (e) { }
    }

    const resp = { files: [] };
    var i = 0;
    react.message.attachments.forEach((attached) => {
        let url = attached.url.toLowerCase();
        if (i !== 0 || (!url.includes(".jpg") && !url.includes(".png") && !url.includes(".jpeg") && !url.includes(".gif")) || emojiboard.messType === "0") {
            resp.files.push(attached.url);
        }
        i++;
    });

    if (emojiboard.messType === "0") {
        resp.content = react.message.content;
        resp.username = react.message.author.globalName || react.message.author.username;
        resp.avatarURL = react.message.author.displayAvatarURL();
        var c = client.channels.cache.get(emojiboard.channel);
        if (!c.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ManageWebhooks)) {
            emojiboard.messType = "2";
            guild.save();
            return;
        }
        var hook = await c.fetchWebhooks();
        hook = hook.find(h => h.token);
        if (hook) {
            let response = await hook.send(resp);
            emojiboard.posted.set(react.message.id, `webhook${response.id}`);
        }
        else {
            const hook = await client.channels.cache.get(emojiboard.channel).createWebhook({
                name: config.name,
                avatar: config.pfp,
            });
            
            let response = await hook.send(resp);
            emojiboard.posted.set(react.message.id, `webhook${response.id}`);
        }
    }
    else {
        const emojiURL = (
            react.emoji.requiresColons ?
                (
                    react.emoji.animated ?
                        `https://cdn.discordapp.com/emojis/${react.emoji.id}.gif` :
                        `https://cdn.discordapp.com/emojis/${react.emoji.id}.png`
                ) :
                undefined
        )

        resp.embeds = [new EmbedBuilder()
            .setColor(0x006400)
            .setTitle("(Jump to message)")
            .setURL(`https://www.discord.com/channels/${react.message.guild.id}/${react.message.channel.id}/${react.message.id}`)
            .setAuthor({
                name: react.message.author.globalName || react.message.author.username,
                iconURL: react.message.author.displayAvatarURL(),
                url: `https://discord.com/users/${react.message.author.id}`
            })
            .setDescription(`${replyBlip ? `${replyBlip}\n` : ""}${react.message.content ? react.message.content : "⠀"}`)
            .setTimestamp(new Date(react.message.createdTimestamp))
            .setFooter({
                text: `${!emojiURL ? react.emoji.name + ' ' : ''}${react.message.channel.name}`,
                iconURL: emojiURL
            })
            .setImage(react.message.attachments.first() ? react.message.attachments.first().url : null)
        ];
        if (emojiboard.messType === "1") {
            resp.content = getStarMsg(react.message);
        }
        var c = client.channels.cache.get(emojiboard.channel)
        if (!c.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageWebhooks)) {
            emojiboard.active = false;
            guild.save();
            return;
        }
        const d = await c.send(resp);
        emojiboard.posted.set(react.message.id, d.id);
    }
    
    if (!guild.emojiboards.get(emoji).posters.get(react.message.author.id)) {
        guild.emojiboards.get(emoji).posters.set(react.message.author.id, 0);
    }

    guild.emojiboards.get(emoji).posters.set(react.message.author.id, guild.emojiboards.get(emoji).posters.get(react.message.author.id) + 1);
    guild.save();
}

module.exports = {
	getStarMsg,
	
	data: {
		// Slash command data
		command: new SlashCommandBuilder()
		.setContexts(
			IT.Guild,          // Server command
			// IT.BotDM,          // Bot's DMs
			// IT.PrivateChannel, // User commands
		)
		.setIntegrationTypes(
			AT.GuildInstall,   // Install to servers
			// AT.UserInstall     // Install to users
		)
		.setName("add_emojiboard").setDescription("Create a new emojiboard")
			.addStringOption(option=>
				option.setName("emoji").setDescription("The emoji to react with to trigger the emojiboard").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("The channel to post the emojiboard in").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addIntegerOption(option=>
				option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)").setMinValue(1)
			).addStringOption(option=>
				option.setName("message_type").setDescription("What should the bot's starboard posts look like?").addChoices(
					{"name":"Make it look like the user posted","value":"0"},
					{"name":"Post an embed with the message and a greeting","value":"1"},
					{"name":"Post an embed with the message","value":"2"}
				)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
		
		// Optional fields
		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Configuration, Categories.Entertainment, Categories.Server_Only],
			shortDesc: "Create a new emojiboard",
			detailedDesc: 
				`Adds an emojiboard for Stewbot to run. If the emoji you choose is reacted enough times on a message (configurable threshold), then it will be posted to a highlights reel channel of your choosing.\n
				You can choose if Stewbot should display a random message and an embed with the message, just an embed with the message, or use webhooks to appear as if the user who originally made the post in question posted it there themselves.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);		
		
		var emoji = getEmojiFromMessage(cmd.options.getString("emoji"));
		if(!emoji) {
			cmd.followUp("That emoji is not valid.");
			return;
		}
		if(guild.groupmute===emoji) {
			cmd.followUp(`That emoji is in use for groupmute.`);
			return;
		}
		if(guild.emojiboards.has(emoji)) {
			cmd.followUp(`That emoji already has an emojiboard.`);
			return;
		}
		guild.emojiboards.set(emoji, {
			channel: cmd.options.getChannel("channel").id,
			active: true,
			threshold: cmd.options.getInteger("threshold") || 3,
			messType: cmd.options.getString("message_type"),
			posted: {},
			posters: {}
		});
		await guild.save();

		cmd.followUp("Emojiboard for " + parseEmoji(emoji) + " emoji added.");
    },

	async [Events.MessageReactionAdd] (react, user, details, readGuild, readGuildUser) {
		if (react.message.guildId === null) return;

        // OPTIMIZE: we can save a DB query on reactions if we make this use the passed readonly guild.
		doEmojiboardReaction(react);
	}
};
