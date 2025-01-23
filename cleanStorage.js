const defaultGuild = require("./data/defaultGuild.json");
const defaultUser = require("./data/defaultUser.json");
const defaultGuildUser = require("./data/defaultGuildUser.json");
// const { createDatabaseProxy } = require("./test-ITWORKS2.js")

const fs = require("node:fs")

// index.js DB functions
const storageLocations = ["./storage.json", "./storage2.json"];
function readLatestDatabase() {
    // TODO, multinode: this function will probably handle determining if the drive version or the local version is later, and copy those locally.
    // It should ideally also sort each drive location by write time, and pull them in the same way sortedLocations does here.
    //  although, it would be better to actually add a timestamp to the storage.json and read that... since upload time for the drive files is not hte same as the time the file was created, necessarily.
    //  or maybe it's close enough since under normal cases, it would only be 30 seconds off.


    // We'll overwrite these right away once we read the correct one
    const corruptedFiles = []

    // Get a list, in order of which ones we should read first
    const sortedLocations = storageLocations
        .filter(file => fs.existsSync(file)) // For file that exists,
        .map(file => ({
            file,
            mtime: fs.statSync(file).mtime   // get the last modified time
        }))
        .sort((a, b) => b.mtime - a.mtime)  // sort this array by the most frequent
        .map(({ file }) => file);
    
    for (let location of sortedLocations) {
        try {
            const data = require(location);
            console.log(`Read database from ${location}`)

            // This shouldn't be needed, unless it was a boot-loop error that kept corrupting its own files. Plan for the worst.
            corruptedFiles.forEach(file => {
                fs.writeFileSync(file, JSON.stringify(data));
            })
            
            return data;
        } catch (e) {
            console.log(e)
        }
    }

    // This case should never be hit - in theory we could try to load from the latest google drive. 
    process.exit();
}
const storage = readLatestDatabase();

console.log("Storage was", JSON.stringify(storage).length, "bytes")

// Set isGuild on guild objects
// We'll check references on the objects to determine if they are a guild or a user

Object.keys(storage).forEach(key => {
    const obj = storage[key];
    if (obj.filter) {
        // console.log("Guild found with ID", key)
        obj.isGuild = true;
    }
})


function removeDefaults(obj, defaults, level=0) {

    // Per object specific checks
    if (level == 0 && obj.gone) delete obj.gone;
    if (level == 0 && obj.birthday) delete obj.birthday;

    for (let key in obj) {
        const value = obj[key];
        
        if (defaults[key] === undefined) continue // If no defaults, ignore


        // .users trimmer for the defaultGuildUser
        if (key === "users") {
            // Go through each user, cleaning up
            for (let userID in value) {
                removeDefaults(value[userID], defaultGuildUser, 0)
                if (Object.keys(value[userID]).length === 0) delete value[userID]
            }
            if (Object.keys(value).length === 0) delete obj[key]
        }
        else if (typeof value === 'object' && value !== null) {
            removeDefaults(value, defaults[key], level+1);
            if (Object.keys(value).length === 0) delete obj[key] 
        }
        else if (value === defaults[key]) {
            delete obj[key];
        }
    }
}

Object.keys(storage).forEach(key => {
    const obj = storage[key];
    const defaults = obj.isGuild ? defaultGuild : defaultUser;
    removeDefaults(obj, defaults);
});


console.log("Storage is", JSON.stringify(storage).length, "bytes")

fs.writeFileSync("storageCleaned.json", JSON.stringify(storage, null, 4))

// 

