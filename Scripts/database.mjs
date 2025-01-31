////////
//// This file connects to the DB, registers global utility functions, etc
////////

import { Schema, model, connect } from "mongoose";
import beta from '../env.json' assert { type: 'json' };
if (beta) process.env.beta = true;

//#region Schemas
// User Config Schema
const ConfigSchema = new Schema({
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
const PrimedEmbedServerSchema = new Schema({
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    channelId: { type: String, default: "" },
    channelName: { type: String, default: "" },
    icon: { type: String, default: "" },
});

// Primed Embed Author Schema
const PrimedEmbedAuthorSchema = new Schema({
    icon: { type: String, default: "" },
    name: { type: String, default: "" },
    id: { type: String, default: "" },
});

// Primed Embed Schema
const PrimedEmbedSchema = new Schema({
    content: { type: String, default: "" },
    attachmentURLs: { type: [String], default: [] },
    server: { type: PrimedEmbedServerSchema, default: () => ({}) },
    author: { type: PrimedEmbedAuthorSchema, default: () => ({}) },
    timestamp: { type: String, default: "" },
    id: { type: String, default: "" },
});

// User Schema
const UserSchema = new Schema({
    _id: { type: String, required: true }, // userID
    offenses: { type: Number, default: 0 },
    config: { type: ConfigSchema, default: () => ({}) },
    primedEmbed: { type: PrimedEmbedSchema, default: () => ({}) },
    hashStreak: { type: Number, default: 0 },
});

// Guild User Schema
const GuildUserSchema = new Schema({
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
const DailyItemSchema = new Schema({
    active: { type: Boolean, default: false },
    channel: { type: String, default: "" },
});

// Levels Schema
const LevelsSchema = new Schema({
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
const FilterSchema = new Schema({
    blacklist: { type: [String], default: [] },
    active: { type: Boolean, default: false },
    censor: { type: Boolean, default: true },
    log: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    whitelist: { type: [String], default: [] },
});

// Logs Schema
const LogsSchema = new Schema({
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
const CountingSchema = new Schema({
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
const JoinLeaveSchema = new Schema({
    message: { type: String, default: "" },
    dm: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    active: { type: Boolean, default: false },
});

// Guild Schema
const GuildSchema = new Schema({
    _id: { type: String, required: true }, // guildID
    persistence: {
        type: Object,
        default: {},
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
        of: Schema.Types.Mixed,
        default: new Map(),
    },
    logs: { type: LogsSchema, default: () => ({}) },
    counting: { type: CountingSchema, default: () => ({}) },
    users: { type: Map, of: GuildUserSchema, default: new Map() },
    reactionRoles: { type: [String], default: [] },
    invites: { type: [String], default: [] },
    polls: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    config: {
        embedPreviews: { type: Boolean, default: true },
        ai: { type: Boolean, default: true },
    },
    ajm: { type: JoinLeaveSchema, default: () => ({}) },
    alm: { type: JoinLeaveSchema, default: () => ({}) },
});
//#endregion Schemas

// Register models
global.User = model("User", UserSchema);
global.Guild = model("Guild", GuildSchema);

//#region Utility functions
global.getGuild = async function(guildId) {
    return await Guild.findOneAndUpdate(
        { _id: guildId },
        { $setOnInsert: new Guild({ _id: guildId }) },
        { upsert: true, new: true }
    );
}
global.deleteGuild = async function(guildId) {
    return await Guild.deleteOne({ _id: guildId });
}
global.getUser = async function(userId) {
    return await User.findOneAndUpdate(
        { _id: userId },
        { $setOnInsert: new User({ _id: userId }) },
        { upsert: true, new: true }
    );
}
global.getGuildUser = async function(guildIdentifier, userId) {
    const guild = typeof guildIdentifier === 'string' 
        ? await getGuild(guildIdentifier) 
        : guildIdentifier;

    if (!guild.users.has(userId)) {
        guild.users.set(userId, {});
        await guild.save();
    }

    const user = guild.users.get(userId);
    user._parentGuild = guild; // Attach parent reference
    return user;
}
//#endregion Utility functions



// Finally, connect to the DB
await connect(`mongodb://localhost:27017/${process.env.beta ? "stewbeta" : "stewbot"}`);
