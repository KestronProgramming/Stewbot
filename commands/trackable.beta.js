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

function getTrackableEmbed(tracker){
	return {
		"description": tracker.desc,
		"color": tracker.color,
		"fields": [
			{
				"name": "---",
				"value": tracker.tag,
				"inline":false
			},
			{
				"name":"Current Location",
				"value":tracker.currentName,
				"inline":true
			},
			{
				"name":"Past Servers",
				"value":`${tracker.pastLocations.length}`,//TODO: Only count pastLocations that start with 'c'
				"inline":true
			}
		],
		"thumbnail": {
			"url": tracker.img
		},
		"footer": {
			"text": "Trackable",
			"icon_url": "https://media.discordapp.net/attachments/1221938602397667430/1403786745241272461/OIG2.dPKlYcycwt4DCcIAYeBX.jpg?ex=6898d1c9&is=68978049&hm=4187e9fcf2161b161f45fb467825740450adef00106589d12a07303be7624051&=&width=1708&height=1708"
		},
		"author": {
			"name": `${tracker.name} | #${tracker.id}`,
			"icon_url": tracker.img
		}
	};
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
	const possibleChars="1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	var tempId="";
	while(tempId==="" || (await Trackables.exists({"id":tempId}))){
		tempId="";
		for(var i=0;i<10;i++){
			tempId+=possibleChars[Math.floor(Math.random()*possibleChars.length)];
		}
	}
	return tempId;
}


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
			.setName('trackable').setDescription('Manage trackables')
				.addSubcommand(command=>command.setName("about").setDescription("Learn more about trackables").addBooleanOption(option =>
                    option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
                ))
				.addSubcommand(command=>command.setName("my_trackable").setDescription("View or create your trackable")
					// .addBooleanOption(option =>
					// 	option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					// )
					.addAttachmentOption(option => 
						option.setRequired(false).setName("image").setDescription("The image that you want to make into a Trackable")
					)
				)
				.addSubcommand(command=>command.setName("current").setDescription("View the trackable currently in your inventory"))
				.addSubcommand(command=>
					command.setName("view").setDescription("Find a trackable using its ID").addStringOption(option=>
						option.setName("id").setDescription("The ID of the trackable you want to view").setRequired(true)
					).addBooleanOption(option =>
						option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					)
				),
		
		requiredGlobals: [],

		deferEphemeral: {
			"current": true,
			"my_trackable": true
		},
		
		help: {
			"about":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Learn more about trackables",
				detailedDesc: `View specific rulesets and descriptions of what the trackable feature does`,
			},
			"my_trackable":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Create or view stats about your trackable",
				detailedDesc: `See info about where your trackable is now and its statistics, or create one if you haven't yet.`,
			},
			"current":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "View the trackable currently in your inventory",
				detailedDesc: `See specific info about the trackable currently in your inventory, and place it if you wish.`,
			},
			"view":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Find a trackable using its ID",
				detailedDesc: `View current stats about a trackable you've seen before using its ID`,
			}
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		switch(cmd.options.getSubcommand()){
			case "about":
				cmd.followUp({content:"About Trackables",embeds:[{
					"title": "About Trackables",
					// "description": "Trackables are a feature where you can start a character or item, and then release it to travel to lots of different servers. People can pick them up, go to another server, and place them. You can then see how many servers or people the trackable has exchanged hands with.\n\nIf a trackable sees no movement from its location for one week, it will be sent to a special channel in Kestron Central. You can find this channel by joining the server in /links.\n\nAll trackables will be reviewed by Stewbot's staff team.",
					"description": `Trackables are a feature that start with a custom image, which you release to travel across servers. They can be picked them up, and placed in other servers.\n\nTrackables show you how many people and servers they have traversed.\n\nIf a trackable sees no movement for one week, it will be sent to a special channel in [Kestron Central](${config.invite}).\n\n-# All trackables are reviewed by bot staff.`,
					"color": 0x006400,
					"thumbnail": {
						"url": "https://media.discordapp.net/attachments/1221938602397667430/1403786745241272461/OIG2.dPKlYcycwt4DCcIAYeBX.jpg?ex=6898d1c9&is=68978049&hm=4187e9fcf2161b161f45fb467825740450adef00106589d12a07303be7624051&=&width=1708&height=1708"
					},
					"footer": {
						"text": "Stewbot",
						"icon_url": "https://stewbot.kestron.software/stewbot.jpg"
					}
					}]});
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
						current: `u${cmd.user.id}`
					});

					if (!hasCurrentTrackable) {
						return cmd.followUp("You already have a trackable in your inventory. Place your current trackable somewhere before creating one.");
					}

					if (!attachment || !attachment?.contentType) {
						return cmd.followUp("To create your own Trackable, you must supply an image.");
					}

					if (!allowedMimes.includes(attachment.contentType||"")) {
						return cmd.followUp("Image must be one of the supported types: " + allowedMimes.join(", "))
					}

					// const trackableChannel = await client.channels.fetch(process.env.trackablesChannel||'');
					// const uploadedTrackable = await trackableChannel.send({
					// 	content: `Uploaded a trackable image`,
					// 	files: [ attachment.url ]
					// });
					// uploadedLink = message.attachments.first()?.url || "";

					// WARNING: Idk if this expires??
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
						return cmd.followUp("You may only create one trackable. Run this command without an attachment to see the stats of yours.");
					}

					// TODO: embed stats about your trackable.

					// Display
					cmd.followUp({
						content:usersTrackable.name,
						embeds:[getTrackableEmbed(usersTrackable)],
						components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`place-${usersTrackable.id}-${cmd.user.id}`).setLabel("Place").setStyle(ButtonStyle.Success)).toJSON()]
					});
				}
			break;
			case "current":
				var tracker = await Trackables.findOne({ 
					current: `u${cmd.user.id}`
				});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`You don't have any trackables in your inventory! You can make one with ${cmds.trackable.my_trackable.mention} or find others that have been posted.`); // TODO: link to our server
				}
				cmd.followUp({
					ephemeral: true,
					content: `${tracker.name}`,
					embeds: [getTrackableEmbed(tracker)],
					components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`place-${tracker.id}-${cmd.user.id}`).setLabel("Place").setStyle(ButtonStyle.Success)).toJSON()]
				});
			break;
			case "view":
				var tracker=await Trackables.findOne({id:cmd.options.getString("id")});
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(`I didn't find any trackables with that ID! The tracker may have been deleted, or  the ID typed incorrectly`);
				}
				cmd.followUp({
					content:`${tracker.name}`,
					embeds:[getTrackableEmbed(tracker)],
					components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`place-${tracker.id}-${cmd.user.id}`).setLabel("Place").setStyle(ButtonStyle.Success)).toJSON()]
				});
			break;
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
	async [Events.InteractionCreate] (cmd) {
		if (!cmd.isStringSelectMenu() && !cmd.isButton() && !cmd.isModalSubmit()) return;

		let trackableData = await Trackables.findOne({ owner: cmd.user.id })
		if (!trackableData) return; // TODO: respond custom per type if something is wrong?

		if (trackableData.status !== "editing") {
			return cmd.reply({
				content: "This Trackable has already been published.",
				ephemeral: true
			})
		}

		try {
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
					trackableData.status = "published"
					await trackableData.save();

					await cmd.reply({
						content: 'Trackable published!',
						ephemeral: true
					});

					// Notify us
					const trackableChannel = await client.channels.fetch(process.env.trackablesChannel||'');
					// @ts-ignore
					trackableChannel.send({
						content:`${cmd.user.id} made a new trackable.`,
						embeds:[ getTrackableEmbed(trackableData) ]
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
		} catch (error) {
			console.error('Error handling trackable editor interaction:', error);

			// Send error message if interaction hasn't been replied to
			if (!cmd.replied && !cmd.deferred) {
				await cmd.reply({
					content: 'An error occurred while updating the trackable.',
					ephemeral: true
				});
			}
		}
	}
};
