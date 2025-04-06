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
///


const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongooseLeanDefaults = require('mongoose-lean-defaults').default;
mongoose.set('setDefaultsOnInsert', true);


//#region Guild
let levelsSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    location: { type: String, default: "DM" },
    msg: { type: String, default: "Congratulations ${USERNAME}, you have leveled up to level ${LVL}!" },
})

let filterSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    censor: { type: Boolean, default: true },
    log: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    blacklist: [ String ], // TODO: rewrite this field into a filter item field, allowing regex and per-item stuff
})

let guildLogsSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    // mod_actionscdld
})

let dailyItemSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
})

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
})

let tempBanSchema = new mongoose.Schema({
    invoker: String,
    ends: Number,
    reason: String,
    private: { type: Boolean, default: false }
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

// See notes at the top
let guildUserSchema = new mongoose.Schema({
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
    infractions: { type: Number, defaults: 0 },
    safeTimestamp: { type: Number, default: 0},
    countTurns: { type: Number, default: 0 },
    beenCountWarned: { type: Boolean, default: false },
    lvl: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
})
// guildUserSchema.index({ userId: 1, guildId: 1 }, { unique: true }); // Compound unique index - only one user per guild


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
    emojiboards: { type: Map, of: emojiboardSchema, default: [] },
    tempBans: { type: Map, of: tempBanSchema, default: [] },
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
});

// Make sure each doc subfield exists
// guildSchema.post('findOneAndUpdate', async function (doc) {
//     // This middleware only runs on findOneAndUpdate calls.
//     if (doc) {
//         const needsUpdate = [];

//         // ensureField(doc, needsUpdate, "config", {});
//         // ensureField(doc, needsUpdate, "ajm", {});
//         // ensureField(doc, needsUpdate, "alm", {});
//         // ensureField(doc, needsUpdate, "emojiboards", []);
//         // ensureField(doc, needsUpdate, "tempBans", {});
//         // ensureField(doc, needsUpdate, "counting", {});

//         if (needsUpdate.length > 0) {
//             await doc.updateOne({ 
//                 $set: needsUpdate.reduce((acc, field) => ({ ...acc, [field]: doc[field] }), {}) 
//             });
//         }
//     }
// });
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

let primedEmbedSchema = mongoose.Schema({
    content: String,
    attachmentURLs: [ String ],
})

let userConfigSchema = mongoose.Schema({
    beenAIDisclaimered: { type: Boolean, default: false },
    aiPings: { type: Boolean, default: true },
    embedPreviews: { type: Boolean, default: true, required: true},
    levelUpMsgs: { type: Boolean, default: true },
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
    primedEmojiURL: { type: String, defaut: "" },
    primedName: { type: String, defaut: "" },
    timedOutIn: [ String ],
    primedEmbed: userConfigSchema, // This prop shouldn't exist unless set firsts
    config: { type: userConfigSchema, default: {} },
    dmOffenses: { type: Boolean, default: true },
    hat_pull: hatPullSchema, // This one does not need defaults, it is checked for existence
    captcha: Boolean,
});

// userSchema.post('findOneAndUpdate', async function (doc) {
//     // This middleware only runs on findOneAndUpdate calls.
//     if (doc) {
//         const needsUpdate = [];

//         // ensureField(doc, needsUpdate, "config", {});

//         if (needsUpdate.length > 0) {
//             await doc.updateOne({ 
//                 $set: needsUpdate.reduce((acc, field) => ({ ...acc, [field]: doc[field] }), {}) 
//             });
//         }
//     }
// });
//#endregion

//#region Config
// Global bot config - everything from the top level storage.json goes here
const configSchema = new mongoose.Schema({
    useGlobalGemini: { type: Boolean, default: true },
    dailyMeme: { type: Number, default: 0 },
    pfp: String,
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

function ensureField(doc, needsUpdate, field, defaultValue) {
    if (!doc[field]) {
        doc[field] = defaultValue;
        needsUpdate.push(field);
    }
}

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
    if (!obj) return null;

    // const cachePeriod = 1500;
    // if (obj._dbObject && Object.keys(updates).length === 0 && Date.now() - obj._dbObjectCachedAt < cachePeriod ) {
    //     return obj._dbObject;
    // }

    const guild = await guildByID(obj.id, updates);
    // obj._dbObject = guild;
    // obj._dbObjectCachedAt = Date.now();

    // setTimeout(() => {
    //     if (obj._dbObject === guild) {
    //         delete obj._dbObject;
    //     }
    // }, cachePeriod);

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
    const cachePeriod = 1500;

    // // Grab the DB object associated to this user object, but with cache
    // if (obj._dbObject && Object.keys(updates).length === 0 && Date.now() - obj._dbObjectCachedAt < cachePeriod) {
    //     return obj._dbObject;
    // }
    
    const user = await userByID(obj.id, updates);
    // obj._dbObject = user;
    // obj._dbObjectCachedAt = Date.now();

    // setTimeout(() => {
    //     delete obj._dbObject;
    // }, cachePeriod);

    return user;
}


async function guildUserByID(guildId, userId) {
    // Fetch a guild from the DB, and create it if it does not already exist

    const guild = await GuildUsers.findOneAndUpdate({ guildId, userId }, {}, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    
    return guild;
}

/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>} */
async function guildUserByObj(guild, userID, updateData={}) {
    const cachePeriod = 1500;

    // updateData is json of fields that should be set to specific data.

    // if (guild[`_db${userID}`] && Date.now() - guild[`_db${userID}CachedAt`] < cachePeriod) {
    //     Object.assign(guild[`_db${userID}`], updateData);
    //     return guild[`_db${userID}`].save();
    // }

    // Ensure the user exists in the server first
    const serverUser = await guild.members.fetch(userID).catch(() => null);
    if (!serverUser) return null;

    // Fetch and update in one query
    const user = await GuildUsers.findOneAndUpdate(
        { guildId: guild.id, userId: userID },
        { $set: updateData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    guild[`_db${userID}`] = user;
    guild[`_db${userID}CachedAt`] = Date.now();

    setTimeout(() => {
        delete guild[`_db${userID}`];
    }, cachePeriod);

    return user;
}
//#endregion

// Attach lean-default injector to all mongoose schemas
// [guildSchema, guildUserSchema, userSchema].map(schema => schema.plugin(mongooseLeanVirtuals));
mongoose.plugin(mongooseLeanDefaults)
mongoose.plugin(mongooseLeanVirtuals)

// Define docs
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
    // guildUserByID, // This function is less preferred, as it does not internally cache or check for guild member existence first 
    guildUserByObj,

    ConfigDB
}
