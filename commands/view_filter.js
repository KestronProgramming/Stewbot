// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const fs = require("node:fs")

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("view_filter").setDescription("View the list of blacklisted words for this server").setDMPermission(false).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			),
		extra: {"contexts":[0],"integration_types":[0]},
		
		// Optional fields
		requiredGlobals: [],

		help: {
			helpCategories: ["Information","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator privileges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "View the list of blacklisted words for this server",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Using this command will add a button that allows those who press it to view a spoilered list of all words this server has configured to block. This command, due to the nature of it, can have some very colorful language contained within the DM after pressing the button.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		if(storage[cmd.guildId].filter.blacklist.length>0&&storage[cmd.guildId].filter.active){
			cmd.followUp({"content":`## ⚠️ Warning\nWhat follows _may_ be considered dirty, or offensive, as these are words that **${cmd.guild.name}** has decided to not allow.\n-# If you would like to continue, press the button below.`,"components":[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('view_filter').setLabel('DM me the blacklist').setStyle(ButtonStyle.Danger))]});
		}
		else{
			cmd.followUp(`This server doesn't have any words blacklisted at the moment. To add some, you can use ${cmds.filter.add.mention}.`);
		}
    },

	subscribedButtons: ["view_filter", "export", /delete-.*/],
	async onbutton(cmd, context) {
		applyContext(context);

		switch (cmd.customId) {
			case "view_filter":
				cmd.user.send({
					content: `The following is the blacklist for **${ cmd.guild.name}** as requested.\n\n||${storage[cmd.guildId].filter.blacklist.join("||, ||")}||`,
					components: [new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("delete-all").setLabel("Delete message").setStyle(ButtonStyle.Danger), 
						new ButtonBuilder().setCustomId("export").setLabel("Export to CSV").setStyle(ButtonStyle.Primary),
					)],
				});
				cmd.deferUpdate();
			break;
			case "export":
				var bad=cmd.message.content.match(/\|\|\w+\|\|/gi).map(a=>a.split("||")[1]);
				fs.writeFileSync("./badExport.csv",bad.join(","));
				cmd.reply({ephemeral:true,files:["./badExport.csv"]}).then(()=>{
					fs.unlinkSync("./badExport.csv");
				});
			break;
        
		}

		// NOTE: this command is just handled here, it's a useful button that can be put anywhere on stewbot's responses
		if(cmd.customId?.startsWith("delete-")){
			if(cmd.user.id===cmd.customId.split("-")[1]||cmd.customId==="delete-all"||cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages)){
				cmd.message.delete();
			}
			else{
				cmd.reply({content:`I can't do that for you just now.`,ephemeral:true});
			}
		}
	}
};
