const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}


const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function textToEmojiSentiment(text) {
    // returns: [ emoji, whether to react ]

    // Return if the message is too large (announcement that mentions Stewbot among others, etc)
    if (text.length > 200) {
        return [ '😐', false ]
    }

    const result = sentiment.analyze(text);

    // Take combined score and calculate final score based on size of message
    const neutralizedScore = result.score / (result.calculation.length||1);

    // The better model takes longer, so we'll swap to the fast one to prevent ddos if necessary

    // Most words lie between 4 to -4, a very few of them go up to 5.
    var [emoji, chance] = ((score) => {
        const neutral = [ '👋', 0.2 ]
        // Positive
        if (score >= 5) return [process.env.beta?'<:jerry:1281416051409555486>':"<:jerry:1280238994277535846>", 1];
        if (score >= 3) return ['🧡', 1];
        if (score >= 1) return ['🍲', 0.7];
        // No sentiment - TODO: wave should only react at random
        if (score == 0) return neutral;
        // Negative
        if (score <= -4) return ['😭', 1];
        if (score <= -3) return ['💔', 1];
        if (score <= -1) return ['😕', 0.3];
        // Fallback
        return neutral;
    })(neutralizedScore)

    const toReact = Math.random() < chance;

    // The above should always return, but if a mod breaks it this will catch it
    return [emoji, toReact];
}

module.exports = {
	data: {
		command: null,

		// Not all modules will have help commands, but they can in theory to showcase bot features.
		help: {
			helpCategories: ["Server Only", "Entertainment","Bot","Module"],
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
				- Safety -> Anti-hack, anti-spam, etc
			*/
			shortDesc: "React when Stewbot is mentioned",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Runs basic sentiment-analysis on messages mentioning Stewbot to determine how to react.`
		},
	},

	async onmessage(msg, context) {
        // Sentiment Analysis reactions
        if (!msg.filtered && !msg.author.bot && /\bstewbot\'?s?\b/i.test(msg.content)) {
            var [emoji, toReact] = textToEmojiSentiment(msg.content);
            if (toReact) {
                msg.react(emoji);
            }
        }
	}
};
