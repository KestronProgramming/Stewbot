// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Events } = require("discord.js");
function applyContext(context = {}) {
    for (const key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

//
// TEMPLATE-module.js is a minimal template for modules that do not have attached commands.
// 	These can be message handlers like ~sudo, etc
//


//Old variables from back in the day, may be unoptimized, unused, or otherwise
const keyword = [
    {
        keywords: ["thank", "you", "stewbot"],
        response: "You are welcome",
        dm: "",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["ty", "stewbot"],
        response: "You are welcome",
        dm: "",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["god", "dead"],
        response: "https://www.youtube.com/watch?v=07BBKkkkiCI",
        dm: "",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["dead"],
        response: "My posts are equipped with defibrillators.",
        only: false,
        timeout: 0,
        message: false
    },
    {
        keywords: ["heart", "attack"],
        response: "My posts are equipped with defibrillators.",
        only: false,
        timeout: 0,
        message: false
    },
    {
        keywords: ["wassup"],
        response: "The sky is up.",
        only: false,
        timeout: 0,
        message: false
    },
    {
        keywords: ["sleep"],
        response: "Adolescents should always get at least 8-9 hours of sleep each night.",
        only: false,
        timeout: 0,
        message: false
    },
    {
        keywords: ["what's", "up"],
        response: "The sky is up.",
        only: false,
        timeout: 0,
        message: false
    },
    {
        keywords: ["no", "offense"],
        response: "I am a robot, I cannot be offended.",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["no", "offence"],
        response: "I am a robot, I cannot be offended.",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["ow"],
        response: "On a scale of 1-10, how would you rate your pain?\nhttps://th.bing.com/th/id/R.0ac8bd2af895c546d6802cc8803db1ee?rik=uHFTb0b3ii%2bbng&pid=ImgRaw&r=0&sres=1&sresct=1",
        only: true,
        message: false,
        timeout: 0
    },
    {
        keywords: ["oof"],
        response: "On a scale of 1-10, how would you rate your pain?\nhttps://th.bing.com/th/id/R.0ac8bd2af895c546d6802cc8803db1ee?rik=uHFTb0b3ii%2bbng&pid=ImgRaw&r=0&sres=1&sresct=1",
        only: true,
        message: false,
        timeout: 0
    },
    {
        keywords: ["good", "boy"],
        response: "You have been a good boy. Have a lollipop.",
        dm: "🍭",
        only: false,
        message: true,
        timeout: 0
    },
    {
        keywords: ["laundry"],
        response: "I haven't done laundry in six months. One pair lasts me four days. I go front, I go back, I go inside out, then I go front and back.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["doesn't", "make", "sense"],
        response: "Puberty can often be a confusing time for adolescents flowering into manhood.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["no", "sense"],
        response: "Puberty can often be a confusing time for adolescents flowering into manhood.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["confused"],
        response: "Puberty can often be a confusing time for adolescents flowering into manhood.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["confusing"],
        response: "Puberty can often be a confusing time for adolescents flowering into manhood.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["bruno"],
        response: "https://c.tenor.com/VjXdPjlWS4sAAAAS/encanto-pepa-madrigal.gif",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["don't", "talk"],
        response: "https://c.tenor.com/VjXdPjlWS4sAAAAS/encanto-pepa-madrigal.gif",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["can i have staff"],
        response: "No, you cannot.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    },
    {
        keywords: ["can i have mod"],
        response: "No, you cannot.",
        dm: "🍭",
        only: false,
        message: false,
        timeout: 0
    }
];

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        command: null,

        // A priority calling system for handlers like MessageCreate, only use when required. Smaller = loaded sooner, default = 100
        // priority: 100,

        // Not all modules will have help commands, but they can in theory to showcase bot features.
        help: {
            helpCategories: [Categories.Module],
            shortDesc: "Keywords from back in Kestron-Tron's day",
            detailedDesc: //Detailed on exactly what the command does and how to use it
                `Bringing back some of the more fun and less professional features from back in Kestron-Tron's day.`

            // If this module can't be blocked, specify a reason
            // block_module_message: "Discord requires bot avatars to be set globally, so we cannot be blocked this module in this server.",

        }
    },

    /**
     * @param {import('discord.js').Message} msg
     * @param {import("./modules/database.js").GuildDoc} guildStore
     * */
    async [Events.MessageCreate](msg, context, guildStore) {
        applyContext(context);

        if (!msg.channel?.isSendable?.()) return;

        if (msg.guild?.id) {
            // In guilds, return if not set. DMs can always run these.
            if (!guildStore.config.keywords) {
                return;
            }
        }

        for (var i = 0; i < keyword.length; i++) {
            if (keyword[i].timeout !== 0) {
                keyword[i].timeout--;
            }
            if (keyword[i].only && keyword[i].keywords[0].toLowerCase() === msg.content.toLowerCase() && !msg.author.bot && keyword[i].timeout === 0) {
                msg.reply(keyword[i].response);
                keyword[i].timeout = 12;
                if (keyword[i].message && keyword[i].timeout === 0) {
                    try {
                        msg.author.send(keyword[i].dm).catch(() => { });
                    }
                    catch { }
                }
                // console.log("Told " + msg.author.tag + " " + keyword[i].response + " after they said " + msg.content);
            }
            let keyWord = true;
            if (!keyword[i].only) {
                for (var j = 0; j < keyword[i].keywords.length; j++) {
                    if (!msg.content.toLowerCase().includes(keyword[i].keywords[j]) || msg.author.bot) {
                        keyWord = false;
                    }
                }
                if (keyWord && keyword[i].timeout === 0) {
                    msg.reply(keyword[i].response);
                    if (keyword[i].message) {
                        try {
                            msg.author.send(keyword[i].dm).catch(() => { });
                        }
                        catch { }
                    }
                    // console.log("Told " + msg.author.tag + " " + keyword[i].response + " after they said " + msg.content);
                    keyword[i].timeout = 12;
                    // console.log(keyword[i].timeout);
                }
            }
        }
    }
};
