////////
/// This file connects to the DB, registers global utility functions, etc
/// This file is heavily annotated for intellisense
////////
const mongoose = require("mongoose");

let emojiboardSchema = new mongoose.Schema({
    emoji: { type: String, unique: true, trim: true },
    messType: String,
    threshold: Number,
    active: Boolean,
    channel: String,
    posted: mongoose.Schema.Types.Mixed,  // TODO: Figure out format / type
    posters: mongoose.Schema.Types.Mixed, // TODO: Figure out format / type
})

let guildUserSchema = new mongoose.Schema({
    safeTimestamp: Number,

})

let guildConfigSchema = new mongoose.Schema({
    antihack_log_channel: String,
    antihack_to_log: Boolean,
    antihack_auto_delete: Boolean,
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
    user: {
        type: Map,
        of: guildUserSchema
    },
    emojiboards: [ emojiboardSchema ],
    groupmute: { type: String },
    config: guildConfigSchema,
    disableAntiHack: Boolean,
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
const Users = mongoose.model("users", userSchema)


// Utility functions


async function guildByID(id) {
    // Fetch a guild from the DB, and create it if it does not already exist

    const guild = await Guilds.findOneAndUpdate({ id }, {}, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    
    return guild;
}


async function guildByObj(obj) {
    // Grab the DB object associated to this guild object, but with cache
    if (obj._dbObject) {
        /** @type {import('../../types/commands/modules/database').Guilds} */
        const cachedGuild = obj._dbObject;
        return cachedGuild;
    }
    const guild = guildByID(obj.id);
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

async function userByObj(obj) {
    // Grab the DB object associated to this user object, but with cache
    if (obj._dbObject) {
        /** @type {import('../../types/commands/modules/database').Users} */
        const cachedUser = obj._dbObject;
        return cachedUser;
    }
    const user = userByID(obj.id);
    obj._dbObject = user;
    return user;
}

module.exports = {
    Guilds,
    guildByID,
    guildByObj,
    Users,
    userByID,
    userByObj,
}
