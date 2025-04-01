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


let autoJoinMessageSchema  = new mongoose.Schema({
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
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: ServerID must be digits only"]
    },
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: UserID must be digits only"]
    },
    safeTimestamp: { type: Number, default: 0},
})

let guildConfigSchema = new mongoose.Schema({
    antihack_log_channel: { type: String, default: "" },
    antihack_to_log: { type: Boolean, default: false},
    antihack_auto_delete: { type: Boolean, default: true},
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
    ajm: { type: autoJoinMessageSchema, required: true },
    config: { type: guildConfigSchema, required: true },
    autoJoinRoles: [ String ],
    groupmute: String,
    disableAntiHack: Boolean,
});

// Make sure each doc subfield exists
function ensureField(doc, needsUpdate, field, defaultValue) {
    if (!doc[field]) {
        doc[field] = defaultValue;
        needsUpdate.push(field);
    }
}
guildSchema.post('findOneAndUpdate', async function (doc) {
    // This middlware only runs on findOneAndUpdate calls.
    if (doc) {
        const needsUpdate = [];

        ensureField(doc, needsUpdate, "config", {});
        ensureField(doc, needsUpdate, "ajm", {});
        ensureField(doc, needsUpdate, "emojiboards", []);

        if (needsUpdate.length > 0) {
            await doc.updateOne({ 
                $set: needsUpdate.reduce((acc, field) => ({ ...acc, [field]: doc[field] }), {}) 
            });
        }
    }
});



let userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: UserID must be digits only"]
    },
    captcha: Boolean,
    timedOutIn: [ String ]
});


const Guilds = mongoose.model("guilds", guildSchema);
const GuildUsers = mongoose.model("guildusers", guildUserSchema);
const Users = mongoose.model("users", userSchema)


// Utility functions

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
    // Grab the DB object associated with this guild object, but with cache
    if (obj._dbObject && Object.keys(updates).length === 0) {
        return obj._dbObject;
    }
    
    const guild = await guildByID(obj.id, updates);
    obj._dbObject = guild;
    return guild;
}

async function userByID(id) {
    // Fetch a user from the DB, and create it if it does not already exist

    const user = await Users.findOneAndUpdate({ id }, {}, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    
    return user;
}

/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>} */
async function userByObj(obj) {
    // Grab the DB object associated to this user object, but with cache
    if (obj._dbObject) {
        const cachedUser = obj._dbObject;
        return cachedUser;
    }
    const user = await userByID(obj.id);
    obj._dbObject = user;
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
    // updateData is json of fields that should be set to specific data.

    if (guild[`_db${userID}`]) {
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
    return user;
}



module.exports = {
    Guilds,
    guildByID,
    guildByObj,

    Users,
    userByID,
    userByObj,

    GuildUsers,
    // guildUserByID, // This function is less preferred, as it does not internally cache or check for guild member existence first 
    guildUserByObj
}
