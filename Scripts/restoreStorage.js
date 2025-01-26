const defaultGuild = require("./data/defaultGuild.json");
const defaultUser = require("./data/defaultUser.json");
const defaultGuildUser = require("./data/defaultGuildUser.json");
const env = require("./env.json")

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

let guildCount = 0;
Object.keys(storage).forEach(key => {
    const obj = storage[key];
    if (obj.filter) {
        obj.isGuild = true;
        guildCount++
    }
})
console.log(guildCount, "guilds marked in DB")
















function restoreDefaults(obj, defaults, level = 0) {
    // Restore specific properties if missing based on level or object type
    if (level === 0 && !obj.hasOwnProperty('gone')) obj.gone = defaults.gone;
    if (level === 0 && !obj.hasOwnProperty('birthday')) obj.birthday = defaults.birthday;

    for (let key in defaults) {
        const defaultValue = defaults[key];

        if (!obj.hasOwnProperty(key)) {
            // Add the property from defaults if it doesn't exist in obj
            obj[key] = Array.isArray(defaultValue) ? [...defaultValue] : (typeof defaultValue === 'object' ? { ...defaultValue } : defaultValue);
        } else if (typeof obj[key] === 'object' && obj[key] !== null && typeof defaultValue === 'object' && defaultValue !== null) {
            // Recursively restore nested properties
            restoreDefaults(obj[key], defaultValue, level + 1);
        }
    }

    // Handle special cases like "users" separately if needed
    if (obj.users && typeof obj.users === 'object') {
        for (let userID in obj.users) {
            restoreDefaults(obj.users[userID], defaultGuildUser, 0);
        }
    }
}

const analyzeProps = false;
const globalUndefinedProps = new Map();

Object.keys(storage).forEach(key => {
    const obj = storage[key];
    const defaults = obj.isGuild ? defaultGuild : defaultUser;

    restoreDefaults(obj, defaults); // Restore missing properties

    if (analyzeProps) {
        const undefinedProps = recursiveNotDefinedPropLogger(obj, defaults);
        undefinedProps.forEach(prop => {
            const normalizedProp = normalizePath(prop);
            globalUndefinedProps.set(normalizedProp, (globalUndefinedProps.get(normalizedProp) || 0) + 1);
        });
    }
});

// Print summary
if (analyzeProps) {
    console.log("\n=== Undefined Properties Summary ===");
    const sortedProps = Array.from(globalUndefinedProps.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedProps.forEach(([prop, count]) => {
        console.log(`${prop}: ${count} occurrences`);
    });
    console.log("\nTotal unique undefined properties:", globalUndefinedProps.size);
}

console.log("Storage is", JSON.stringify(storage).length, "bytes after restoration");

// Optionally save the restored storage
fs.writeFileSync("storageRestored.json", JSON.stringify(storage, null, 4));
