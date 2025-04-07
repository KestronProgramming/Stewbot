// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const captchaButtons = [
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("captcha-1").setLabel("1").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-2").setLabel("2").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-3").setLabel("3").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("captcha-4").setLabel("4").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-5").setLabel("5").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-6").setLabel("6").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("captcha-7").setLabel("7").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-8").setLabel("8").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-9").setLabel("9").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("captcha-back").setEmoji("❌").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("captcha-0").setLabel("0").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("captcha-done").setEmoji("✅").setStyle(ButtonStyle.Success)
    ),
];

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("captcha").setDescription("Use this command if I've timed you out for spam"),
		
		// Optional fields
		
		extra: {"contexts":[1],"integration_types":[0,1]},

		requiredGlobals: [],

		help: {
			helpCategories: [""],
			shortDesc: "This command is used in the event of an automatic spam timeout",
			detailedDesc: 
				`If I detect a hacked or spam account, I will require the user to run this command before being untimeouted. Simply press the buttons to enter the displayed code and press enter.`
		},
	},

	/** @param {import('discord.js').Interaction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		
		var captcha="";
		for(var ca=0;ca<5;ca++){
			captcha+=Math.floor(Math.random()*10);
		}
		cmd.followUp({content:`Please enter the following: \`${captcha}\`\n\nEntered: \`\``,components:captchaButtons});
	},

	subscribedButtons: [/captcha-.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("captcha-")){
			var action=cmd.customId.split("captcha-")[1];
			if(action==="done"){
				if(cmd.message.content.split("Entered: ")[1].replaceAll("`","")===cmd.message.content.split("`")[1]){
					cmd.update({content:`Thank you.`,components:[]});
					
					const user = await userByObj(cmd.user);

					user.captcha=false;
					user.lastHash="";
					user.hashStreak=0;
					for(var to=0;to<user.timedOutIn.length;to++){
						try{
							client.guilds.fetch(user.timedOutIn[to]).then(guild=>{
								guild.members.fetch().then(members=>{
									members.forEach(m=>{
										if(m.id===cmd.user.id){
											m.timeout(null);
											user.safeTimestamp=new Date();
										}
									});
								});
							});
						}catch(e){console.log(e)}
						user.timedOutIn.splice(to,1);
						to--;
					}

					user.save();
				}
				else{
					cmd.message.delete();
				}
			}
			else if(action==="back"){
				var inp=cmd.message.content.split("Entered: ")[1].replaceAll("`","");
				if(inp.length>0){
					inp=inp.slice(0,inp.length-1);
				}
				cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: \`${inp}\``);
			}
			else{
				cmd.update(`${cmd.message.content.split("Entered: ")[0]}Entered: \`${cmd.message.content.split("Entered: ")[1].replaceAll("`","")}${action}\``);
			}
		}
	}
};
