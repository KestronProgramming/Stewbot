// #region CommandBoilerplate
const Categories = require("./modules/Categories.js");
const client = require("../client.js");
// @ts-ignore
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, Trackables } = require("./modules/database.js")
// @ts-ignore
const { Events, MessageFlags, ContainerBuilder, ContextMenuCommandBuilder, TextDisplayBuilder, SeparatorSpacingSize, SeparatorBuilder, SectionBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const config = require("../data/config.json");

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

function unique(array) {
	return [...new Set(array)]
}

function getTrackableEmbed(tracker, {
	userIdForPlace="", lockPlace=false,
	showPickUpRow=false, pickUpLocked=false, 
	pickedUpBy=""
}) {
	// We let this function generate the entire reply so it's easier to move to components v2

	let response = {};

	const embed = new EmbedBuilder()
		.setDescription(tracker.desc)
		.setColor(tracker.color)
		.addFields(
			{ name: "─────", value: tracker.tag, inline: false },
			{ name: "Current Location", value: `${tracker.currentName.replace("`","'")}`, inline: true },
			{ name: "Reach", value: `${
				unique(
					tracker.pastLocations.filter(loc => loc.startsWith('c')) // Only servers, for now
				).length
			} servers`, inline: true },
			{ name: "Carried By", value: `${
				unique(
					tracker.pastLocations.filter(loc => loc.startsWith('u')) // Only servers, for now
				).length
			} users`, inline: true }
		)
		.setThumbnail(tracker.img)
		.setFooter({ text: "Trackable", iconURL: "https://media.discordapp.net/attachments/1221938602397667430/1403786745241272461/OIG2.dPKlYcycwt4DCcIAYeBX.jpg?ex=6898d1c9&is=68978049&hm=4187e9fcf2161b161f45fb467825740450adef00106589d12a07303be7624051&=&width=1708&height=1708" })
		.setAuthor({ name: `${tracker.name} | #${tracker.id}`, iconURL: tracker.img });

	if (pickedUpBy) embed.addFields({ name: "Picked up by:", value: pickedUpBy, inline: true },)

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

	return response;
}

function getTrackableEditor(trackable) {
	const { id, name, img, desc, tag, color, layout, } = trackable;

	// Embed
	const embed = new EmbedBuilder()
		.setTitle(name)
		.setColor(color);

	// Images depending on layout
	if (layout === 0 && img) {
		embed.setThumbnail(img);
		embed.setDescription(`ID: ${id}\n\n${desc}\n\n**${tag}**`)
	} else if (layout === 1 && img) {
		embed.setImage(img);
		embed.setDescription(`ID: ${id}\n\n${desc}\n\n**${tag}**`)
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
		.setStyle(ButtonStyle.Danger);

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

// TODO: In the Trackble embed, put the "tag" at the top, description below it.

// TODO: Expiring - daily listener and expirer. Make sure transferring hands resets the last moved date. Make sure the find-a-trackable channel's don't expire.

// TODO: Filter output against global filter.

// TODO: Trackable needs to store image URL on 

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
				.addSubcommand(command=>command.setName("about").setDescription("Learn more about Trackables").addBooleanOption(option =>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                ))
				.addSubcommand(command=>command.setName("my_trackable").setDescription("View or create your Trackable")
					// .addBooleanOption(option =>
					// 	option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					// )
					.addAttachmentOption(option => 
						option.setRequired(false).setName("image").setDescription("The image that you want to make into a Trackable")
					)
				)
				.addSubcommand(command=>command.setName("inventory").setDescription("View the Trackable currently in your inventory"))
				.addSubcommand(command=>
					command.setName("view").setDescription("View a Trackable with its ID").addStringOption(option=>
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
					"status": "published"
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
					let uploadedLink = attachment.url;

					// Create and post editor embed
					usersTrackable = await Trackables.findOneAndUpdate(
						{ owner: cmd.user.id },
						{
							$setOnInsert: {
								current: `u${cmd.user.id}`,
								currentName: `${cmd.user.username}'s Inventory`,
								id: await genTrackerId(),
								img: uploadedLink
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
					// Your trackable already exists
					if (attachment) {
						return cmd.followUp("You may only create one Trackable. Run this command without an attachment to see the stats of yours.");
					}

					const holdingTrackable = usersTrackable.current == `u${cmd.user.id}`;

					// Display
					cmd.followUp({
						...getTrackableEmbed(usersTrackable, {
							"userIdForPlace": holdingTrackable ? cmd.user.id : ""
						})
					});
				}
			break;
			case "inventory":
				var tracker = await Trackables.findOne({ 
					current: `u${cmd.user.id}`
				});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`You don't have any Trackables in your inventory! You can make one with ${cmds.trackable.my_trackable.mention} or find others that have been posted.`); // TODO: link to our server
				}
				cmd.followUp({
					ephemeral: true,
					...getTrackableEmbed(tracker, {"userIdForPlace": cmd.user.id})
				});
			break;
			case "view":
				var tracker = await Trackables.findOne({id:cmd.options.getString("id")});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`I didn't find any Trackables with that ID! The tracker may have been deleted, or  the ID typed incorrectly`);
				}

				// Only show the place button if they they currently hold this one
				const showPlace = tracker.current == `u${cmd.user.id}`;

				cmd.followUp({
					...getTrackableEmbed(tracker, {"userIdForPlace": showPlace ? cmd.user.id : ""})
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

				const trackable = await Trackables.findOne({ id: trackableId });

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
						content: "You must post this in a different server than it came from.",
						ephemeral: true
					});
				}

				trackable.current = placingToo;
				trackable.currentName = serverName ? `A channel in \`${serverName.replaceAll("`", "'")}\`` : "A discord server";
				trackable.pastLocations.push(comingFrom);

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

				await trackable.save();
				await cmd.followUp({
					...getTrackableEmbed(trackable, {
						"showPickUpRow": true
					}),
				})

				// Lock place button - I couldn't get this working, I'm not sure if I need to defer it differently or if we only get one choice of reply.
				// await cmd.update({
				// 	...getTrackableEmbed(trackable, {
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
						...getTrackableEmbed(trackable, {
							"showPickUpRow": true, 
							"pickUpLocked": true, 
							"pickedUpBy": cmd.user.username
						})
					})

					await cmd.followUp({
						content: `You have picked up this Trackable! Now go share it somewhere with ${cmds.trackable.inventory.mention}`,
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
						content: "This Trackable has already been published.",
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

						trackableData.status = "published"
						trackableData.current = `u${cmd.user.id}`
						await trackableData.save();

						await cmd.reply({
							content: 'Trackable published!',
							ephemeral: true
						});

						// Notify us
						const trackableChannel = await client.channels.fetch(process.env.trackablesChannel||'');
						// @ts-ignore
						trackableChannel.send({
							content:`${cmd.user.id} made a new Trackable.`,
							...getTrackableEmbed(trackableData)
						});
					}
				}
				else if (cmd.isModalSubmit()) {
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
					await cmd.reply({
						// @ts-ignore
						components: updatedEditor.components,
						embeds: updatedEditor.embeds,
						ephemeral: true,
					});
				}
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
	}
};
