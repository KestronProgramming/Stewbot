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
const { inlineCode, isSudo } = require("../utils.js")
const ms = require("ms");

// Defined at boot
let trackablesNotices;
let trackablesHub;

const trackableIcon = "https://cdn.discordapp.com/attachments/1229256619792138351/1404159977987248180/image.png?ex=689a2d62&is=6898dbe2&hm=de6192003f99d891937ac07540aa1a83887f04d05bf23cc86e3d84a34ddcf2bb&";

const aboutTrackables = {
	ephemeral: false,
	content: "About trackables",
	embeds: [{
		"title": "About trackables",
		"description":
			`With trackables you can release your image to travel across any server. A trackable can be picked up and placed down from server to server. Each person and server is counted on the trackable.\n` +
			`\n` +
			// @ts-ignore
			`[Add Stewbot to your profile](${config.install}) to make and track your own! /trackable create\n` +
			`\n` +
			`If a trackable is not moved for one week, it will be sent to a special channel in [#find-a-trackable](${config.invite}) where **you can pick it up** for a new adventure!`,
		"color": 0x006400,
		"thumbnail": {
			"url": "https://media.discordapp.net/attachments/1221938602397667430/1403786745241272461/OIG2.dPKlYcycwt4DCcIAYeBX.jpg?ex=6898d1c9&is=68978049&hm=4187e9fcf2161b161f45fb467825740450adef00106589d12a07303be7624051&=&width=1708&height=1708"
		},
		"footer": {
			"text": "Stewbot",
			"icon_url": "https://stewbot.kestron.software/stewbot.jpg"
		}
	},
	{
		"description":
			`To celebrate the launch of Trackables, we're giving away one month of Nitro to:\n1. The user who moves the most trackables\n`+
			`2. The creator of the trackable that gets moved the most\n`+
			`\n`+
			`Good luck! Join [Kestron Central](<${config.invite}>) for giveaway updates and to find more trackables!`,
		"fields": [],
		"color": 15764728,
		"title": "🥳 Nitro Giveaway!",
		"footer": {
			"text": "🎉Nitro Giveaway"
		},
		"thumbnail": {
			"url": "https://media.discordapp.net/attachments/1229256619792138351/1404159977987248180/image.png?ex=689b7ee2&is=689a2d62&hm=e8165f6e4c51e37a83921140d15f2125c61089684f76ad7806183824679cfc35&=&format=webp&quality=lossless&width=1843&height=1843"
		}
	}]
}

const expiredText = [
	"A wandering trackable has found its way here",
	"Welcome ${name} to the channel",
	"Here's ${name}, back from his journey",
	"You made it, ${name}",
	"We got a new friend in",
	"Howdy ${name}, say Howdy y'all",
	// "${name} ${name} ${name} ${name} yeah!!!", // This doesn't work if the trackable name is larger than a single word.
	"Welcome to the trackable hang out ${name}",
	"Greetings, esteemed ${name}."
];

const unknownNames = [
	"The Ether",
    "The Void",
	"The Great Beyond",
    "Oblivion",
    "The Quantum Realm",
    "The Wilds",
    "The Unknown",
    "The Abyss",
    "Atlantis",
    "Wherever Socks Go",
	"With the Tupperware Lids"
]

function textAsEmbed(text) {
	return {
		embeds: [
			new EmbedBuilder()
				.setDescription(text)
		]
	}
}

function generateUnknownName() {
	let randomUnknownName = unknownNames[Math.floor(Math.random() * unknownNames.length)];
	return `*${randomUnknownName}*`
}

function generateExpiredText(trackable) {
	let text = expiredText[Math.floor(Math.random() * expiredText.length)];
	text = text.replaceAll("${name}", trackable.name);
	return text;
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
	showPickUpRow=false, pickUpLocked=false, pickedUpBy="", movedOn=false,
	isntHere=false,         // Renders as movedOn but doesn't show "was here" text
	showBanButton=false,    // For mods
	userForCurrentLoc=null, // Pass the interaction for guild / user access - if the user has access to the current location, we'll link it
	droppedBy=""
}) {
	// We let this function generate the entire reply so it's easier to move to components v2

	let { owner, id, name, img, desc, tag, color, layout } = tracker;

	// Filter output
	name = await globalCensor(name);
	desc = await globalCensor(desc);
	tag = await globalCensor(tag);

	let response = {};

	// Link the trackable if visible to the user
	let currentLocation = tracker.currentName;
	let currentChannelId = tracker.current.slice(1);
	if (userForCurrentLoc && tracker.current[0] == "c" && tracker.currentMessageId &&
		await canUserSeeMessage(userForCurrentLoc, tracker.currentGuildId, currentChannelId, tracker.currentMessageId)
	) {
		currentLocation = `https://discord.com/channels/${tracker.currentGuildId}/${currentChannelId}/${tracker.currentMessageId}`
	}

	const embed = new EmbedBuilder()
		.setAuthor({
			name: movedOn ? `${name} was here!` : `${name}`,
			iconURL: movedOn||isntHere ? img : undefined
		})
		// .setTitle(movedOn ? `${inlineCode(name)} was here!` : `${inlineCode(name)}`)
		.setColor(tracker.color)
		.setFooter({ text: `${owner == "special" ? "Special trackable" : "Trackable"} #${id}`, iconURL: trackableIcon });

	let fields = [];

	
	// Only show the current location when it's not in a server 
	if (!showPickUpRow) fields.push({ name: "Current Location", value: currentLocation, inline: true });

	// Reach
	const serverCount = unique(
		tracker.pastLocations
			.filter(loc => loc.startsWith('c')) // Only servers
	).length;
	fields.push({
		name: "Reach",
		value: `${serverCount} server${serverCount==1?"":"s"}`,
		inline: true
	});

	// How many users have had it
	const userCount = unique(
		tracker.pastLocations
			.filter(loc => loc.startsWith('u')) // Only users
	).length
	fields.push({
		name: "Carried By", 
		value: `${userCount} user${userCount==1?"":"s"}`, 
		inline: true
	})

	// Mark old server ones as picked up
	if (pickedUpBy) fields.push({ name: "Picked up by:", value: pickedUpBy, inline: true })
	if (droppedBy) fields.push({ name: "Placed by:", value: droppedBy, inline: true })

	// Images depending on layout
	let description = "";
	if (layout === 0) {
		if (!movedOn&&!isntHere) embed.setThumbnail(img);
		description += `**${tag}**\n`
		if (!movedOn&&!isntHere) description += `─────\n`
		if (!movedOn&&!isntHere) description += `${desc}\n`
	} 
	else if (layout === 1) {
		if (!movedOn&&!isntHere) embed.setImage(img);
		description += `**${tag}**\n`
		if (!movedOn&&!isntHere) description += `─────\n`
		if (!movedOn&&!isntHere) description += `${desc}\n`
	} 
	else if (layout === 2) {
		if (!movedOn&&!isntHere) embed.setImage(img);
	} 
	else if (layout === 3) {
		if (!movedOn&&!isntHere) embed.setImage(img);
		description += `**${tag}**\n`;
	}

	// description += `\n-# Trackable created on <t:${Math.floor(tracker.creationDate / 1000)}:d>`
	fields.push({
		"name": "Created on:", 
		value: `<t:${Math.floor(tracker.creationDate / 1000)}:d>`,
		inline: false
	})

	if (description) embed.setDescription(description.trim())
	
	embed.addFields(fields);
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

function getTrackableEditor(trackable, forMods=false) {
	const { id, name, img, desc, tag, color, layout, } = trackable;

	// Embed
	const embed = new EmbedBuilder()
		.setTitle(`${name}`)
		.setColor(color)
		.setFooter({ text: `Trackable #${id}`, iconURL: trackableIcon });


	// Images depending on layout
	if (layout === 0) {
		embed.setThumbnail(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} 
	else if (layout === 1) {
		embed.setImage(img);
		embed.setDescription(`**${tag}**\n─────\n${desc}`)
	} 
	else if (layout === 2) {
		embed.setImage(img);
	} 
	else if (layout === 3) {
		embed.setImage(img);
		embed.setDescription(`**${tag}**`)
	}

	// Layout select
	let layoutOptions = [
		{ label: 'Thumbnail Image', value: '0' },
		{ label: 'Main Image', value: '1' },
		{ label: 'No Description', value: '3' },
		{ label: 'Clean', value: '2' }
	].map(option => ({ ...option, default: option.value == trackable.layout+"" }));

	const layoutSelect = new StringSelectMenuBuilder()
		.setCustomId('edit_trackable_layout')
		.setPlaceholder('Choose layout type')
		.addOptions(...layoutOptions);

	// Color select
	let colorOptions = [
		{ label: 'Blue', value: '0x00d7ff', emoji: '🔵' },
		{ label: 'Green', value: '0x00ff00', emoji: '🟢' },
		{ label: 'Red', value: '0xff0000', emoji: '🔴' },
		{ label: 'Purple', value: '0x9932cc', emoji: '🟣' }
	].map(option => ({...option, default: option.value == `0x${trackable.color.toString(16).padStart(6, '0')}`}))
	
	const colorSelect = new StringSelectMenuBuilder()
		.setCustomId('edit_trackable_color')
		.setPlaceholder('Choose embed color')
		.addOptions(...colorOptions);

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

	if (forMods) {
		editButtons.push(
			new ButtonBuilder()
				.setCustomId('edit_trackable_img')
				.setLabel('Edit Image URL')
				.setStyle(ButtonStyle.Secondary)
		)
	}

	// Publish button
	const publishButton = new ButtonBuilder()
		.setCustomId('edit_trackable_publish')
		.setLabel('Publish')
		.setStyle(ButtonStyle.Success);

	const components = [
		new ActionRowBuilder().addComponents(layoutSelect),
		new ActionRowBuilder().addComponents(colorSelect),
		new ActionRowBuilder().addComponents(...editButtons)
	]

	if (!forMods) components.push(new ActionRowBuilder().addComponents(publishButton));

	if (forMods) {
		components.push(
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`trackable_ban-${trackable.id}`)
					.setLabel("Ban Trackable")
					.setStyle(ButtonStyle.Danger)
			)
		)
	}

	return {
		content:
			`-# Note: when a trackable is claimed, the image is shrunk into an icon, and the description field is remove. The tag field will stay, even after a trackable is claimed.`,
		embeds: [embed],
		components: components
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
        },
		img: {
            title: 'Edit Image URL',
            label: 'Image URL',
            placeholder: 'https://...',
            maxLength: 500,
            style: TextInputStyle.Short
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
        .setRequired(true)
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

module.exports = {
	getTrackableEmbed,
	getTrackableEditor,

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
			.addSubcommand(command => command.setName("about").setDescription("Learn more about trackables").addBooleanOption(option =>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			))
			.addSubcommand(command => command.setName("create").setDescription("Create your trackable. This will open an editor.")
				.addAttachmentOption(option =>
					option.setName("image").setDescription("The image that you want to make into a trackable").setRequired(true)
				)
			)
			.addSubcommand(command => command.setName("inventory").setDescription("View the trackable currently in your inventory"))
			.addSubcommand(command =>
				command.setName("stats").setDescription("View a trackable with its ID")
					.addStringOption(option =>
						option.setName("id").setDescription("The ID of the trackable you want to view").setRequired(false)
					)
					.addBooleanOption(option =>
						option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
					)
			)
			.addSubcommand(command => command.setName("place").setDescription("Drop your current trackable here")),

		requiredGlobals: [],

		deferEphemeral: {
			"inventory": true,
			"create": true,
			"place": { ephemeral: false, withResponse: true } // We need the response to tell if it was forced ephemeral
		},
		
		help: {
			"about":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Learn more about trackables",
				detailedDesc: `View specific rulesets and descriptions of what the trackable feature does`,
			},
			"create":{
				helpCategories: [ Categories.General, Categories.Entertainment, Categories.Bot ],
				shortDesc: "Create or view stats about your trackable",
				detailedDesc: `See info about where your trackable is now and its statistics, or create one if you haven't yet.`,
			},
			"inventory":{
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
    async execute(cmd, context, deferedResponse) {
		applyContext(context);
		switch(cmd.options.getSubcommand()){
			case "about":
				return await cmd.followUp(aboutTrackables);
			break;
			
			case "create":
				const isUserSudo = await isSudo(cmd.user.id);

				// Verify they don't already have one
				
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

				if (!isUserSudo && usersTrackable?.status == "banned") {
					return cmd.followUp("Sorry, the trackable you created was banned for being inappropriate.");
				}

				if (!isUserSudo && usersTrackable) {
					return cmd.followUp(textAsEmbed(
						// @ts-ignore
						`You already have a trackable, use ${cmds.trackable.stats.mention} to see how far it went!\n` +
						`\n` +
						`Currently, each user only gets one, unchangeable trackable. This will change Soon™️, join [Kestron Central](<${config.install}>) for updates or other support.`
					));
				}

				// Make sure they aren't holding one

				const hasCurrentTrackable = await Trackables.exists({
					status: "published",
					current: `u${cmd.user.id}`
				});
				if (hasCurrentTrackable) {
					// @ts-ignore
					return cmd.followUp(`You already have a trackable in your inventory. Place your current trackable somewhere using ${cmds.trackable.place.mention} before creating one.`);
				}

				// Create it

				if (!isUserSudo && !allowedMimes.includes(attachment.contentType || "")) {
					return cmd.followUp("Image must be one of the supported types: `" + allowedMimes.join("`, `") + "`");
				}

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
					{
						owner: cmd.user.id,
						status: "editing"
					},
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
				// @ts-ignore
				await cmd.followUp({
					...getTrackableEditor(usersTrackable),
					ephemeral: true,
				});


			break;

			case "inventory":
				var tracker = await Trackables.findOne({ 
					current: `u${cmd.user.id}`,
					status: "published"
				});
				if(!tracker){
					return cmd.followUp(textAsEmbed(
						// @ts-ignore
						`You don't have any trackables in your inventory! You can make one with ${cmds.trackable.create.mention} or find others that have been posted.` +
						`You might be able to find timed-out trackables in [#find-a-trackable](<${config.install}>)`
					));
				}
				cmd.followUp({
					ephemeral: true,
					...await getTrackableEmbed(tracker, {"userIdForPlace": cmd.user.id})
				});
			break;
			
			case "stats":
				let trackableId = cmd.options.getString("id")?.trim()?.replace(/^\#/, "")?.trim();
				
				let filter = {
					status: "published"
				}

				if (trackableId) filter.id = trackableId;
				else filter.owner = cmd.user.id;

				var tracker = await Trackables.findOne(filter);
				if(!tracker){
					// @ts-ignore
					return cmd.followUp(
						trackableId 
							? `I didn't find any trackables with that ID!`
							: textAsEmbed(
								`You don't have a trackable!` +
								`\n`+
								// @ts-ignore
								`Create your own with ${cmds.trackable.create.mention}, find others in your servers, or check [#find-a-trackable](<${config.invite}>).`
							),
					);
				}

				// Only show the place button if they they currently hold this one
				const showPlace = tracker.current == `u${cmd.user.id}`;

				cmd.followUp({
					...await getTrackableEmbed(tracker, {
						"userIdForPlace": showPlace ? cmd.user.id : "",
						"userForCurrentLoc": cmd.user.id, 
						"isntHere": true
					})
				});
			break;
			
			case "place":
				var trackable = await Trackables.findOne({
					current: `u${cmd.user.id}`,
					status: "published"
				});

				if (!trackable) {
					return cmd.followUp({
						content: 
							`You don't have a trackable!` +
							`\n`+
							// @ts-ignore
							`Try finding one in your servers, create your own with ${cmds.trackable.create.mention}, or check [#find-a-trackable](<${config.invite}>).`,
						ephemeral: true
					});
				}

				const comingFrom = trackable.current;
				const placingToo = `c${cmd.channelId}`;
				const serverName = cmd.guild?.name;

				const serversSinceTarget = trackable.pastLocations
					.filter(l => l[0] == "c")
					.reverse()
					.indexOf(placingToo);

				if (serversSinceTarget == 0) {
					return cmd.followUp({
						content: "You must post this in a different server than it was last in.",
						ephemeral: true // Again we can't do this ephemerally
					});
				}

				// Check if the post was forced-ephemeral by the server settings.
				if (deferedResponse.interaction.responseMessageEphemeral) {
					return cmd.followUp(
						"This server has prevented your ability to run my commands publicly.\n" +
						"Try posting your trackable in another channel or server."
					);
				}

				trackable.current = placingToo;
				trackable.currentName = serverName ? `A channel in ${inlineCode(serverName)}` : generateUnknownName();
				trackable.pastLocations.push(comingFrom);
				trackable.currentGuildId = cmd.guildId;
				trackable.placed = Date.now();

				// Check if we have access to send directly in the channel
				const message = await cmd.followUp({
					...await getTrackableEmbed(trackable, {
						"showPickUpRow": true
					}),
				}).catch(e => null);

				trackable.currentMessageId = message.id;
				await trackable.save();
				return;
		}
	},

	/** @param {import('discord.js').Interaction} cmd */
	async [Events.InteractionCreate] (cmd) {
		if (!cmd.isStringSelectMenu() && !cmd.isButton() && !cmd.isModalSubmit()) return;

		const isUserSudo = await isSudo(cmd.user.id);
		const isInSudoChannel = cmd.channelId == process.env.trackablesNotices;

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
						content: "Sorry, I couldn't find that trackable.",
						ephemeral: true
					});
				}

				if (trackable.current !== `u${cmd.user.id}`) {
					return cmd.reply({
						content: "You don't have that trackable anymore, so you can't use it.",
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
						"Try posting your trackable in another channel or server." 
					)
				}

				trackable.current = placingToo;
				trackable.currentName = serverName ? `A channel in ${inlineCode(serverName)}` : generateUnknownName();
				trackable.pastLocations.push(comingFrom);
				trackable.currentGuildId = cmd.guildId;
				trackable.placed = Date.now();

				let message;
				
				if (cmd.channel?.isSendable()) {
					message = await cmd.channel.send({
						...await getTrackableEmbed(trackable, {
							"showPickUpRow": true,
							"droppedBy": cmd.user.username
						}),
					}).catch(e => null);

					cmd.deleteReply();
				}
				else {
					// Otherwise reply as a user app
					message = await cmd.followUp({
						...await getTrackableEmbed(trackable, {
							"showPickUpRow": true
						}),
					}).catch(e => null);
				}
				
				trackable.currentMessageId = message?.id;
				await trackable.save();

				return;
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

					const alreadyHoldingTrackable = await Trackables.exists({
						status: "published",
						current: `u${cmd.user.id}`
					});

					if (alreadyHoldingTrackable) {
						return cmd.reply({
							// @ts-ignore
							content: `You already have a trackable in your inventory. Place your current trackable somewhere with ${cmds.trackable.place.mention} before picking up a new one.`,
							ephemeral: true
						});
					}

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
							...textAsEmbed(`Sorry, I couldn't find that trackable. It must have expired, so you might be able to find it in [#find-a-trackable](<${config.invite}>)`),
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
							content: `Let someone else move this trackable first. In the meantime, you can create your own with ${cmds.trackable.create.mention} or find a different Trackable.`,
							ephemeral: true
						});
					} 

					trackable.pastLocations.push(trackable.current);
					trackable.pastLocations.push(`g${cmd.guildId}`); // Also store what guild we're coming from
					trackable.current = goingTo;
					trackable.currentName = `${inlineCode(cmd.user.username)}'s Inventory`
					trackable.placed = Date.now();

					await trackable.save();
					await cmd.update({
						...await getTrackableEmbed(trackable, {
							"showPickUpRow": true, 
							"pickUpLocked": true, 
							"pickedUpBy": cmd.user.username,
							"movedOn": true
						})
					})

					await cmd.followUp({
						...textAsEmbed(
							// @ts-ignore
							`You have picked up this trackable! Now go share it somewhere with ${cmds.trackable.place.mention}\n`+
							`\n`+
							`You can even share it in servers that don't have Stewbot if you [add Stewbot to your apps](<${config.install}>)!`
						),
						ephemeral: true
					})
				}
			}

			// Editing interactions
			if (cmd.customId.startsWith("edit_trackable")) {

				let trackableId = 
					cmd.message.embeds[0]?.data?.footer?.text?.match?.(/(?<=#)\w+/)?.[0] // Most editor interfaces
					|| cmd.customId.split("-").slice(-1)[0] // Publish confirmation

				let trackableData = await Trackables.findOne({ 
					id: trackableId
				});

				if (!isUserSudo && trackableData?.owner !== cmd.user.id) {
					return cmd.reply({
						content: "Sorry, you don't seem to own this trackable.",
						ephemeral: true
					});
				}

				if (!trackableData) {
					return cmd.reply({
						content: "Sorry, I couldn't find that trackable.",
						ephemeral: true
					});
				}
				
				if (!isUserSudo && trackableData.status !== "editing") {
					return cmd.reply({
						content: `This trackable has ${trackableData.status == "published" ? "already been published." : "been banned."}`,
						ephemeral: true
					})
				}
				
				// Add editing interactions
				if (cmd.isStringSelectMenu()) {
					if (cmd.customId === 'edit_trackable_layout') {
						trackableData.layout = parseInt(cmd.values[0]);
						trackableData.save();

						// Update the message with new layout
						// @ts-ignore
						await cmd.update({
							...getTrackableEditor(trackableData, isInSudoChannel)
						});
					}
					else if (cmd.customId === 'edit_trackable_color') {
						// @ts-ignore
						trackableData.color = cmd.values[0];
						trackableData.save();

						// Update the message with new color
						// @ts-ignore
						await cmd.update({
							...getTrackableEditor(trackableData, isInSudoChannel)
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
					else if (cmd.customId === 'edit_trackable_img') {
						const modal = createEditModal('img', trackableData.img);
						await cmd.showModal(modal);
					}
					else if (cmd.customId === 'edit_trackable_publish') {
						const hasCurrentTrackable = await Trackables.exists({
							status: "published",
							current: `u${cmd.user.id}`
						});
						if (hasCurrentTrackable) {
							return cmd.reply("You already have a trackable in your inventory. Place your current trackable somewhere before creating one.");
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
										.setStyle(ButtonStyle.Secondary),
									new ButtonBuilder()
										.setCustomId('edit_trackable_publish_yes-' + trackableData.id)
										.setLabel('Yes')
										.setStyle(ButtonStyle.Primary)
								]).toJSON()
							]
						})

						// return cmd.showModal(
						// 	new ModalBuilder()
						// 		.setCustomId('edit_trackable_publish_confirm')
						// 		.setTitle('Are you sure you want to publish this? You can\'t edit it once published.')
						// )
					}
					
					else if (cmd.customId === 'edit_trackable_publish_no') {
						cmd.update({
							content: "Publishing canceled.",
							components: []
						})
					}

					else if (cmd.customId.startsWith('edit_trackable_publish_yes')) {
						const hasCurrentTrackable = await Trackables.exists({
							status: "published",
							current: `u${cmd.user.id}`
						});
						if (hasCurrentTrackable) {
							return cmd.reply("You already have a trackable in your inventory. Place your current trackable somewhere before creating one.");
						}

						trackableData.status = "published"
						trackableData.current = `u${cmd.user.id}`
						await trackableData.save();

						await cmd.reply({
							// @ts-ignore
							content: `Trackable published!\n\nNow you can send it somewhere with ${cmds.trackable.place.mention}. If you install Stewbot to your profile, you can even send it in servers that don't use Stewbot!`,
							ephemeral: true
						});

						// Notify us
						trackablesNotices.send({
							...await getTrackableEditor(trackableData, true),
							content:`<@${cmd.user.id}> made a new trackable.`,
						});
					}
				}

				else if (cmd.isModalSubmit()) {
					// These all have additional handling at the end
					if (cmd.customId === 'edit_trackable_name') {
						trackableData.name = cmd.fields.getTextInputValue('name_input');
						trackableData.name = trackableData.name.replaceAll(":", "");           // Don't allow emojis, because of stars
						trackableData.name = trackableData.name.replace(/[^\x00-\x7F]/g, '');
					}
					else if (cmd.customId === 'edit_trackable_tag') {
						trackableData.tag = cmd.fields.getTextInputValue('tag_input');
					}
					else if (cmd.customId === 'edit_trackable_desc') {
						trackableData.desc = cmd.fields.getTextInputValue('desc_input');
					}
					else if (cmd.customId === 'edit_trackable_img') {
						trackableData.img = cmd.fields.getTextInputValue('img_input');
					}

					trackableData.save();

					// @ts-ignore
					return await cmd.update({
						...getTrackableEditor(trackableData, isInSudoChannel),
						ephemeral: !isInSudoChannel,
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
					content: 'An error occurred while updating the trackable.',
					ephemeral: true
				});
			}
			// Throw up chain
			throw error;
		}
	},

	async [Events.ClientReady] () {
		trackablesNotices = await client.channels.fetch(process.env.trackablesNotices);
		trackablesHub = await client.channels.fetch(process.env.trackablesArchive);

		// We can't use cmds outside the module exports so add it at boot
		aboutTrackables.embeds[0].description = aboutTrackables.embeds[0].description
			// @ts-ignore
			.replaceAll("/trackable create", cmds.trackable.create.mention)
	},

	async daily() {
		let timeoutLimit = ms("7d");
		// let timeoutLimit = ms("1s");
		let olderThan = Date.now() - timeoutLimit;

		let hubLoc = `c${trackablesHub.id}`;

		const expiredFilter = {
			status: "published",
			placed: { $lt: olderThan },
			current: { $ne: hubLoc }
		}

		let expiredTrackables = await Trackables.find(expiredFilter);

		await Trackables.updateMany(expiredFilter, [
			{
				$set: {
					placed: Date.now(),
					current: hubLoc,
					currentName: `[#find-a-trackable](<${config.invite}>)`,
					pastLocations: {
						$concatArrays: [
							{ $ifNull: ["$pastLocations", []] },
							{
								$cond: [
									{ $ne: ["$current", null] },
									[{ $toString: "$current" }],
									[]
								]
							},
							// [hubLoc]
						]
					}
				}
			},
			{
				$unset: ["currentGuildId", "currentMessageId"]
			}
		]);


		// Repost each Trackable to the archive
		for (const trackable of expiredTrackables) {
			// Await to avoid ratelimits
			await trackablesHub?.send({
				content: 
					generateExpiredText +
					"-# This trackable timed out! It will sit here until someone picks it up.",
				...await getTrackableEmbed(trackable, {
					"showPickUpRow": true
				})
			}).catch(console.log)
		}
	}
};
