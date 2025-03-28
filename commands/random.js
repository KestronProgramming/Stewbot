// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion CommandBoilerplate

const crypto = require('crypto');

const m8ballResponses = ["So it would seem", "Yes", "No", "Perhaps", "Absolutely", "Positively", "Unfortunately", "I am unsure", "I do not know", "Absolutely not", "Possibly", "More likely than not", "Unlikely", "Probably not", "Probably", "Maybe", "Random answers is not the answer"];

function getOrdinal(num) {
    if (typeof num !== 'number' || !Number.isInteger(num)) {
        throw new Error('Input must be an integer.');
    }

    const suffixes = ['th', 'st', 'nd', 'rd'];
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;

    // Special case for numbers ending in 11, 12, or 13
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return `${num}th`;
    }

    const suffix = suffixes[lastDigit] || 'th';
    return `${num}${suffix}`;
}

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

		requiredGlobals: [],

		help: {
			rng:{
				helpCategories: ["Entertainment"],				shortDesc: "Generate a random number",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Generate a random number between boundaries you can choose.`
			},
			"coin-flip":{
				helpCategories: ["Entertainment"],				shortDesc: "Flip a number of coins",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Flip up to ten coins and view the results`
			},
			"8-ball":{
				helpCategories: ["Entertainment"],				shortDesc: "Ask a question and receive an entirely random response",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Enter a question and let the "magic" of preprogrammed responses selected by a random number generator give you a completely random answer`
			},
			"dice-roll":{
				helpCategories: ["Entertainment"],				shortDesc: "Roll a number of dice",//Should be the same as the command setDescription field
				detailedDesc: //Detailed on exactly what the command does and how to use it
					`Roll up to ten dice and view the results`
			}
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		switch(cmd.options.getSubcommand()) {
			case 'rng':
				// As this number can be made very large, it could in theory be predicted, so we'll keep this one cryptographically secure

				let low = cmd.options.getInteger("low");
				let high = cmd.options.getInteger("high");
				low = low === null ? 1 : low;
				high = high === null ? 10 : high;
	
				if (Math.max(low, high) !== high) [low, high] = [high, low];

				const range = high - low + 1;
				const randomBytes = crypto.randomBytes(4).readUInt32BE(0);
				const choice = low + (randomBytes % range);

				cmd.followUp(`I have selected a random number between **${low}** and **${high}**: **${choice}**`);
			break;
			case '8-ball':
				var ques=checkDirty(config.homeServer,cmd.options.getString("question"),true)[1];
				if(cmd.guildId&&storage[cmd.guildId]?.filter.active) ques=checkDirty(cmd.guildId,ques,true)[1];
				cmd.followUp(
					`I have generated a random response to the question \`${escapeBackticks(ques)}\`.\n` +
					`:8ball: The answer is **${m8ballResponses[Math.floor(Math.random()*m8ballResponses.length)]}**.`);
			break;
			case 'coin-flip':
				let coinsToFlip=cmd.options.getInteger("number")||1;
				let coins=[];
				for(var coinOn=0;coinOn<coinsToFlip;coinOn++){
					coins.push(Math.floor(Math.random()*2));
				}
				cmd.followUp(`I have flipped the coin${coinsToFlip>1?"s":""} :coin:${coins.map(a=>`\n\\- **${a===0?"Heads":"Tails"}**`).join("")}`);
			break;
			case 'dice-roll':
				var rolls=[];
				for(var roll=0;roll<(cmd.options.getInteger("number")!==null?cmd.options.getInteger("number"):1);roll++){
					rolls.push(Math.floor(Math.random()*6)+1);
				}
				cmd.followUp(
					`I have rolled the dice :game_die:` +
					`${rolls.map((r, index) => {
						const dieNum = rolls.length == 1 ? "" : `${getOrdinal(index+1)} die: `;
						return `\n \\- ${dieNum}**${r}**`
					}).join("")}${rolls.length>1?`\n\nTotal: **${rolls.reduce((a,b)=>a+b)}**`:""}`);
			break;
		}
	}
};
