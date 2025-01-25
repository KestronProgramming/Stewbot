const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}

const setDates = require("../data/setDates.json");

function holidayPfpCheck() {
    function Easter(Y) {//Thanks StackOverflow :) https://stackoverflow.com/questions/1284314/easter-date-in-javascript
        var C = Math.floor(Y/100);
        var N = Y - 19*Math.floor(Y/19);
        var K = Math.floor((C - 17)/25);
        var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
        I = I - 30*Math.floor((I/30));
        I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
        var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
        J = J - 7*Math.floor(J/7);
        var L = I - J;
        var M = 3 + Math.floor((L + 40)/44);
        var D = L + 28 - 31*Math.floor(M/4);
        return M+'/'+D;
    }
    var newPfp = null;
    var today=new Date();

    setDates.forEach(holiday=>{
        if(holiday.days.includes(`${today.getMonth()+1}/${today.getDate()}`)){
            newPfp=holiday.pfp;
        }
    });
    if(today.getMonth()===10&&today.getDay()===4&&Math.floor(today.getDate()/7)===4){
        newPfp="turkey.jpg";
    }
    if(today.getMonth()===4&&today.getDay()===1&&today.getDate()+7>31){
        newPfp="patriot.jpg";
    }
    if(today.getMonth()+1===Easter(today.getFullYear()).split("/")[0]&&today.getDate()===Easter(today.getFullYear()).split("/")[1]){
        newPfp="easter.jpg";
    }

	// avoid null storage issues
    newPfp = newPfp || "main.jpg";

    if (process.env.beta) {
        notify(`A pfp change to \`${newPfp}\` was triggered, which will be ignored in beta.`)
        newPfp = "beta.png"
    }
    
    if (newPfp !== storage.pfp) {
        storage.pfp = newPfp;
        client.user.setAvatar(`./pfps/${newPfp}`);
    }
}

module.exports = {
	data: {
		command: null,

		help: {
			helpCategories: ["Module"],
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
			shortDesc: "Keep Stewbot's avatar seasonal",
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`This module sets Stewbot's profile picture to various presets on national holidays.`,

			block_module_message: "Discord requires bot avatars to be set globally, so I cannot block this module.",
		},
	},

	async daily(context) {
		applyContext(context);

		holidayPfpCheck();
	}
};
