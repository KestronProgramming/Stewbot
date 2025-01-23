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

let guildCount = 0;
Object.keys(storage).forEach(key => {
    const obj = storage[key];
    if (obj.filter) {
        obj.isGuild = true;
        guildCount++
    }
})
console.log(guildCount, "guilds marked in DB")

function recursiveNotDefinedPropLogger(obj, defaults, currentPath = '', results = new Set()) {
    // Handle null/undefined objects
    if (!obj) return results;

    for (const key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        // Skip if property doesn't exist in object
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];
        const defaultValue = defaults ? defaults[key] : undefined;

        if (defaultValue === undefined) {
            // Log properties not in defaults
            results.add(newPath);
        }

        // Recursively check nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            recursiveNotDefinedPropLogger(
                value,
                defaultValue,
                newPath,
                results
            );
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (typeof item === 'object') {
                    recursiveNotDefinedPropLogger(
                        item,
                        Array.isArray(defaultValue) ? defaultValue[0] : undefined,
                        `${newPath}[${index}]`,
                        results
                    );
                }
            });
        }
    }

    return results;
}

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

function normalizePath(path) {
    // Replace user IDs in paths like "users.123456789" with "users.<userid>"
    path = path.replace(/users\.\d+(?=\.|$)/, 'users.<userid>');
    path = path.replace(/persistence\.\d+(?=\.|$)/, 'persistence.<userid>');
    path = path.replace(/polls\.\d+(?=\.|$)/, 'polls.<userid>');
    path = path.replace(/options\.\w+(?=\.|$)/, 'options.<poll_option>');
    path = path.replace(/options\..+$/, 'options.<poll_option>');
    path = path.replace(/emojiboards\.[<:\w>]+(?=\.|$)/, 'emojiboards.<emoji>');
    path = path.replace(/posters\.\d+(?=\.|$)/, 'posters.<userid>');
    path = path.replace(/posted\.\d+(?=\.|$)/, 'posted.<userid>');
    path = path.replace(/\w+\.url/, '<rss-hash>.url');
    path = path.replace(/\w+\.lastSent/, '<rss-hash>.lastSent');
    path = path.replace(/\w+\.fails/, '<rss-hash>.fails');
    path = path.replace(/\w+\.channels/, '<rss-hash>.channels');
    path = path.replace(/\w+\.hash/, '<rss-hash>.hash');
    path = path.replace(/^[\da-f]{32}/, '<rss-hash>');
    path = path.replace(/warnings\[\d+\]/, 'warnings[#]');

    return path;
}


const analyzeProps = false;
const globalUndefinedProps = new Map();

Object.keys(storage).forEach(key => {
    const obj = storage[key];
    const defaults = obj.isGuild ? defaultGuild : defaultUser;
    removeDefaults(obj, defaults);

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



console.log("Storage is", JSON.stringify(storage).length, "bytes when cleaned");


// fs.writeFileSync("storageCleaned.json", JSON.stringify(storage, null, 4))

debugger;


// 

