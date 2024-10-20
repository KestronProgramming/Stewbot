// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("random").setDescription("Get something random")
			.addSubcommand(command=>
				command.setName("rng").setDescription("Generate a random number").addIntegerOption(option=>
					option.setName("low").setDescription("Lower bound of the random number? (Default: 1)")
				).addIntegerOption(option=>
					option.setName("high").setDescription("Upper bound of the random number? (Default: 10)")
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("coin-flip").setDescription("Flip a number of coins").addIntegerOption(option=>
					option.setName("number").setDescription("How many coins should I flip?").setMinValue(1).setMaxValue(10)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("8-ball").setDescription("Ask a question and receive an entirely random response").addStringOption(option=>
					option.setName("question").setDescription("What question are you asking?").setRequired(true)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			).addSubcommand(command=>
				command.setName("dice-roll").setDescription("Roll a number of dice").addIntegerOption(option=>
					option.setName("number").setDescription("How many dice to roll?").setMinValue(1).setMaxValue(10)
				).addBooleanOption(option=>
					option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
				)
			),
		
		// Optional fields
		
		extra: {"contexts":[0,1,2],"integration_types":[0,1]},

		requiredGlobals: ["m8ballResponses"],

		help: {
			"helpCategory":"Entertainment",
			"helpDesc":"Generate a random number"
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		switch(cmd.options.getSubcommand()) {
			case 'rng':
				cmd.followUp(`I have selected a random number between **${cmd.options.getInteger("low")||1}** and **${cmd.options.getInteger("high")||10}**: **${Math.round(Math.random()*((cmd.options.getInteger("high")||10)-(cmd.options.getInteger("low")||1))+(cmd.options.getInteger("low")||1))}**`);
			break;
			case '8-ball':
				var ques=checkDirty(config.homeServer,cmd.options.getString("question"),true)[1];
				if(cmd.guildId&&storage[cmd.guildId]?.filter.active) ques=checkDirty(cmd.guildId,ques,true)[1];
				cmd.followUp(`I have generated a random response to the question "**${ques}**".\nThe answer is **${m8ballResponses[Math.floor(Math.random()*m8ballResponses.length)]}**.`);
			break;
			case 'coin-flip':
				let coinsToFlip=cmd.options.getInteger("number")||1;
				let coins=[];
				for(var coinOn=0;coinOn<coinsToFlip;coinOn++){
					coins.push(Math.floor(Math.random()*2));
				}
				cmd.followUp(`I have flipped the coin${coinsToFlip>1?"s":""}.\n${coins.map(a=>`\n- **${a===0?"Heads":"Tails"}**`).join("")}`);
			break;
			case 'dice-roll':
				var rolls=[];
				for(var roll=0;roll<(cmd.options.getInteger("number")!==null?cmd.options.getInteger("number"):1);roll++){
					rolls.push(Math.floor(Math.random()*6)+1);
				}
				cmd.followUp(`I have rolled the dice.${rolls.map(r=>`\n- ${r}`).join("")}${rolls.length>1?`\nTotal: ${rolls.reduce((a,b)=>a+b)}`:""}`);
			break;
		}
	}
};
