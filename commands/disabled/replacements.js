// #region CommandBoilerplate
const Categories = require("../modules/Categories");
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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
			.setName('jerry').setDescription('Jerry Jerry Jerry Jerry Yeah!!!').addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),
		
		requiredGlobals: [],

		help: {
			helpCategories: [Categories.General, Categories.Information, Categories.Bot],
			shortDesc: "A list of replacements for text inputs",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`View a list of replacements you can type into Stewbot's text inputs that will be dynamically replaced - such as \n for a line break, or \${@USER} to ping the user in some commands.`,

			// If this module can't be blocked, specify a reason
			// block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
	},

    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {UserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context) {
		applyContext(context);
	},
    
    replacements(inp,options={},disabled=[]){
        var replacements={
            "\\n":"\n",
            "<br>":"\n",
            "${@USER}":`${options.userPing}`,
            "${USER}":`${options.username}`,
            "${NAME}":`${options.userGlobalname}`,
            "${NICK}":`${options.userNick}`,
            "${YEAR}":`${options.userYear}`,
            "${MONTH}":`${options.userMonth}`,
            "${DAY}":`${options.userDay}`,
            "${AGE}":`${options.userAge}`
        };
        Object.keys(replacements).forEach(r=>{
            if(replacements[r]!=="null"&&replacements[r]!=="undefined"&&!disabled.includes(r)){
                inp=inp.replace(new RegExp(`(?<!\\)${r}`));
            }
        });
        //console.log(replacements("Hello,\nThis is a test of \\n, and seeing if I can make Regex to get it to work.\nHopefully \\n does!\n${@USER}"));
        return inp;
    }
};
