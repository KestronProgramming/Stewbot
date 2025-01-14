const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
const { chmodSync } = require("fs");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

module.exports = {
	data: {
		command: new SlashCommandBuilder().setName('birthday').setDescription('Configure different birthday stuff').addSubcommand(command=>
            command.setName("set_birthday").setDescription("Set your birth month and day").addIntegerOption(option=>
                option.setName("birthday").setDescription("Set your birthday").setMinValue(1).setMaxValue(31)
            ).addIntegerOption(option=>
                option.setName("birthmonth").setDescription("Set your birthmonth").setChoices(
                    {name:"January",value:1},
                    {name:"February",value:2},
                    {name:"March",value:3},
                    {name:"April",value:4},
                    {name:"May",value:5},
                    {name:"June",value:6},
                    {name:"July",value:7},
                    {name:"August",value:8},
                    {name:"September",value:9},
                    {name:"October",value:10},
                    {name:"November",value:11},
                    {name:"December",value:12}
                )
            ).addIntegerOption(option=>
                option.setName("birthyear").setDescription("Set your birthyear").setRequired(false)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
            )
        ).addSubcommand(command=>
            command.setName("change_publicity").setDescription("Change the publicity of your birthday")
        ),
		extra: {"contexts": [0,1,2], "integration_types": [0,1]},
        /*
            Contexts
             - 0: Server command
             - 1: Bot's DMs
             - 2: User command

            Integration Types:
             - 0: Installed to servers
             - 1: Installed to users
        */

		
		requiredGlobals: ["defaultUser"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
		
		// detailedHelp:
		// 	"## Ping" + 
		// 	"The `ping` command is used to test how fast Stewbot's connection is responding to events." +
		// 	"This command is also used to provide detailed information about the bot." +
		// 	"-# This is a detailed help message, and is primarily meant as a code example."
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(!storage[cmd.user.id].hasOwnProperty("birthday")){
            storage[cmd.user.id].birthday=structuredClone(defaultUser.birthday);
        }
        switch(cmd.options.getSubcommand()){
            case "set_birthday":
                if(cmd.options.getInteger("birthmonth")===null&&cmd.options.getInteger("birthday")!==null||cmd.options.getInteger("birthday")===null&&cmd.options.getInteger("birthmonth")!==null){
                    cmd.followUp("You must set either BOTH month and day, or just year, or all three.")
                    break;
                }
                if(cmd.options.getInteger("birthmonth")===null&&cmd.options.getInteger("birthday")===null&&cmd.options.getInteger("birthyear")===null){
                    cmd.followUp(`To delete your birthday, use ${cmds.birthday.change_publicity}.`);
                    break;
                }
                cmd.followUp(`Awesome, I will remember your birthday as ${[null,"January","February","March","April","May","June","July","August","September","October","November","December"][cmd.options.getInteger("birthmonth")]}/${cmd.options.getInteger("birthday")}/${cmd.options.getInteger("birthyear")}. You will need to run the ${cmds.birthday.change_publicity} command to allow your birthday to be seen in ${cmd.options.getBoolean("private")?``:`other `}any server individually${cmd.options.getBoolean("private")?`, including this one`:``}.`);
            break;
            case "change_publicity":
                /*
                    This command must be run for each server it should be public in (Including the server they ran setBirthday in). Add a toggle to publicize the year or not to.
                */
                cmd.followUp(`Birthdays are still WIP, they're not stored yet - no publicity changes available to make!`);
            break;
            case "channel_config":
                /*
                    Configure a message and channel to post "Happy Birthday" messages into. Allow for "Florida Man" and "This day in history" additions - other fun things of the sort if we can think of some
                */
            break;
            case "role_config":
                /*
                    Allow a role to be added to all users over or under X age, these roles ignore whether year was set to publicize but do not show the specific year. (Can age restrict certain channels with more flexibility than "Be 18")
                */
            break;
        }
	}
};
