////////
//// This file connects to the DB, registers global utility functions, etc
////////

const mongoose = require("mongoose");

//#region Schemas
// User Config Schema
const ConfigSchema = new mongoose.Schema({
    dmOffenses: { type: Boolean, default: true },
    returnFiltered: { type: Boolean, default: true },
    embedPreviews: { type: Boolean, default: true },
    aiPings: { type: Boolean, default: true },
    levelUpMsgs: { type: Boolean, default: true },
    timeOffset: { type: Number, default: 0 },
    hasSetTZ: { type: Boolean, default: false },
    beenAIDisclaimered: { type: Boolean, default: false },
});

// Primed Embed Server Schema
const PrimedEmbedServerSchema = new mongoose.Schema({
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    channelId: { type: String, default: "" },
    channelName: { type: String, default: "" },
    icon: { type: String, default: "" },
});

// Primed Embed Author Schema
const PrimedEmbedAuthorSchema = new mongoose.Schema({
    icon: { type: String, default: "" },
    name: { type: String, default: "" },
    id: { type: String, default: "" },
});

// Primed Embed Schema
const PrimedEmbedSchema = new mongoose.Schema({
    content: { type: String, default: "" },
    attachmentURLs: { type: [String], default: [] },
    server: { type: PrimedEmbedServerSchema, default: () => ({}) },
    author: { type: PrimedEmbedAuthorSchema, default: () => ({}) },
    timestamp: { type: String, default: "" },
    id: { type: String, default: "" },
});

// User Schema
const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // userID
    offenses: { type: Number, default: 0 },
    config: { type: ConfigSchema, default: () => ({}) },
    primedEmbed: { type: PrimedEmbedSchema, default: () => ({}) },
    hashStreak: { type: Number, default: 0 },
});

// Guild User Schema
const GuildUserSchema = new mongoose.Schema({
    infractions: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    roles: { type: [String], default: [] },
    countTurns: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    expTimeout: { type: Number, default: 0 },
    lvl: { type: Number, default: 0 },
    beenCountWarned: { type: Boolean, default: false },
    warnings: { type: [String], default: [] },
});

// Daily Item Schema (reused for memes, wyrs, etc.)
const DailyItemSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
});

// Levels Schema
const LevelsSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    msg: {
        type: String,
        default:
            "Congratulations ${USERNAME}, you have leveled up to level ${LVL}!",
    },
    location: { type: String, default: "DM" },
});

// Filter Schema
const FilterSchema = new mongoose.Schema({
    blacklist: { type: [String], default: [] },
    active: { type: Boolean, default: false },
    censor: { type: Boolean, default: true },
    log: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    whitelist: { type: [String], default: [] },
});

// Logs Schema
const LogsSchema = new mongoose.Schema({
    channel: { type: String, default: "" },
    active: { type: Boolean, default: false },
    channel_events: { type: Boolean, default: false },
    emoji_events: { type: Boolean, default: false },
    user_change_events: { type: Boolean, default: false },
    joining_and_leaving: { type: Boolean, default: false },
    invite_events: { type: Boolean, default: false },
    role_events: { type: Boolean, default: false },
    mod_actions: { type: Boolean, default: false },
});

// Counting Schema
const CountingSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    nextNum: { type: Number, default: 1 },
    highestNum: { type: Number, default: 0 },
    legit: { type: Boolean, default: true },
    reset: { type: Boolean, default: true },
    public: { type: Boolean, default: true },
    takeTurns: { type: Number, default: 1 },
    failRoleActive: { type: Boolean, default: false },
    failRole: { type: String, default: "" },
    warnRoleActive: { type: Boolean, default: false },
    warnRole: { type: String, default: "" },
});

// AJM/ALM Schema
const JoinLeaveSchema = new mongoose.Schema({
    message: { type: String, default: "" },
    dm: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    active: { type: Boolean, default: false },
});

// Guild Schema
const GuildSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // guildID
    persistence: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map(),
    },
    daily: {
        memes: { type: DailyItemSchema, default: () => ({}) },
        wyrs: { type: DailyItemSchema, default: () => ({}) },
        jokes: { type: DailyItemSchema, default: () => ({}) },
        devos: { type: DailyItemSchema, default: () => ({}) },
        verses: { type: DailyItemSchema, default: () => ({}) },
        qotd: { type: DailyItemSchema, default: () => ({}) },
    },
    stickyRoles: { type: Boolean, default: false },
    levels: { type: LevelsSchema, default: () => ({}) },
    filter: { type: FilterSchema, default: () => ({}) },
    emojiboards: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map(),
    },
    logs: { type: LogsSchema, default: () => ({}) },
    counting: { type: CountingSchema, default: () => ({}) },
    users: { type: Map, of: GuildUserSchema, default: new Map() },
    reactionRoles: { type: [String], default: [] },
    invites: { type: [String], default: [] },
    polls: { type: Map, of: mongoose.Schema.Types.Mixed, default: new Map() },
    config: {
        embedPreviews: { type: Boolean, default: true },
        ai: { type: Boolean, default: true },
    },
    ajm: { type: JoinLeaveSchema, default: () => ({}) },
    alm: { type: JoinLeaveSchema, default: () => ({}) },
});
//#endregion Schemas

// Register models
global.User = mongoose.model("User", UserSchema);
global.Guild = mongoose.model("Guild", GuildSchema);

//#region Utility functions
global.getGuild = async function(guildId) {
    return await Guild.findOneAndUpdate(
        { _id: guildId },
        { $setOnInsert: new Guild({ _id: guildId }) },
        { upsert: true, new: true }
    );
}
global.getUser = async function(userId) {
    return await User.findOneAndUpdate(
        { _id: userId },
        { $setOnInsert: new User({ _id: userId }) },
        { upsert: true, new: true }
    );
}

//#endregion Utility functions



// Finally, connect to the DB
await mongoose.connect(`mongodb://localhost:27017/${process.env.beta ? "stewbeta" : "stewbot"}`);
