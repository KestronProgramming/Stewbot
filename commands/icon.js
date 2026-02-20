// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js");
const { AttachmentBuilder, Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

//
// TEMPLATE.js is an exhaustive template showcasing every feature available to modules.
//  Any module/command can be derived from these.
//

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName("icon")
            .setDescription("Retrieve a specified PFP of a user or server.")
            .addBooleanOption(option=>
                option.setName("server").setDescription("Return the server's PFP?")
            )
            .addUserOption(option=>
                option.setName("user").setDescription("The user who's PFP you would like returned")
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),
        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General],
            shortDesc: "Retrieves a specified PFP of a server or user", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Using this command you can retrieve a PFP icon of a server or user in a downloadable form.`
        }
    },

    async execute(cmd, context, deferredResponse) {
        applyContext(context);
        let icon;
        let name=cmd.options.getUser("user")?cmd.options.getUser("user").id:cmd.user.id;
        if(cmd.guild?.id){
            if(cmd.options.getBoolean("server")){
                icon=cmd.guild.iconURL();
                name=cmd.guild.id;
            }
            else if(cmd.options.getUser("user")){
                const mentionedMember=await cmd.guild.members.fetch(cmd.options.getUser("user").id);
                icon=mentionedMember?mentionedMember.displayAvatarURL():cmd.options.getUser("user").displayAvatarURL();
            }
            else{
                icon=cmd.member?.displayAvatarURL()?cmd.member.displayAvatarURL():cmd.user.displayAvatarURL();
            }
        }
        else if(cmd.options.getUser("user")){
            icon=cmd.options.getUser("user").displayAvatarURL();
        }
        else{
            icon=cmd.user.displayAvatarURL();
        }

        if(!icon){
            cmd.followUp(`I was unable to retrieve that PFP.`);
            return;
        }
        icon=new AttachmentBuilder(icon, { name: `${name}-icon.${icon.split(".")[icon.split(".").length-1]}` });

        cmd.followUp({content:`Retrieved the PFP of ${(name===cmd.guild?.id)?`**${cmd.guild.name}**`:`<@${name}>`}.`,files:[icon],allowedMentions:{parse:[]}});
    }
};
