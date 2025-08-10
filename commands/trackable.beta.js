// #region CommandBoilerplate
const Categories = require("./modules/Categories.js");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, Trackables } = require("./modules/database.js")
const { Events, PermissionsBitField, MessageFlags, ContainerBuilder, AttachmentBuilder, ContextMenuCommandBuilder, TextDisplayBuilder, SeparatorSpacingSize, SeparatorBuilder, SectionBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const config = require("../data/config.json");
const { globalCensor } = require("./filter.js");

// Defined at boot
let trackablesNotices;
let trackablesArchive;

const trackableIcon = "https://cdn.discordapp.com/attachments/1229256619792138351/1404159977987248180/image.png?ex=689a2d62&is=6898dbe2&hm=de6192003f99d891937ac07540aa1a83887f04d05bf23cc86e3d84a34ddcf2bb&";

const aboutTrackables = {
	ephemeral: false,
	content: "About Trackables",
	embeds: [{
		"title": "About Trackables",
		"description": 
			// @ts-ignore
			`Trackables are a feature that start with your image, which you release to travel across servers. They can be picked up and placed in any server. [Add Stewbot to your profile](${config.install}) to make your own! ${cmds.trackable.my_trackable.mention}\n`+
			`\n`+
			`Trackables show you how many people and servers they have traversed.\n`+
			`\n`+
			`If a trackable sees no movement for one week, it will be sent to a special channel in [Kestron Central](${config.invite}) where you can pick them up.\n`+
			`\n`+
			`-# All trackables are reviewed by bot staff.`,
		"color": 0x006400,
		"thumbnail": {
			"url": "https://media.discordapp.net/attachments/1221938602397667430/1403786745241272461/OIG2.dPKlYcycwt4DCcIAYeBX.jpg?ex=6898d1c9&is=68978049&hm=4187e9fcf2161b161f45fb467825740450adef00106589d12a07303be7624051&=&width=1708&height=1708"
		},
		"footer": {
			"text": "Stewbot",
			"icon_url": "https://stewbot.kestron.software/stewbot.jpg"
		}
	}]
}

async function canUserSeeMessage(user, guildId, channelId, messageId) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return false;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return false;

    // Check basic channel visibility
    const perms = channel.permissionsFor(member);
    if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) return false;
    if (!perms?.has(PermissionsBitField.Flags.ReadMessageHistory)) return false;

    // Finally, try to fetch the message
    const message = await channel.messages.fetch(messageId).catch(() => null);
    return !!message;
}

function unique(array) {
	return [...new Set(array)]
}

async function getTrackableEmbed(tracker, {
	userIdForPlace="", lockPlace=false,
	showPickUpRow=false, pickUpLocked=false, pickedUpBy="",
	showBanButton=false,   // For mods
	userForCurrentLoc=null  // Pass the interaction for guild / user access - if the user has access to the current location, we'll link it
}) {
	// We let this function generate the entire reply so it's easier to move to components v2

	let { id, name, img, desc, tag, color, layout } = tracker;

	// Filter output
	name = await globalCensor(name);
	desc = await globalCensor(desc);
	tag = await globalCensor(tag);

	let response = {};

	// Link the trackable if visible to the user
	let currentLocation = `${tracker.currentName.replace("`","'")}`;
	let currentChannelId = tracker.current.slice(1);
	if (userForCurrentLoc && tracker.current[0] == "c" && 
		canUserSeeMessage(userForCurrentLoc, tracker.currentGuildId, currentChannelId, tracker.currentMessageId)
	) {
		currentLocation = `https://discord.com/channels/${tracker.currentGuildId}/${currentChannelId}/${tracker.currentMessageId}`
	}

	const embed = new EmbedBuilder()
		.setTitle(`${name}`)
		.setColor(tracker.color)
		.setFooter({ text: "Trackable", iconURL: trackableIcon })
		// Add stats
		.addFields(
			{ name: "Current Location", value: currentLocation, inline: true },
			{ name: "Reach", value: `${
				unique(
					tracker.pastLocations.filter(loc => loc.startsWith('c')) // Only servers
				).length
			} servers`, inline: true },
			{ name: "Carried By", value: `${
				unique(
					tracker.pastLocations.filter(loc => loc.startsWith('u')) // Only users
				).length
			} users`, inline: true }
		)

	// Mark old server ones as picked up
	if (pickedUpBy) embed.addFields({ name: "Picked up by:", value: pickedUpBy, inline: true },)

	// Images depending on layout
	if (layout === 0 && img) {
		embed.setThumbnail(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} else if (layout === 1 && img) {
		embed.setImage(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} else if (layout === 2 && img) {
		embed.setImage(img);
	}

	response.embeds = [embed];
	
	if (userIdForPlace) {
		response.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`t-place-${tracker.id}-${userIdForPlace}`)
					.setLabel("Place")
					.setStyle(ButtonStyle.Success)
					.setDisabled(lockPlace)
			).toJSON()
		]
	}

	if (showPickUpRow) {
		response.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`trackable_pickup-${tracker.id}`)
					.setLabel('Pick up')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(pickUpLocked),
				new ButtonBuilder()
					.setCustomId('trackable_about')
					.setLabel("What's this?")
					.setStyle(ButtonStyle.Secondary)
			).toJSON()
		]
	}

	if (showBanButton) {
		response.components = [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`trackable_ban-${tracker.id}`)
					.setLabel("Ban Trackable")
					.setStyle(ButtonStyle.Danger)
			).toJSON()
		]
	}

	return response;
}

function getTrackableEditor(trackable) {
	const { id, name, img, desc, tag, color, layout, } = trackable;

	// Embed
	const embed = new EmbedBuilder()
		.setTitle(`${name}`)
		.setColor(color)
		.setFooter({ text: `Trackable #${id}`, iconURL: trackableIcon });


	// Images depending on layout
	if (layout === 0 && img) {
		embed.setThumbnail(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} else if (layout === 1 && img) {
		embed.setImage(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} else if (layout === 2 && img) {
		embed.setImage(img);
	}

	// Layout select
	const layoutSelect = new StringSelectMenuBuilder()
		.setCustomId('edit_trackable_layout')
		.setPlaceholder('Choose layout type')
		.addOptions(
			{ label: 'Thumbnail Image', value: '0', default: layout === 0 },
			{ label: 'Main Image', value: '1', default: layout === 1 },
			{ label: 'Clean', value: '2', default: layout === 2 }
		);

	// Color select
	// TODO make current value be the default if one of these is the default?
	const colorSelect = new StringSelectMenuBuilder()
		.setCustomId('edit_trackable_color')
		.setPlaceholder('Choose embed color')
		.addOptions(
			{ label: 'Sky Blue', value: '0x00d7ff', emoji: '🔵' },
			{ label: 'Green', value: '0x00ff00', emoji: '🟢' },
			{ label: 'Red', value: '0xff0000', emoji: '🔴' },
			{ label: 'Purple', value: '0x9932cc', emoji: '🟣' }
		);

	// Edit buttons
	const editButtons = [
		new ButtonBuilder()
			.setCustomId('edit_trackable_name')
			.setLabel('Edit Name')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('edit_trackable_tag')
			.setLabel('Edit Tag')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('edit_trackable_desc')
			.setLabel('Edit Description')
			.setStyle(ButtonStyle.Secondary)
	];

	// Publish button
	const publishButton = new ButtonBuilder()
		.setCustomId('edit_trackable_publish')
		.setLabel('Publish')
		.setStyle(ButtonStyle.Success);

	return {
		embeds: [embed],
		components: [
			new ActionRowBuilder().addComponents(layoutSelect),
			new ActionRowBuilder().addComponents(colorSelect),
			new ActionRowBuilder().addComponents(...editButtons),
			new ActionRowBuilder().addComponents(publishButton)
		]
	};
}

function createEditModal(field, currentValue = '') {
    const fieldConfig = {
        name: {
            title: 'Edit Trackable Name',
            label: 'Trackable Name',
            placeholder: 'Enter the trackable name (e.g., Jerry)',
            maxLength: 100,
            style: TextInputStyle.Short
        },
        tag: {
            title: 'Edit Trackable Tag',
            label: 'Tag Line',
            placeholder: 'Enter a catchy tag line',
            maxLength: 200,
            style: TextInputStyle.Short
        },
        desc: {
            title: 'Edit Description',
            label: 'Description',
            placeholder: 'Describe your trackable...',
            maxLength: 1000,
            style: TextInputStyle.Paragraph
        }
    };

    const config = fieldConfig[field];
    if (!config) throw new Error(`Invalid field: ${field}`);

    const modal = new ModalBuilder()
        .setCustomId(`edit_trackable_${field}`)
        .setTitle(config.title);

    const textInput = new TextInputBuilder()
        .setCustomId(`${field}_input`)
        .setLabel(config.label)
        .setPlaceholder(config.placeholder)
        .setStyle(config.style)
        .setMaxLength(config.maxLength)
        .setRequired(field !== 'desc')
        .setValue(currentValue);

    const actionRow = new ActionRowBuilder()
        .addComponents(textInput);

    // @ts-ignore
    modal.addComponents(actionRow);
    return modal;
}

async function genTrackerId(){
	// const possibleChars="1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	const possibleChars = "1234567890";
	var tempId = "";
	while (tempId === "" || (await Trackables.exists({ "id": tempId }))) {
		tempId = "";
		for (var i = 0; i < 10; i++) {
			tempId += possibleChars[Math.floor(Math.random() * possibleChars.length)];
		}
	}
	return tempId;
}

// TODO: Expiring - daily listener and expirer. Make sure transferring hands resets the last moved date. Make sure the find-a-trackable channel's don't expire.

// TODO: Place command

// TODO: 'about'

// TODO: Rerun this command with an image.... specify image option... 

// TODO: If pickup, and it didn't have it, 
// TODO: Link to KC for find a trackable more on pickup expired

// TODO: When claimed, just use name, and say "it moved on"  


module.exports = {
	data: {
		command: new SlashCommandBuilder()
			.setContexts(
				IT.Guild,          // Server command
				IT.BotDM,          // Bot's DMs
				IT.PrivateChannel, // User commands
			)
			.setIntegrationTypes(
				AT.GuildInstall,   // Install to servers
				AT.UserInstall     // Install to users
			)
			.setName('trackable').setDescription('Manage Trackables')
			.addSubcommand(command => command.setName("about").setDescription("Learn more about Trackables").addBooleanOption(option =>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			))
			.addSubcommand(command => command.setName("my_trackable").setDescription("View or create your Trackable")
				// .addBooleanOption(option =>
				// 	option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				// )
				.addAttachmentOption(option =>
					option.setRequired(false).setName("image").setDescription("The image that you want to make into a Trackable")
				)
			)
			.addSubcommand(command => command.setName("inventory").setDescription("View the Trackable currently in your inventory"))
			.addSubcommand(command =>
				command.setName("view").setDescription("View a Trackable with its ID")
					.addStringOption(option =>
						option.setName("id").setDescription("The ID of the trackable you want to view").setRequired(true)
					)
					.addBooleanOption(option =>
						option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					)
			),

		requiredGlobals: [],

		deferEphemeral: {
			"inventory": true,
			"my_trackable": true,
		},
		
		help: {
			"about":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Learn more about Trackables",
				detailedDesc: `View specific rulesets and descriptions of what the Trackable feature does`,
			},
			"my_trackable":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Create or view stats about your Trackable",
				detailedDesc: `See info about where your Trackable is now and its statistics, or create one if you haven't yet.`,
			},
			"inventory":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "View the Trackable currently in your inventory",
				detailedDesc: `See specific info about the Trackable currently in your inventory, and place it if you wish.`,
			},
			"view":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Find a Trackable using its ID",
				detailedDesc: `View current stats about a Trackable you've seen before using its ID`,
			}
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		switch(cmd.options.getSubcommand()){
			case "about":
				return await cmd.followUp(aboutTrackables);
			break;
			case "my_trackable":
				let usersTrackable = await Trackables.findOne({
					"owner": cmd.user.id,
					"status": { $in: [ "published", "banned" ] }
				});
				const attachment = cmd.options.getAttachment("image");

				const allowedMimes = [
					"image/jpeg",
					"image/png",
					"image/webp",
					"image/avif"
				];

				if (!usersTrackable) {
					// Create it
					const hasCurrentTrackable = await Trackables.exists({
						status: "published",
						current: `u${cmd.user.id}`
					});

					if (hasCurrentTrackable) {
						return cmd.followUp("You already have a Trackable in your inventory. Place your current Trackable somewhere before creating one.");
					}

					if (!attachment || !attachment?.contentType) {
						return cmd.followUp("To create your own Trackable, you must supply an image.");
					}

					if (!allowedMimes.includes(attachment.contentType||"")) {
						return cmd.followUp("Image must be one of the supported types: " + allowedMimes.join(", "))
					}

					// TODO: These links only last 24 hours

					// NOTE: This link only lasts 24 hours.
					let uploadedLink = attachment.url;

					// Upload image to trackables channel, this lets us delete the origin image for retroactive filtering and lasts infinitely.
					const response = await fetch(uploadedLink);
					const buffer = await response.arrayBuffer();
					const file = new AttachmentBuilder(Buffer.from(buffer), { name: attachment.name });
					const sentMessage = await trackablesNotices.send({
						content: "New trackables image\n-# Deleting here will retroactively remove image globally",
						files: [file] 
					});
					const permanentLink = sentMessage.attachments.first().url;
					
					// Create and post editor embed
					usersTrackable = await Trackables.findOneAndUpdate(
						{ owner: cmd.user.id },
						{
							// The image is changed by rerunning this command while editing
							$set: {
								img: permanentLink
							},
							// These fields only need to be updated originally
							$setOnInsert: {
								current: `u${cmd.user.id}`,
								currentName: `${cmd.user.username}'s Inventory`,
								id: await genTrackerId()
							}
						},
						{
							new: true,
							upsert: true
						}
					);
					
					// Embed in editor
					const editorComponents = getTrackableEditor(usersTrackable);
					await cmd.followUp({
						// @ts-ignore
						components: editorComponents.components,
						embeds: editorComponents.embeds,
						ephemeral: true,
					});

					break;
				}
				else {
					if (usersTrackable.status == "banned") {
						return cmd.followUp("Sorry, the trackable you created was banned for being inappropriate.");
					}

					// Your trackable already exists
					if (attachment) {
						return cmd.followUp("You may only create one Trackable. Run this command without an attachment to see the stats of yours.");
					}

					const holdingTrackable = usersTrackable.current == `u${cmd.user.id}`;

					// Display
					cmd.followUp({
						...await getTrackableEmbed(usersTrackable, {
							"userIdForPlace": holdingTrackable ? cmd.user.id : "",
							"userForCurrentLoc": cmd.user.id
						})
					});
				}
			break;
			case "inventory":
				var tracker = await Trackables.findOne({ 
					current: `u${cmd.user.id}`,
					status: "published"
				});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`You don't have any Trackables in your inventory! You can make one with ${cmds.trackable.my_trackable.mention} or find others that have been posted.`); // TODO: link to our server
				}
				cmd.followUp({
					ephemeral: true,
					...await getTrackableEmbed(tracker, {"userIdForPlace": cmd.user.id})
				});
			break;
			case "view":
				var tracker = await Trackables.findOne({
					id: cmd.options.getString("id"),
					status: "published"
				});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`I didn't find any Trackables with that ID! The tracker may have been deleted, or  the ID typed incorrectly`);
				}

				// Only show the place button if they they currently hold this one
				const showPlace = tracker.current == `u${cmd.user.id}`;

				cmd.followUp({
					...await getTrackableEmbed(tracker, {"userIdForPlace": showPlace ? cmd.user.id : ""})
				});
			break;
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
	async [Events.InteractionCreate] (cmd) {
		if (!cmd.isStringSelectMenu() && !cmd.isButton() && !cmd.isModalSubmit()) return;

		try {

			// Placing button
			if (cmd.customId.startsWith("t-place") && cmd.isButton()) {
				const [, , trackableId, userId] = cmd.customId.split("-");

				const trackable = await Trackables.findOne({ 
					id: trackableId,
					status: "published"
				});

				if (!trackable) {
					return cmd.reply({
						content: "Sorry, I couldn't find that Trackable.",
						ephemeral: true
					});
				}

				if (trackable.current !== `u${userId}`) {
					return cmd.reply({
						content: "You don't have that Trackable anymore, so you can't use it.",
						ephemeral: true
					});
				}

				const comingFrom = trackable.current;
				const placingToo = `c${cmd.channelId}`; // This prop should exist on user install.
				const serverName = cmd.guild?.name;

				const serversSinceTarget = trackable.pastLocations
					.filter(l => l[0] == "c")
					.reverse()
					.indexOf(placingToo);

				if (serversSinceTarget == 0) {
					return cmd.reply({
						content: "You must post this in a different server than it was last in.",
						ephemeral: true
					});
				}

				// Defer this button so we can see if it was force-ephemeraled by the server rules.
				const deferedMessage = await cmd.deferReply({
					"ephemeral": false,
					"withResponse": true
				})

				if (deferedMessage.interaction.responseMessageEphemeral) {
					return cmd.followUp(
						"This server has prevented your ability to run my commands publicly.\n" +
						"Try posting your Trackable in another channel or server." 
					)
				}

				trackable.current = placingToo;
				trackable.currentName = serverName ? `A channel in \`${serverName.replaceAll("`", "'")}\`` : "A discord server";
				trackable.pastLocations.push(comingFrom);
				trackable.currentGuildId = cmd.guildId;
				
				const message = await cmd.followUp({
					...await getTrackableEmbed(trackable, {
						"showPickUpRow": true
					}),
				}).catch(e=>null)
				
				trackable.currentMessageId = message.id;
				await trackable.save();

				// Lock place button - I couldn't get this working, I'm not sure if I need to defer it differently or if we only get one choice of reply.
				// await cmd.update({
				// 	...await getTrackableEmbed(trackable, {
				// 		"userIdForPlace": userId,
				// 		"lockPlace": true
				// 	}),
				// 	embeds: undefined // Don't update embed content since the trackable has changed
				// })
				// return;
			}

			// Buttons for handling placed trackables
			if (cmd.customId.startsWith("trackable")) {
				if (cmd.customId == "trackable_about") {
					return cmd.reply({
						...aboutTrackables,
						ephemeral: true
					})
				}

				if (cmd.customId.startsWith("trackable_pickup") && cmd.isButton()) {
					const [ , trackableId ] = cmd.customId.split("-");

					const trackable = await Trackables.findOne({
						id: trackableId,
						status: "published"
					})

					if (!trackable) {
						return cmd.reply({
							content: "Sorry, I couldn't find that trackable.",
							ephemeral: true
						});
					}

					if (trackable.current !== `c${cmd.channelId}`) {
						return cmd.reply({
							content: "Sorry, that Trackable doesn't seem to be in this channel. Perhaps it was moved somewhere else?",
							ephemeral: true
						});
					}

					const goingTo = `u${cmd.user.id}`;

					const usersSinceLast = trackable.pastLocations
						.filter(l => l[0] == "u")
						.reverse()
						.indexOf(goingTo);

					if (usersSinceLast == 0) {
						return cmd.reply({
							// @ts-ignore
							content: `Let someone else move this Trackable first. In the meantime, you can create your own with ${cmds.trackable.my_trackable.mention} or find a different Trackable.`,
							ephemeral: true
						});
					} 

					trackable.pastLocations.push(trackable.current);
					trackable.current = goingTo;
					trackable.currentName = `${cmd.user.username}'s Inventory`

					await trackable.save();
					await cmd.update({
						...await getTrackableEmbed(trackable, {
							"showPickUpRow": true, 
							"pickUpLocked": true, 
							"pickedUpBy": cmd.user.username
						})
					})

					await cmd.followUp({
						embeds: [
							new EmbedBuilder()
								.setDescription(
									// @ts-ignore
									`You have picked up this Trackable! Now go share it somewhere with ${cmds.trackable.inventory.mention}\n`+
									`\n`+
									`You can even share it in servers that don't have Stewbot if you [add Stewbot to your apps](<${config.install}>)!`
								)
							],
						ephemeral: true
					})
				}
			}

			// Editing interactions
			if (cmd.customId.startsWith("edit_trackable")) {

				let trackableData = await Trackables.findOne({ owner: cmd.user.id })
				if (!trackableData) {
					return cmd.reply({
						content: "Sorry, I couldn't find that Trackable.",
						ephemeral: true
					});
				}
				
				if (trackableData.status !== "editing") {
					return cmd.reply({
						content: `This Trackable has ${trackableData.status == "published" ? "already been published." : "been banned."}`,
						ephemeral: true
					})
				}
				
				// Add editing interactions
				if (cmd.isStringSelectMenu()) {
					if (cmd.customId === 'edit_trackable_layout') {
						trackableData.layout = parseInt(cmd.values[0]);
						trackableData.save();

						// Update the message with new layout
						const updatedEditor = getTrackableEditor(trackableData);
						await cmd.update({
							// @ts-ignore
							components: updatedEditor.components,
							embeds: updatedEditor.embeds,
						});
					}
					else if (cmd.customId === 'edit_trackable_color') {
						// @ts-ignore
						trackableData.color = cmd.values[0];
						trackableData.save();

						// Update the message with new color
						const updatedEditor = getTrackableEditor(trackableData);
						await cmd.update({
							// @ts-ignore
							components: updatedEditor.components,
							embeds: updatedEditor.embeds,
						});
					}
				}
				else if (cmd.isButton()) {
					if (cmd.customId === 'edit_trackable_name') {
						const modal = createEditModal('name', trackableData.name);
						await cmd.showModal(modal);
					}
					else if (cmd.customId === 'edit_trackable_tag') {
						const modal = createEditModal('tag', trackableData.tag);
						await cmd.showModal(modal);
					}
					else if (cmd.customId === 'edit_trackable_desc') {
						const modal = createEditModal('desc', trackableData.desc);
						await cmd.showModal(modal);
					}
					else if (cmd.customId === 'edit_trackable_publish') {
						const hasCurrentTrackable = await Trackables.exists({
							status: "published",
							current: `u${cmd.user.id}`
						});
						if (hasCurrentTrackable) {
							return cmd.reply("You already have a Trackable in your inventory. Place your current Trackable somewhere before creating one.");
						}

						// Make then confirm
						return cmd.reply({
							ephemeral: true,
							content: "Are you sure you want to publish this? Once you publish it you can't change it.",
							components: [
								new ActionRowBuilder().addComponents([
									new ButtonBuilder()
										.setCustomId('edit_trackable_publish_no')
										.setLabel('No')
										.setStyle(ButtonStyle.Success),
									new ButtonBuilder()
										.setCustomId('edit_trackable_publish_yes')
										.setLabel('Yes')
										.setStyle(ButtonStyle.Danger)
								]).toJSON()
							]
						})
					}
					
					else if (cmd.customId === 'edit_trackable_publish_no') {
						cmd.update({
							content: "Publishing canceled.",
							components: []
						})
					}

					else if (cmd.customId === 'edit_trackable_publish_yes') {
						const hasCurrentTrackable = await Trackables.exists({
							status: "published",
							current: `u${cmd.user.id}`
						});
						if (hasCurrentTrackable) {
							return cmd.reply("You already have a Trackable in your inventory. Place your current Trackable somewhere before creating one.");
						}

						trackableData.status = "published"
						trackableData.current = `u${cmd.user.id}`
						await trackableData.save();

						await cmd.reply({
							// @ts-ignore
							content: `Trackable published!\n\nNow you can send it somewhere with ${cmds.trackable.current.mention}. If you install Stewbot to your profile, you can even send it in servers that don't use stewbot!`,
							ephemeral: true
						});

						// Notify us
						trackablesNotices.send({
							content:`${cmd.user.id} made a new Trackable.`,
							...await getTrackableEmbed(trackableData, {
								"showBanButton": true
							})
						});
					}
				}
				else if (cmd.isModalSubmit()) {
					// Special case for publish
					if (cmd.customId === 'edit_trackable_publish_confirmed') {
						// TODO
					}

					// These all have additional handling at the end
					if (cmd.customId === 'edit_trackable_name') {
						trackableData.name = cmd.fields.getTextInputValue('name_input');
					}
					else if (cmd.customId === 'edit_trackable_tag') {
						trackableData.tag = cmd.fields.getTextInputValue('tag_input');
					}
					else if (cmd.customId === 'edit_trackable_desc') {
						trackableData.desc = cmd.fields.getTextInputValue('desc_input');
					}

					trackableData.save();

					// We can't update the message, we have to reply with the new one - TODO: consider alternative
					const updatedEditor = getTrackableEditor(trackableData);
					return await cmd.reply({
						// @ts-ignore
						components: updatedEditor.components,
						embeds: updatedEditor.embeds,
						ephemeral: true,
					});
				}
			}

			// Mod Trackable Banning
			if (cmd.customId.startsWith("trackable_ban") && cmd.isButton()) {
				const [ , trackableId ] = cmd.customId.split("-");

				const trackable = await Trackables.findOne({ id: trackableId });

				if (!trackable) {
					cmd.reply("I couldn't find that trackable")
				}

				trackable.status = "banned";
				await trackable.save();
				return cmd.reply("Blacklisted that trackable. Delete the image if it needs to be retroactively hidden.");

			}
		} catch (error) {
			// Send error message if interaction hasn't been replied to
			if (!cmd.replied && !cmd.deferred) {
				await cmd.reply({
					content: 'An error occurred while updating the Trackable.',
					ephemeral: true
				});
			}
		}
	},

	async [Events.ClientReady] () {
		// await client.guilds.fetch(config.homeServer)
		trackablesNotices = await client.channels.fetch(process.env.trackablesNotices);
		trackablesArchive = await client.channels.fetch(process.env.trackablesArchive);
	}
};
