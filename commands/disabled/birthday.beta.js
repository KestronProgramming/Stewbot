// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

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
                    option.setName("birthyear").setDescription("Set your birthyear").setMinValue(new Date().getFullYear()-120).setRequired(false)
                ).addBooleanOption(option=>
                    option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
                )
            ).addSubcommand(command=>
                command.setName("change_publicity").setDescription("Change the publicity of your birthday").addStringOption(option=>
                        option.setName("global").setDescription("Set your publicity for this server or for all servers?").addChoices(
                            {name:"All servers",value:"true"},
                            {name:`Just this server`,value:"false"}
                        ).setRequired(true)
                    ).addBooleanOption(option=>
                        option.setName("birthday").setDescription("Should your birthmonth and day be publicized?").setRequired(true)
                    ).addBooleanOption(option=>
                        option.setName("birthyear").setDescription("Should your birthyear be publicized?").setRequired(true)
                    ).addBooleanOption(option=>
                        option.setName("delete_all").setDescription("Delete your birthday from all of Stewbot?")
                    ).addBooleanOption(option=>
                        option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral
                    )
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

		
		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Information, Categories.Entertainment, Categories.Configuration],
			shortDesc: "Upload an emoji from another server to use in this one",
			detailedDesc: 
				`This command will copy an emoji from another server here. Use Prime Emoji in another server to start the process, and then use clone from primed emoji to bring it here. Use clone from emoji ID to find the emoji using the emoji ID, clone from a Nitro emoji to enter the emoji using Nitro directly, etc.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
        /*
            Default all new servers to public off, unless the last time global was run it was set to true
            
            guildUser:{
                publicDay:true
                publicYear:true
            }
            
            user:{
                birthday:9,
                birthmonth:8,
                birthyear:2001,
                defaultDayPublic:false //ONLY set to true if publicize has had global been set to true, and set to false if the reverse is done
                defaultYearPublic:false // See above
            }
        */
		
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
                    cmd.followUp(`To delete your birthday, use ${cmds.birthday.change_publicity.mention}. If you're trying to set your birthday, specify a birthday/month and/or birthyear.`);
                    break;
                }
                if(cmd.options.getInteger("birthyear")!==null&&new Date().getFullYear()-cmd.options.getInteger("birthyear")<13){//TODO: Check that there aren't specific day ranges within that 13th year that make the user 13 but fail this check, and adjust the check if so
                    cmd.followUp(`I cannot accept users of this age.`);
                    break;
                }

                if(cmd.options.getInteger("birthday")!==null){
                    storage[cmd.user.id].birthday=cmd.options.getInteger("birthday");
                    storage[cmd.user.id].birthmonth=cmd.options.getInteger("birthmonth");
                    if(cmd.guild?.id) storage[cmd.guild.id].users[cmd.user.id].publicDay=cmd.options.getBoolean("private")===null?true:cmd.options.getBoolean("private");
                }
                if(cmd.options.getInteger("birthyear")!==null){
                    storage[cmd.user.id].birthyear=cmd.options.getInteger("birthyear");
                    if(cmd.guild?.id) storage[cmd.guild.id].users[cmd.user.id].publicYear=cmd.options.getBoolean("private")===null?true:cmd.options.getBoolean("private");
                }
                cmd.followUp(`Alright, I will remember your birthday as ${[null,"January","February","March","April","May","June","July","August","September","October","November","December"][cmd.options.getInteger("birthmonth")]}/${cmd.options.getInteger("birthday")}, ${cmd.options.getInteger("birthyear")}. You will need to run the ${cmds.birthday.change_publicity} command to allow your birthday to be seen in **any ${cmd.options.getBoolean("private")?`**`:`other** `}server individually${cmd.options.getBoolean("private")?`, including this one`:``}.`);
            break;
            case "change_publicity":
                if(cmd.options.getBoolean("delete_all")){
                    cmd.followUp({content:`# ⚠️ Are you sure?\nThis will delete your birthday across ALL of Stewbot.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`birthday-delete-${cmd.user.id}`).setLabel("Yes").setStyle(ButtonStyle.Danger))],ephemeral:true});
                    break;
                }
                if(cmd.options.getStringOption("global")==="true"){
                    storage[cmd.user.id].defaultDayPublic=cmd.options.getBooleanOption("birthday");
                    storage[cmd.user.id].defaultYearPublic=cmd.options.getBooleanOption("birthyear");
                    Object.keys(storage).forEach(key=>{
                        if(storage[key].hasOwnProperty("users")&&storage[key]?.users?.hasOwnProperty(cmd.user.id)){
                            storage[key].users[cmd.user.id].publicDay=cmd.options.getBooleanOption("birthday");
                            storage[key].users[cmd.user.id].publicYear=cmd.options.getBooleanOption("birthyear");
                        }
                    });
                }
                else if(!cmd.guild?.id){
                    cmd.followUp(`You must either run this in the server you want to make publicity changes for, or set global to All Servers.`);
                    break;
                }
                else{
                    storage[cmd.guild.id].users[cmd.user.id].publicDay=cmd.options.getBoolean("birthday");
                    storage[cmd.guild.id].users[cmd.user.id].publicYear=cmd.options.getBoolean("birthyear");
                }
                cmd.followUp(`Alright, I have set it to ${cmd.options.getBoolean("birthday")?``:`not `}publicize your birthday, and to ${cmd.options.getBoolean("birthyear")?``:`not `}publicize your birthyear in ${cmd.options.getString("global")==="true"?`__all__ servers you are in`:`just this server`}.`);
            break;
        }
	}
};
