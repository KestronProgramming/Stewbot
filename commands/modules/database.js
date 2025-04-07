////////
/// This file connects to the DB, registers global utility functions, etc
/// This file is heavily annotated for intellisense
////////
/// Notes:
/// 
/// - guildUserSchema:
///   This is the per-guild per-user object for user specific storage in-guild. 
///   This is not stored under the guild directly because each document can only have 16MB
///   On top of that, it's just easier to store users on their own and index by the userID
///   because then it can auto-populate on fetch.
///
/// - ConfigDB:
///   This doc is the root-level storage. Anything global across stewbot,
///   like his pfp or RSS feeds to check daily, go here.
///


const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongooseLeanDefaults = require('mongoose-lean-defaults').default;
const { Guild, User } = require('discord.js');
mongoose.set('setDefaultsOnInsert', true);

//#region Guild
let persistenceSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    content: { type: String, default: "This is a Stewbot persistent message! Use /set_persistent_message to configure" },
    lastPost: { type: String, default: null }
})

let pollSchema = new mongoose.Schema({
    options: { type: Map, of: [ String ], default: {} }, // The key is the option, the string is the userID
    title: String,
})

let levelsSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    location: { type: String, default: "DM" },
    msg: { type: String, default: "Congratulations ${USERNAME}, you have leveled up to level ${LVL}!" },
}, { _id: false })

let filterSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    censor: { type: Boolean, default: true },
    log: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    blacklist: [ String ], // TODO: rewrite this field into a filter item field, allowing regex and per-item stuff
})

let guildLogsSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel_events: { type: Boolean, default: false },
    emoji_events: { type: Boolean, default: false },
    user_change_events: { type: Boolean, default: false },
    joining_and_leaving: { type: Boolean, default: false },
    invite_events: { type: Boolean, default: false },
    role_events: { type: Boolean, default: false },
    mod_actions: { type: Boolean, default: false },
})

let dailyItemSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
}, { _id: false })

let dailySchema = new mongoose.Schema({
    memes: { type: dailyItemSchema, default: {} },
    devos: { type: dailyItemSchema, default: {} },
    verses: { type: dailyItemSchema, default: {} },
    // wyrs: { type: dailyItemSchema, default: {} },
    // jokes: { type: dailyItemSchema, default: {} },
})

let countingSchema = new mongoose.Schema({
    // Config
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    public: { type: Boolean, default: false },
    takeTurns: { type: Number, default: 1 },
    failRoleActive: { type: Boolean, default: false },
    warnRoleActive: { type: Boolean, default: false },
    failRole: { type: String, default: "" },
    warnRole: { type: String, default: "" },
    // State
    legit: { type: Boolean, default: true },
    reset: { type: Boolean, default: false },
    nextNum: { type: Number, default: 1 },
    highestNum: { type: Number, default: 0 },
})

let autoLeaveMessageSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    message: { type: String, default: "Farewell ${@USER}. We'll miss you." },
}, { _id: false })

let tempBanSchema = new mongoose.Schema({
    invoker: String,
    ends: Number,
    reason: String,
    private: { type: Boolean, default: false }
})

let tempSlowmodeSchema = new mongoose.Schema({
    invoker: String,
    ends: Number,
    origMode: Number,
    guild: String,
    private: Boolean,
})

let tempRoleSchema = new mongoose.Schema({

})

let autoJoinMessageSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    dm: { type: Boolean, default: true },
    message: { type: String, default: "Greetings ${@USER}! Welcome to the server!" },
})

let emojiboardSchema = new mongoose.Schema({
    messType: String,
    threshold: Number,
    active: Boolean,
    channel: String,
    posted:  { type: Map, of: Number },
    posters: { type: Map, of: String },
})

let guildConfigSchema = new mongoose.Schema({
    antihack_log_channel: { type: String, default: "" },
    antihack_to_log: { type: Boolean, default: false},
    antihack_auto_delete: { type: Boolean, default: true},
    domain_scanning: { type: Boolean, default: true},
    fake_link_check: { type: Boolean, default: true},
    ai: { type: Boolean, default: true},
    embedPreviews: { type: Boolean, default: true },
    levelUpMsgs: { type: Boolean, default: false },
});

let guildSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: ServerID must be digits only"]
    },
    emojiboards: { type: Map, of: emojiboardSchema, default: {} },
    tempBans: { type: Map, of: tempBanSchema, default: {} },
    tempSlow: { type: Map, of: tempSlowmodeSchema, default: {} },
    polls: { type: Map, of: pollSchema, default: {} },
    persistence: { type: Map, of: persistenceSchema, default: {} },
    alm: { type: autoLeaveMessageSchema, default: {} },
    ajm: { type: autoJoinMessageSchema, default: {} },
    config: { type: guildConfigSchema, default: {} },
    levels: { type: levelsSchema, default: {} },
    autoJoinRoles: [ String ],
    blockedCommands: [ String ],
    daily: { type: dailySchema, default: {} },
    counting: { type: countingSchema, default: {} },
    logs: { type: guildLogsSchema, default: {} },
    filter: { type: filterSchema, default: {} },
    groupmute: String, // The emoji tied to an emojiboard with groupmute configs
    disableAntiHack: Boolean,
    testProp: String,
    stickyRoles: Boolean,
});

let guildUserSchema = new mongoose.Schema({
    // See notes at the top
    userId: {
        type: String,
        required: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: ServerID must be digits only"]
    },
    guildId: {
        type: String,
        required: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: UserID must be digits only"]
    },
    tempRoles: { type: Map, of: Number, default: {} },
    infractions: { type: Number, defaults: 0 },
    safeTimestamp: { type: Number, default: 0},
    countTurns: { type: Number, default: 0 },
    beenCountWarned: { type: Boolean, default: false },
    lvl: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
})
guildUserSchema.index({ userId: 1, guildId: 1 }, { unique: true }); // Compound unique index - only one user per guild
//#endregion

//#region Users
let hatPullSchema = new mongoose.Schema({
    limit: { type: Number, default: 0 },
    winCount: { type: Number, default: 1 },
    entered: [String],
    closes: Number,
    location: String,
    registered: Boolean,
    user: String, // Opening user
})

let primedEmbedSchema = new mongoose.Schema({
	content: { type: String, default: "" },
	timestamp: { type: Number, required: true },

	author: {
		icon: { type: String, default: "" },
		name: { type: String, required: true },
		id: { type: String, required: true }
	},

	server: {
		channelName: { type: String, default: "" },
		name: { type: String, default: "" },
		channelId: { type: String, default: null },
		id: { type: String, default: "@me" },
		icon: { type: String, default: "" }
	},

	id: { type: String, required: true },

	attachmentURLs: {
		type: [String],
		default: []
	}
})

let userConfigSchema = new mongoose.Schema({
    beenAIDisclaimered: { type: Boolean, default: false },
    aiPings: { type: Boolean, default: true },
    dmOffenses: { type: Boolean, default: true },
    returnFiltered: { type: Boolean, default: true }, // infraction content
    embedPreviews: { type: Boolean, default: true },
    levelUpMsgs: { type: Boolean, default: true },
    hasSetTZ: { type: Boolean, default: false },
    timeOffset: { type: Number, default: 0 },
})

let userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: UserID must be digits only"]
    },
    primedEmbed: { type: primedEmbedSchema },
    primedEmojiURL: { type: String, default: "" },
    primedName: { type: String, default: "" },
    timedOutIn: [ String ],
    config: { type: userConfigSchema, default: {} },
    dmOffenses: { type: Boolean, default: true },
    hat_pull: hatPullSchema, // This one does not need defaults, it is checked for existence
    captcha: Boolean,
});
//#endregion

//#region Config
// Global bot config - everything from the top level "storage.json" goes here
let rssFeedSchema = new mongoose.Schema({
    hash: String,
    url: String,
    // channels: { type: Map, of: String, default: [] },
    channels: [ String ],
    lastSent: { type: Date, default: () => new Date() },
    fails: { type: Number, default: 0 }
})

const configSchema = new mongoose.Schema({
    useGlobalGemini: { type: Boolean, default: true },
    dailyMeme: { type: Number, default: 0 },
    pfp: String,
    rss: { type: Map, of: rssFeedSchema, default: {} }
})

const ConfigDB = mongoose.model("settings", configSchema)

// Make sure ConfigDB is initialized
ConfigDB.findOne().then(async (config) => {
    if (!config) {
        // If no config exists, create one
        const newConfig = new ConfigDB({});
        await newConfig.save();
    }
});

//#endregion

//#region Functions

/**
 * Returns a document matching the query or creates a new one, filling in unset default values.
 * Updates can be provided with the provided as a json map of key to new value.
 * 
 * @param {Object} query - The query to find the document.
 * @param {Object} [updates={}] - The updates to apply to the document.
 * @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<any>>>} 
 * A mongoose document promise.
 */
function findOrCreate(query, updates = {}) {
    // Adding this as a static utility function to all docs.
    // This makes them create fields that don't already exist and such.
    return this.findOneAndUpdate(
        query,
        { $set: updates },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
}
guildSchema.statics.findOrCreate = findOrCreate;
guildUserSchema.statics.findOrCreate = findOrCreate;
userSchema.statics.findOrCreate = findOrCreate;


async function guildByID(id, updates={}) {
    // Fetch a guild from the DB, and create it if it does not already exist
    const guild = await Guilds.findOneAndUpdate(
        { id }, 
        { $set: updates },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    
    return guild;
}

/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>>} */
async function guildByObj(obj, updates={}) {
    // Beta prechecks for dev mistakes
    if (
        process.env.beta && (
            !(obj instanceof Guild)
        )
    ) {
        const warning = "WARNING: obj input seems incorrect. See console for stack trace.";
        console.trace(warning);
        notify(warning);
    }

    if (!obj) return null;

    const guild = await guildByID(obj.id, updates);
    return guild;
}

async function userByID(id, updates={}) {
    // Fetch a user from the DB, apply updates, and create it if it does not already exist
    const user = await Users.findOneAndUpdate({ id }, updates, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    
    return user;
}

/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>} */
async function userByObj(obj, updates={}) {
    // Beta prechecks for dev mistakes
    if (
        process.env.beta && (
            !(obj instanceof User)
        )
    ) {
        const warning = "WARNING: obj input seems incorrect. See console for stack trace.";
        console.trace(warning);
        notify(warning);
    }

    const user = await userByID(obj.id, updates);

    return user;
}

async function guildUserByID(guildID, userID, updateData={}, upsert) {
    // By default, this function, unlike the others, does not upsert new data.

    // Fetch and update in one query
    const user = await GuildUsers.findOneAndUpdate(
        { guildId: guildID, userId: userID },
        { $set: updateData },
        { new: true, setDefaultsOnInsert: true, upsert }
    );

    return user;
}

/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>} */
async function guildUserByObj(guild, userID, updateData={}) {
    // Beta prechecks for dev mistakes
    if (
        process.env.beta && (
            !(guild instanceof Guild) || 
            !(typeof(userID) == 'string')
        )
    ) {
        const warning = "WARNING: obj input seems incorrect. See console for stack trace.";
        console.trace(warning);
        notify(warning);
    }

    // Ensure the user exists in the server first
    const serverUser = await guild.members.fetch(userID).catch(() => null);
    if (!serverUser) return null;

    // Fetch and update in one query
    // const user = await GuildUsers.findOneAndUpdate(
    //     { guildId: guild.id, userId: userID },
    //     { $set: updateData },
    //     { new: true, upsert: true, setDefaultsOnInsert: true }
    // );
    const user = await guildUserByID(guild.id, userID, updateData, true); // upsert is true since we've checked this user exists

    return user;
}
//#endregion


// Set plugins and define docs
mongoose.plugin(mongooseLeanDefaults)
mongoose.plugin(mongooseLeanVirtuals)
const Guilds = mongoose.model("guilds", guildSchema);
const GuildUsers = mongoose.model("guildusers", guildUserSchema);
const Users = mongoose.model("users", userSchema)

// Drop indexes of docs where metadata was changed
async function dropIndexes(Model) {
    try {
        const indexes = await Model.collection.indexes();
        console.log("Indexes before deletion:", indexes.length);
        await Model.collection.dropIndexes();
        const indexes2 = await Model.collection.indexes();
        console.log("Indexes after deletion:", indexes2.length);
    } catch {}
}
function onConnect() {
    if (process.env.beta) {
        dropIndexes(GuildUsers);
        dropIndexes(Guilds);
        dropIndexes(Users);
    };

    mongoose.connection.db.setProfilingLevel(
        process.env.beta
            ? "all"
            : "slow_only"
    )
}
mongoose.connection.on('connected', onConnect);
  

module.exports = {
    Guilds,
    guildByID,
    guildByObj,

    Users,
    userByID,
    userByObj,

    GuildUsers,
    guildUserByID, // This function is less preferred, as it does not check for guild member existence first 
    guildUserByObj,

    ConfigDB
}
