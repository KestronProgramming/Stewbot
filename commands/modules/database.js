////////
//// This file connects to the DB, registers global utility functions, etc
////////
const mongoose = require("mongoose")


let emojiboardSchema = new mongoose.Schema({
    emoji: { type: String, unique: true, trim: true }
})

let guildSchema = new mongoose.Schema({
    id: {
        type: String, 
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/\d+/, "Error: ServerID must be digits only"]
    },
    emojiboards: [ emojiboardSchema ],
    groupmute: { type: String },
});
const Guilds = mongoose.model("guilds", guildSchema);




// Utility functions
async function guildByID(id) {
    // This function fetches a guild from the DB, and creates it if it does not already exist

    const guild = await Guilds.findOneAndUpdate({ id }, {}, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    
    return guild;
}


module.exports = {
    Guilds,
    guildByID,
    Users: undefined,
}
