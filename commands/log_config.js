// #region CommandBoilerplate
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

const LRUCache = require("lru-cache").LRUCache;
const ms = require("ms");
const { limitLength } = require("../utils.js")

// Temporarily caches old user profiles. See comment under [Events.UserUpdate]
const oldProfileCache = new LRUCache({ ttl: ms("30s") })

async function logGuildMemberUpdate(packet) {
    // This function takes a `GUILD_MEMBER_UPDATE` packet,
    //   and posts about diffs between what the user is and what the user was
    //   *globally*. Only global diffs are posted about by this function.
    // Guild-user diffs are handled by the `guildMemberUpdate` function.
    // This function is here because discord.js does not pass `guildMemberUpdate` update
    //   events when the event is global.
    if (packet.t !== 'GUILD_MEMBER_UPDATE') return;

    // Wait for 5 seconds to make sure we have the old profile from other events
    await new Promise(resolve => setTimeout(resolve, ms("5s")));

    const packetUser = packet.d?.user;
    const cachedUser = oldProfileCache.get(packetUser.id)
    const guildId = packet.d?.guild_id;
    if (!packetUser || !guildId || !cachedUser) return;

    // Remove this user since we already logged the event for them
    oldProfileCache.delete(packetUser.id);

    // Fetch logging channel
    const [logChannelId] = await Guilds.find({
        id: guildId,
        "logs.user_change_events": true
    }).distinct("logs.channel");
    if (!logChannelId) return;

    // Normalize old/new fields
    const oldData = {
        username: cachedUser?.username ?? "[Unknown]",
        global_name: cachedUser?.globalName ?? "[Unknown]",
        avatar: cachedUser?.avatar ?? null,
        banner: cachedUser?.banner ?? null,
    };

    const newData = {
        username: packetUser.username ?? "[Unknown]",
        global_name: packetUser.global_name ?? "[Unknown]",
        avatar: packetUser.avatar ?? null,
        banner: packetUser.banner ?? null,
    };

    const trackedFields = [
        { key: "username", label: "Username" },
        { key: "global_name", label: "Global Name" },
    ];

    const diffs = [];

    // CDN builders
    function cdnAssetURL(type, userId, hash) {
        if (!hash) return null;
        const ext = hash.startsWith("a_") ? "gif" : "png";
        return `https://cdn.discordapp.com/${type}/${userId}/${hash}.${ext}?size=256`;
    }
    const avatarURL = (id, hash) => cdnAssetURL("avatars", id, hash);
    const bannerURL = (id, hash) => cdnAssetURL("banners", id, hash);

    // Generic diff builder
    function diffField(field, label, inline = true, formatter = (a, b) => `\`${a}\` → \`${b}\``) {
        if (oldData[field] !== newData[field]) {
            diffs.push({
                name: label,
                value: formatter(oldData[field], newData[field]),
                inline
            });
        }
    }

    for (const { key, label } of trackedFields) {
        diffField(key, label);
    }

    // Special: Avatar diff
    if (oldData.avatar !== newData.avatar) {
        const oldUrl = avatarURL(packetUser.id, oldData.avatar);
        const newUrl = avatarURL(packetUser.id, newData.avatar);
        diffs.push({
            name: "Avatar",
            value: `${oldUrl ? `[Old](${oldUrl})` : "`[None\\Unknown]`"} → ${newUrl ? `[New](${newUrl})` : "`[None]`"}`,
            inline: false
        });
    }

    // Special: Banner diff
    if (oldData.banner !== newData.banner) {
        const oldUrl = bannerURL(packetUser.id, oldData.banner);
        const newUrl = bannerURL(packetUser.id, newData.banner);
        diffs.push({
            name: "Banner",
            value: `${oldUrl ? `[Old](${oldUrl})` : "`[None]`"} → ${newUrl ? `[New](${newUrl})` : "`[None]`"}`,
            inline: false
        });
    }

    if (diffs.length === 0) return;

    // Channel + permission check
    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
        await Guilds.updateOne({ id: guildId }, { "logs.user_change_events": false });
        return;
    }

    const thumb = avatarURL(packetUser.id, newData.avatar) || client.user.displayAvatarURL();

    await channel.send({
        content: `**User <@${packetUser.id}> updated their global profile**`,
        embeds: [{
            type: "rich",
            title: "Global Profile Update",
            description: `**${newData.username}** (${newData.global_name !== "[Unknown]" ? newData.global_name : "no global name"})`,
            color: cachedUser?.accentColor ?? 0x006400,
            fields: diffs,
            thumbnail: { url: thumb },
            url: `https://discord.com/users/${packetUser.id}`
        }],
        allowedMentions: { parse: [] }
    });

}

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("log_config").setDescription("Configure log events")
			.addBooleanOption(option=>
				option.setName("active").setDescription("Log server and user events to the designated channel?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel to post events to?").addChannelTypes(ChannelType.GuildText).setRequired(true)
			).addBooleanOption(option=>
				option.setName("channel_events").setDescription("Log channel events?")
			).addBooleanOption(option=>
				option.setName("emoji_events").setDescription("Log emoji and sticker events?")
			).addBooleanOption(option=>
				option.setName("user_change_events").setDescription("Log user changes?")
			).addBooleanOption(option=>
				option.setName("joining_and_leaving").setDescription("Log when a user joins/leaves?")
			).addBooleanOption(option=>
				option.setName("invite_events").setDescription("Log when an invite is made or deleted?")
			).addBooleanOption(option=>
				option.setName("role_events").setDescription("Log role events?")
			).addBooleanOption(option=>
				option.setName("mod_actions").setDescription("Log when a moderator performs an action")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			).setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Information, Categories.Administration, Categories.Configuration, Categories.Server_Only],
			shortDesc: "Configure log events",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure an amount of events you want Stewbot to automatically notify you of in a configurable channel for moderation and administration purposes.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

		const guild = await guildByObj(cmd.guild);
		
		guild.logs.active=cmd.options.getBoolean("active");
		guild.logs.channel=cmd.options.getChannel("channel").id;
		if(cmd.options.getBoolean("channel_events")!==null) guild.logs.channel_events=cmd.options.getBoolean("channel_events");
		if(cmd.options.getBoolean("emoji_events")!==null) guild.logs.emoji_events=cmd.options.getBoolean("emoji_events");
		if(cmd.options.getBoolean("user_change_events")!==null) guild.logs.user_change_events=cmd.options.getBoolean("user_change_events");
		if(cmd.options.getBoolean("joining_and_leaving")!==null) guild.logs.joining_and_leaving=cmd.options.getBoolean("joining_and_leaving");
		if(cmd.options.getBoolean("invite_events")!==null) guild.logs.invite_events=cmd.options.getBoolean("invite_events");
		if(cmd.options.getBoolean("role_events")!==null) guild.logs.role_events=cmd.options.getBoolean("role_events");
		if(cmd.options.getBoolean("mod_actions")!==null) guild.logs.mod_actions=cmd.options.getBoolean("mod_actions");
		var disclaimers=[];

		if(!client.channels.cache.get(guild.logs.channel).permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)){
			guild.logs.active=false;
			disclaimers.push(`I can't post in the specified channel, so logging is turned off.`);
		}

		await guild.save();

		cmd.followUp(`Configured log events.${disclaimers.map(d=>`\n\n${d}`).join("")}`);
	},

	async [Events.UserUpdate] (oldUser, newUser) {
		// To log global changes, we need the original member, which is only provided in the user update event.
		// We then broadcast this data to individual servers that trigger the `GUILD_MEMBER_UPDATE` event. 
		// See the comment under the `logGuildMemberUpdate` function
		oldProfileCache.set(`${oldUser.id}`, structuredClone(oldUser));
	},

	async [Events.Raw] (packet) {
		logGuildMemberUpdate(packet);
	},

	//#region EventLoggers
	//Repetitive, strictly log-based events

	async [Events.GuildMemberAdd](member, guildStore) {
		if (guildStore.logs.active && guildStore.logs.joining_and_leaving) {
			client.channels.cache.get(guildStore.logs.channel)
				.send({ 
					content: `**<@${member.id}> (${member.user.username}) has joined the server.**`, 
					allowedMentions: { parse: [] }
				})
				.catch(e => null);
		}
	},

	async [Events.GuildMemberRemove](member, guildStore) {
		// Logs
		if (guildStore.logs.active && guildStore.logs.joining_and_leaving) {
			var bans = await member.guild.bans.fetch();
			var c = client.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send({ content: `**<@${member.id}> (${member.user.username}) has ${bans.find(b => b.user.id === member.id) ? "been banned from" : "left"} the server.**${bans.find(b => b.user.id === member.id)?.reason !== undefined ? `\n${bans.find(b => b.user.id === member.id)?.reason}` : ""}`, allowedMentions: { parse: [] } });
			}
			else {
				await Guilds.updateOne({ id: guildStore.id }, {
					$set: { "logs.active": false }
				})
			}
		}
	},

	async [Events.MessageDelete] (msg, guildStore) {
		if(!msg.guild?.id) return;
		
		if (guildStore?.logs?.mod_actions && guildStore.logs.active) {
			if (msg.guild?.members.cache.get(client.user.id).permissions.has(PermissionFlagsBits.ViewAuditLog)) {

				// Wait for audit log to propagate
				setTimeout(async () => {
					const fetchedLogs = await msg.guild.fetchAuditLogs({
						type: AuditLogEvent.MessageDelete,
						limit: 1,
					});
					const firstEntry = fetchedLogs.entries.first();
					if (!firstEntry) return;
					firstEntry.timestamp = BigInt("0b" + BigInt(firstEntry.id).toString(2).slice(0, 39)) + BigInt(1420070400000);
					if (firstEntry.target.id === msg?.author?.id && BigInt(Date.now()) - firstEntry.timestamp < BigInt(60000)) {
						var c = msg.guild.channels.cache.get(guildStore.logs.channel);
						if (c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
							c.send({ content: limitLength(`**Message from <@${firstEntry.target.id}> Deleted by <@${firstEntry.executor.id}> in <#${msg.channel.id}>**\n\n${msg.content.length > 0 ? `\`\`\`\n${msg.content}\`\`\`` : ""}${msg.attachments?.size > 0 ? `There were **${msg.attachments.size}** attachments on this message.` : ""}`), allowedMentions: { parse: [] } });
						}
						else {
							await Guilds.updateOne({ id: guildStore.id }, {
								$set: { "logs.active": false }
							})
						}
					}
				}, 2000);

			}
			else {
				// We can't see the audit log, so turn this off
				await Guilds.updateOne({ id: guildStore.id }, {
					$set: { "logs.mod_actions": false }
				})
				// TODO: make a post noting this
			}
		}
	},
	
	async [Events.ChannelDelete] (channel) {
		const guildStore = await guildByObj(channel.guild);
		if (guildStore.logs.active && guildStore.logs.channel_events) {
			var c = channel.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Channel \`${channel.name}\` Deleted**`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.ChannelUpdate] (channelO, channel) {
		const guildStore = await guildByObj(channel.guild);
		if (guildStore.logs.active && guildStore.logs.channel_events) {
			var diffs = [];
			var caredAboutDiffs = ["name", "nsfw", "topic", "parentId", "rateLimitPerUser"];
			Object.keys(channelO).forEach(key => {
				if (channelO[key] !== channel[key] && caredAboutDiffs.includes(key)) {
					diffs.push(key);
				}
			});
			if (diffs.length > 0) {
				var c = channel.guild.channels.cache.get(guildStore.logs.channel);
				if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					var rls = {
						"0": "None",
						"5": "5s",
						"10": "10s",
						"15": "15s",
						"30": "30s",
						"60": "1m",
						"120": "2m",
						"300": "5m",
						"600": "10m",
						"900": "15m",
						"1800": "30m",
						"3600": "1h",
						"7200": "2h",
						"21600": "6h"
					};
					c.send({
						content: `**Channel Edited**${diffs.map(d => `\n- ${d}`).join("")}`, embeds: [
							{
								"type": "rich",
								"title": `${diffs.includes("name") ? `#${channelO.name} -> ` : ""}#${channel.name}`,
								"description": "",
								"color": 0x006400,
								"fields": [
									{
										"name": `Description`,
										"value": `${diffs.includes("topic") ? `${channelO.topic} -> ` : ""}${channel.topic}`,
										"inline": true
									},
									{
										"name": `Category Name`,
										"value": `${diffs.includes("parentId") ? `${channelO.parentId === null ? "None" : client.channels.cache.get(channelO.parentId)?.name} -> ` : ""}${channel.parentId === null ? "None" : client.channels.cache.get(channel.parentId)?.name}`,
										"inline": true
									},
									{
										"name": `Slowmode`,
										"value": `${diffs.includes("rateLimitPerUser") ? `${rls[`${channelO.rateLimitPerUser}`]} -> ` : ""}${rls[`${channel.rateLimitPerUser}`]}`,
										"inline": true
									},
									{
										"name": `Age Restricted`,
										"value": `${diffs.includes("nsfw") ? `${channelO.nsfw} -> ` : ""}${channel.nsfw}`,
										"inline": true
									}
								],
								"thumbnail": {
									"url": channel.guild.iconURL(),
									"width": 0,
									"height": 0
								},
								"footer": {
									"text": `Channel Edited`
								},
								"url": `https://discord.com/channels/${channel.guild.id}/${channel.id}`
							}
						]
					});
				}
				else {
					guildStore.logs.active = false;
					guildStore.save();
				}
			}
		}
	},

	async [Events.GuildEmojiCreate] (emoji) {
		const guildStore = await guildByObj(emoji.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			var c = emoji.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Emoji :\`${emoji.name}\`: created:** <:${emoji.name}:${emoji.id}>`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildEmojiDelete] (emoji) {
		const guildStore = await guildByObj(emoji.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			var c = emoji.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Emoji :\`${emoji.name}\`: deleted.**`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildEmojiUpdate] (emojiO, emoji) {
		const guildStore = await guildByObj(emoji.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			var c = emoji.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Emoji :\`${emojiO.name}\`: is now :\`${emoji.name}\`:** <:${emoji.name}:${emoji.id}>`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildStickerCreate] (sticker) {
		const guildStore = await guildByObj(sticker.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			var c = sticker.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send({ content: `**Sticker \`${sticker.name}\` created**\n- **Name**: ${sticker.name}\n- **Related Emoji**: ${/^\d{19}$/.test(sticker.tags) ? `<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>` : sticker.tags}\n- **Description**: ${sticker.description}`, stickers: [sticker] });
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildStickerDelete] (sticker) {
		const guildStore = await guildByObj(sticker.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			var c = sticker.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Sticker \`${sticker.name}\` Deleted**`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildStickerUpdate] (stickerO, sticker) {
		const guildStore = await guildByObj(sticker.guild);
		if (guildStore.logs.active && guildStore.logs.emoji_events) {
			let diffs = [];
			Object.keys(stickerO).forEach(key => {
				if (stickerO[key] !== sticker[key]) {
					diffs.push(key);
				}
			});
			if (diffs.length > 0) {
				var c = sticker.guild.channels.cache.get(guildStore.logs.channel);
				if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					c.send({
						content:
							`**Sticker Edited**\n` +
							`- **Name**: ${diffs.includes("name")
								? `${stickerO.name} -> `
								: ""}${sticker.name}\n` +
							`- **Related Emoji**: ${diffs.includes("tags")
								? `${/^\d{19}$/.test(stickerO.tags)
									? `<:${client.emojis.cache.get(stickerO.tags).name}:${stickerO.tags}>`
									: stickerO.tags} -> `
								: ""}${/^\d{19}$/.test(sticker.tags)
									? `<:${client.emojis.cache.get(sticker.tags).name}:${sticker.tags}>`
									: sticker.tags}\n` +
							`- **Description**: ${diffs.includes("description") ? `${stickerO.description} -> ` : ""}${sticker.description}`,
						stickers: [sticker]
					});
				}
				else {
					guildStore.logs.active = false;
					guildStore.save();
				}
			}
		}
	},

	async [Events.InviteCreate] (invite) {
		const guildStore = await guildByObj(invite.guild);
		if (guildStore.logs.active && guildStore.logs.invite_events) {
			var c = invite.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send({ content: `**Invite \`${invite.code}\` Created**\n- Code: ${invite.code}\n- Created by <@${invite.inviterId}>\n- Channel: <#${invite.channelId}>${invite._expiresTimestamp ? `\n- Expires <t:${Math.round(invite._expiresTimestamp / 1000)}:R>` : ``}\n- Max uses: ${invite.maxUses > 0 ? invite.maxUses : "Infinite"}`, allowedMentions: { parse: [] } });
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.InviteDelete] (invite) {
		const guildStore = await guildByObj(invite.guild);
		if (guildStore.logs.active && guildStore.logs.invite_events) {
			var c = invite.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send({ content: `**Invite \`${invite.code}\` Deleted**`, allowedMentions: { parse: [] } });
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildRoleCreate] (role) {
		const guildStore = await guildByObj(role.guild);
		if (guildStore.logs.active && guildStore.logs.role_events) {
			var c = role.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send({ content: `**Role <@&${role.id}> created**`, allowedMentions: { parse: [] } });
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildRoleDelete] (role) {
		const guildStore = await guildByObj(role.guild);
		if (guildStore.logs.active && guildStore.logs.role_events) {
			var c = role.guild.channels.cache.get(guildStore.logs.channel);
			if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
				c.send(`**Role \`${role.name}\` Deleted**`);
			}
			else {
				guildStore.logs.active = false;
				guildStore.save();
			}
		}
	},

	async [Events.GuildRoleUpdate] (roleO, role) {
		const guildStore = await guildByObj(role.guild);
		if (guildStore.logs.active && guildStore.logs.role_events) {
			var diffs = [];
			var caredAboutDiffs = ["name", "hoist", "mentionable", "color"];
			Object.keys(roleO).forEach(key => {
				if (roleO[key] !== role[key] && caredAboutDiffs.includes(key)) {
					diffs.push(key);
				}
			});
			if (diffs.length > 0) {
				var c = role.guild.channels.cache.get(guildStore.logs.channel);
				if (c.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					var flds = [
						{
							"name": `Hoisted`,
							"value": `${diffs.includes("hoist") ? `${roleO.hoist} -> ` : ""}${role.hoist}`,
							"inline": true
						},
						{
							"name": `Pingable`,
							"value": `${diffs.includes("mentionable") ? `${roleO.mentionable} -> ` : ""}${role.mentionable}`,
							"inline": true
						}
					];
					if (diffs.includes("color")) {
						flds.push({
							"name": `Old Color`,
							"value": `#${roleO.color}`,
							"inline": false
						});
					}
					c.send({
						content: `**Role <@&${role.id}> Edited**`, embeds: [{
							"type": "rich",
							"title": `${diffs.includes("name") ? `${roleO.name} -> ` : ""}${role.name}`,
							"description": "",
							"color": role.color,
							"fields": flds,
							"thumbnail": {
								"url": role.guild.iconURL(),
								"height": 0,
								"width": 0
							}
						}], allowedMentions: { parse: [] }
					});
				}
				else {
					guildStore.logs.active = false;
					guildStore.save();
				}
			}
		}
	},

	async [Events.GuildMemberUpdate] (memberO, member) {
		const guildStore = await guildByObj(member.guild);
		if (guildStore.logs.active && guildStore.logs.user_change_events) {
			var diffs = [];
			var caredAboutDiffs = ["nickname", "avatar"];
			Object.keys(memberO).forEach(key => {
				if (memberO[key] !== member[key] && caredAboutDiffs.includes(key)) {
					diffs.push(key);
				}
			});
			if (diffs.length > 0) {
				var c = client.channels.cache.get(guildStore.logs.channel);
				if (c?.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					var flds = [];
					if (diffs.includes("avatar")) {
						flds.push({
							"name": `Avatar`,
							"value": `Changed`,
							"inline": true
						});
					}
					c.send({
						content: `**User <@${member.id}> Edited for this Server**`, embeds: [{
							"type": "rich",
							"title": `${diffs.includes("nickname") ? `${memberO.nickname} -> ` : ""}${member.nickname}`,
							"description": `${member.user.username}`,
							"color": member.user.accentColor === undefined ? 0x006400 : member.user.accentColor,
							"fields": flds,
							"thumbnail": {
								"url": member.displayAvatarURL() ? member.displayAvatarURL() : member.user.displayAvatarURL(),
								"height": 0,
								"width": 0
							},
							"url": `https://discord.com/users/${member.id}`
						}], allowedMentions: { parse: [] }
					});
				}
				else {
					guildStore.logs.active = false;
					guildStore.save();
				}
			}
		}
	},

	//#endregion
};
