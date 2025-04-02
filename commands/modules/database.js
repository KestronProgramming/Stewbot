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

//#region Guild
let countingSchema = new mongoose.Schema({
    // Config
    channel: { type: String, default: "" },
    public: { type: Boolean, default: true },
    takeTurns: { type: Number, default: 1 },
    failRoleActive: { type: Boolean, default: false },
    warnRoleActive: { type: Boolean, default: false },
    failRole: { type: String, default: "" },
    warnRole: { type: String, default: "" },
    // State
    legit: { type: Boolean, default: true },
    reset: { type: Boolean, default: false },
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
    emoji: { type: String, unique: true, trim: true },
    messType: String,
    threshold: Number,
    active: Boolean,
    channel: String,
    posted: mongoose.Schema.Types.Mixed,  // TODO: Figure out format / type
    posters: mongoose.Schema.Types.Mixed, // TODO: Figure out format / type
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
    safeTimestamp: { type: Number, default: 0},
    countTurns: { type: Number, default: 0 },
    beenCountWarned: { type: Boolean, default: false },
})
// guildUserSchema.index({ userId: 1, guildId: 1 }, { unique: true }); // Compound unique index - only one user per guild


let guildConfigSchema = new mongoose.Schema({
    antihack_log_channel: { type: String, default: "" },
    antihack_to_log: { type: Boolean, default: false},
    antihack_auto_delete: { type: Boolean, default: true},
    domain_scanning: { type: Boolean, default: true},
    fake_link_check: { type: Boolean, default: true},
    ai: { type: Boolean, default: true}
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
    emojiboards: [ 
        { type: emojiboardSchema, required: true }
    ],
    tempBans: { type: Map, of: tempBanSchema },
    alm: { type: autoLeaveMessageSchema },
    ajm: { type: autoJoinMessageSchema },
    config: { type: guildConfigSchema },
    counting: countingSchema,
    autoJoinRoles: [ String ],
    blockedCommands: [ String ],
    groupmute: String,
    disableAntiHack: Boolean,
});

// Make sure each doc subfield exists
guildSchema.post('findOneAndUpdate', async function (doc) {
    // This middleware only runs on findOneAndUpdate calls.
    if (doc) {
        const needsUpdate = [];

        ensureField(doc, needsUpdate, "config", {});
        ensureField(doc, needsUpdate, "ajm", {});
        ensureField(doc, needsUpdate, "alm", {});
        ensureField(doc, needsUpdate, "emojiboards", []);
        ensureField(doc, needsUpdate, "tempBans", {});
        ensureField(doc, needsUpdate, "counting", {});

        if (needsUpdate.length > 0) {
            await doc.updateOne({ 
                $set: needsUpdate.reduce((acc, field) => ({ ...acc, [field]: doc[field] }), {}) 
            });
        }
    }
});
//#endregion

//#region Users
let primedEmbedSchema = mongoose.Schema({
    content: { type: String, default: "" }
})

let userConfigSchema = mongoose.Schema({
    beenAIDisclaimered: { type: Boolean, default: false },
    aiPings: { type: Boolean, default: true },
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
    primedEmbed: userConfigSchema,
    config: userConfigSchema,
    captcha: Boolean,
});

userSchema.post('findOneAndUpdate', async function (doc) {
    // This middleware only runs on findOneAndUpdate calls.
    if (doc) {
        const needsUpdate = [];

        ensureField(doc, needsUpdate, "config", {});

        if (needsUpdate.length > 0) {
            await doc.updateOne({ 
                $set: needsUpdate.reduce((acc, field) => ({ ...acc, [field]: doc[field] }), {}) 
            });
        }
    }
});
//#endregion

//#region Config
// Global bot config - everything from the top level storage.json goes here
const configSchema = new mongoose.Schema({
    useGlobalGemini: { type: Boolean, default: true },
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


const Guilds = mongoose.model("guilds", guildSchema);
const GuildUsers = mongoose.model("guildusers", guildUserSchema);
const Users = mongoose.model("users", userSchema)


//#region Functions

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

    const cachePeriod = 1500;

    if (obj._dbObject && Object.keys(updates).length === 0 && Date.now() - obj._dbObjectCachedAt < cachePeriod ) {
        return obj._dbObject;
    }

    const guild = await guildByID(obj.id, updates);
    obj._dbObject = guild;
    obj._dbObjectCachedAt = Date.now();

    setTimeout(() => {
        if (obj._dbObject === guild) {
            delete obj._dbObject;
        }
    }, cachePeriod);

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

    // Grab the DB object associated to this user object, but with cache
    if (obj._dbObject && Object.keys(updates).length === 0 && Date.now() - obj._dbObjectCachedAt < cachePeriod) {
        return obj._dbObject;
    }
    
    const user = await userByID(obj.id, updates);
    obj._dbObject = user;
    obj._dbObjectCachedAt = Date.now();

    setTimeout(() => {
        delete obj._dbObject;
    }, cachePeriod);

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

    if (guild[`_db${userID}`] && Date.now() - guild[`_db${userID}CachedAt`] < cachePeriod) {
        Object.assign(guild[`_db${userID}`], updateData);
        return guild[`_db${userID}`].save();
    }

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


// Drop indexes of docs where metadata was changed
GuildUsers.collection.dropIndexes();

async function dropAllIndexes(db) {
    try {
        const collections = await db.db.listCollections().toArray();

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;

            if (!collectionName.startsWith('system.')) {
                try {
                    await db.db.collection(collectionName).dropIndexes();
                    console.log(`Dropped indexes from collection: ${collectionName}`);
                } catch (error) {
                    console.error(`Error dropping indexes from collection ${collectionName}:`, error.message);
                }
            }
        }

        console.log('All indexes dropped (except system indexes).');
    } catch (error) {
        console.error('Error dropping all indexes:', error.message);
    }
}
if (process.env.beta) dropAllIndexes(mongoose.connection.db);
  


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
