process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder,ContextMenuCommandBuilder,ApplicationCommandType,ChannelType} = require('discord.js');
const fs=require("fs");
const path = require("path")


//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
//Don't enable anything in DMs that is unusable in DMs (server configurations, multiplayer reliant commands, etc)

//This is a temporary way of specifying what contexts and where the command should appear while we await Discord.js' official implementation
/*
Contexts
0: Normal server usage
1: DMs with the Bot directly
2: User command from anywhere

Integration Types
0: Only as a server command
1: Only as a user command
*/
/*
categories=[//For auto generated help pages
	"General Bot Usage",//0
	"Reference",//1
	"Multiplayer",//2
	"Supporting Command",//3
	"Entertainment",//4
	"Administration",//5
	"Configuration"//6
];*/
const extraInfo={
	//Slash commands
	"starboard_config":{"contexts":[0],"integration_types":[0],"cat":6},
	// "chat":{"contexts":[0,1,2],"integration_types":[0,1],"cat":4},
	"embed_message":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"timestamp":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"captcha":{"contexts":[1],"integration_types":[0,1]},
	"unavailable":{"contexts":[0,1,2],"integration_types":[0,1],"cat":2},
	"user":{"contexts":[0],"integration_types":[0],"cat":1},
	"rss":{"contexts":[0],"integration_types":[0],"cat":6},
	"set_persistent_message":{"contexts":[0],"integration_types":[0],"cat":6},
	"rock_paper_scissors":{"contexts":[0,1,2],"integration_types":[0,1],"cat":4},
	"delete":{"contexts":[0],"integration_types":[0],"cat":5},
	"timer":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"chronograph":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"warn":{"contexts":[0],"integration_types":[0],"cat":5},
	"warnings":{"contexts":[0],"integration_types":[0],"cat":5},

	//Context Menu Commands
	"submit_meme":{"contexts":[0,1,2],"integration_types":[0,1],"cat":2,"desc":"Submit a meme to the Kestron moderators for verification to show up in `/fun meme`"},
	"translate_message":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1,"desc":"Attempt to autodetect the language of a message and translate it"},
	"move_message":{"contexts":[0],"integration_types":[0],"cat":5,"desc":"Move a message from one channel into another"},
	//"delete_message":{"contexts":[0,1],"integration_types":[0],"cat":5,"desc":"Delete a message using Stewbot; can be used to delete Stewbot DMs"},
	"remove_embeds":{"contexts":[0],"integration_types":[0],"cat":5,"desc":"Remove embeds from a message"},
	"prime_embed":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1,"desc":"Get a message ready to be embedded using /embed_message"}
};
let commands = [
	/*
	new SlashCommandBuilder().setName("starboard_config").setDescription("Configure starboard for this server").addBooleanOption(option=>
			option.setName("active").setDescription("Should I post messages to the configured channel?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post messages to (Required for first config)").addChannelTypes(ChannelType.GuildText)
		).addStringOption(option=>
			option.setName("emoji").setDescription("The emoji to react with to trigger starboard (Default: ⭐)")
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
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),*/
	// new SlashCommandBuilder().setName("chat").setDescription("Chat with the bot").addStringOption(option=>
	// 		option.setName("what").setDescription("What to say").setRequired(true)
	// 	).addBooleanOption(option=>
	// 		option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
	// 	),
	new SlashCommandBuilder().setName("embed_message").setDescription("Embed a message link from another channel or server").addStringOption(option=>
			option.setName("link").setDescription("The message link, or PRIMED if you used the /prime_embed context menu command").setRequired(true)
		),
	new SlashCommandBuilder().setName("timestamp").setDescription("Generate a timestamp for use in your message"),
	new SlashCommandBuilder().setName("captcha").setDescription("Use this command if I've timed you out for spam"),
	new SlashCommandBuilder().setName("user").setDescription("Display a user's profile").addBooleanOption(option=>
			option.setName("large-pfp").setDescription("Display the PFP in large mode?")
		).addUserOption(option=>
			option.setName("who").setDescription("Who do you want to display?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("rss").setDescription("Commands relating to RSS feeds").addSubcommand(command=>
			command.setName("follow").setDescription("Follow an RSS feed").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to follow this RSS feed in").setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
			).addStringOption(option=>
				option.setName("feed").setDescription("The feed to follow").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("unfollow").setDescription("Unfollow an RSS feed").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to unfollow this RSS feed from").setRequired(true)
			).addStringOption(option=>
				option.setName("feed").setDescription("The feed to unfollow (Type 'all' to unfollow all)").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("check").setDescription("Check the RSS feeds a channel follows").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to check RSS feeds for").setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	new SlashCommandBuilder().setName("set_persistent_message").setDescription("Set a message that will ALWAYS be visible as the latest message posted in this channel").addBooleanOption(option=>
			option.setName("active").setDescription("Should the persistent message be actively run in this channel?").setRequired(true)
		).addStringOption(option=>
			option.setName("content").setDescription("The message to have persist").setMinLength(1)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	new SlashCommandBuilder().setName("delete").setDescription("Delete messages").addIntegerOption(option=>
			option.setName("amount").setDescription("The amount of the most recent messages to delete").setMinValue(1).setMaxValue(100).setRequired(true)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	new SlashCommandBuilder().setName("warn").setDescription("Warn a user for bad behaviour").addUserOption(option=>
			option.setName("who").setDescription("Who are you warning?").setRequired(true)
		).addStringOption(option=>
			option.setName("what").setDescription("What did they do?")
		).addIntegerOption(option=>
			option.setName("severity").setDescription("On a scale from 1 to 10, how would you rate the severity?").setMinValue(1).setMaxValue(10)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
	new SlashCommandBuilder().setName("warnings").setDescription("See the warnings that have been dealt in the server").addUserOption(option=>
			option.setName("who").setDescription("Do you want to see the warnings for a specific person?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
	/*new SlashCommandBuilder().setName("timer").setDescription("Set a timer").addIntegerOption(option=>
			option.setName("minutes").setDescription("Amount of minutes").setMinValue(0).setMaxValue(59).setRequired(true)
		).addIntegerOption(option=>
			option.setName("hours").setDescription("Amount of hours").setMinValue(0).setMaxValue(6)
		).addIntegerOption(option=>
			option.setName("seconds").setDescription("Amount of seconds").setMinValue(0).setMaxValue(59)
		),
	new SlashCommandBuilder().setName("chronograph").setDescription("Start a stopwatch"),*/

	new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("delete_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),//Leaving this in DMs to delete undesirable bot DMs
	new ContextMenuCommandBuilder().setName("translate_message").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("move_message").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("prime_embed").setType(ApplicationCommandType.Message)
]


// Load in migrated commands
const migratedCommands = {}
for (file of fs.readdirSync("./commands")) {
    if (path.extname(file) === ".js") {
        const commandName = path.parse(file).name;
        const command = require("./commands/"+commandName)
        migratedCommands[commandName] = command;
    }
}
for (let commandName in migratedCommands) {
	const command = migratedCommands[commandName];
	if (command?.data) {
		commands.push(command.data.command);
	}
	if (command?.data?.extra) {
		extraInfo[commandName] = command.data.extra;
	}
}


// Inject extra data that discord.js doesn't/didn't support natively
commands = commands.map(command => Object.assign(command.toJSON(),extraInfo[command.toJSON().name]));
function launchCommands(){
	// Register
	const rest = new REST({ version: '9' }).setToken(process.env.token);
	var comms={};
	rest.put(Routes.applicationCommands(process.env.clientId),{body:commands}).then(d=>{
		d.forEach(c=>{
			comms[c.name]={
				mention:`</${c.name}:${c.id}>`,
				id:c.id,
				name:c.name,
				description:c.description,
				contexts:c.contexts,
				integration_types:c.integration_types,
				type:c.type,
				default_member_permissions:c.default_member_permissions
			};
			if(c.hasOwnProperty("options")){
				c.options.forEach(o=>{
					if(o.type===1){
						comms[c.name][o.name]={
							mention:`</${c.name} ${o.name}:${c.id}>`,
							id:c.id,
							name:o.name,
							description:o.description,
							contexts:c.contexts,
							integration_types:c.integration_types,
							type:o.type,
							default_member_permissions:c.default_member_permissions
						};
					}
				});
			}
		});
		fs.writeFileSync("./data/commands.json",JSON.stringify(comms));
		console.log("Updated commands on Discord and wrote commands to ./commands.json");
	}).catch(console.error);

	// Register stewbot-devadmin-only commands
	const devadminCommands = [
		new SlashCommandBuilder()
			.setName('restart')
			.setDescription('Restart the bot')
			.addBooleanOption(option=>
				option.setName("update").setDescription("Update git and npm before restarting").setRequired(false)
			)
			.addBooleanOption(option=>
				option.setName("update_commands").setDescription("Run launchCommands.js before restarting").setRequired(false)
			)
	]
	rest.put(
		Routes.applicationGuildCommands(process.env.clientId, "983074750165299250"),
		{ body: devadminCommands },
	);
}

// Run if being run directly
if (require.main == module) {
	launchCommands();
}