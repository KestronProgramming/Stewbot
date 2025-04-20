// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

// 
// TEMPLATE.js is an exhaustive template showcasing every feature available to modules.
//  Any module/command can be derived from these.
// 


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
			.setName('birthday_giveaway').setDescription('Jerry Jerry Jerry Jerry Yeah!!!').addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")//Do not remove private option unless the command is REQUIRED to be ephemeral or non-ephemeral.
            ),
		
		////// Optional fields below this point //////

		// For breaking discord API changes, inject extra command metadata here
		// extra: {},

		// When this command defers, should it be ephemeral? (if the private option is defined, it can override this)
		// deferEphemeral: false,

		// A priority calling system for handlers like onmessage, only use when required. Smaller = loaded sooner, default = 100
		// priority: 100,

		// Allow variables from the global index file to be accessed here - requiredGlobals["helpPages"]
		requiredGlobals: [],

		help: {
			helpCategories: [ Categories.General ],
			shortDesc: "Jerry Jerry Jerry Jerry Yeah!!!",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Jerry the Rope!\n
				Jerry brings hope.\n
				Jerry's never tied up\n
				Jerry helps you in your 'trub\n
				Yeah! Jerry!`,

			// If this module can't be blocked, specify a reason
			// block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		var entries={};
		var log="";
		await cmd.guild.members.fetch();
		(await cmd.guild.roles.fetch("1359440374141292594")).members.forEach(entrant=>{
            entries[entrant.id]=1;
            log+=(entrant.id+" is in");
        });
        await client.guilds.cache.forEach(async guild=>{
            log+=("Checking "+guild.id);
            await guild.members.fetch().then(members=>{
				members.forEach(member=>{
					if(entries.hasOwnProperty(member.id)&&guild.memberCount>=50){
						entries[member.id]++;
						log+=("+1 to "+member.user.username+" for being in "+member.guild.name+" with "+guild.memberCount+" members.");
					}
				});
			});
        });
		setTimeout(()=>{
			fs.writeFileSync("log.txt",log);
			fs.writeFileSync("entries.json",JSON.stringify(entries));
			var finalEntries=[];
			Object.keys(entries).forEach(entry=>{
				for(var i=0;i<entries[entry];i++){
					finalEntries.push(entry);
				}
			});
			var winners=[];
			for(var i=0;i<3;i++){
				var potentialWinner=finalEntries[Math.floor(Math.random()*finalEntries.length)];
				if(winners.includes[potentialWinner]){
					i--;
				}
				else{
					winners.push(potentialWinner);
				}
			}
			fs.writeFileSync("finalEntries.json",JSON.stringify(finalEntries));
			cmd.followUp({content:`We have our lucky winners!\n<@${winners[0]}>, <@${winners[1]}>, and <@${winners[2]}>!!!`,files:["log.txt","entries.json","finalEntries.json"]});
		},60000*14);
	}
};