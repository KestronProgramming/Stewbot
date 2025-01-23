
const deleteSignal = Symbol('deleteSignal');

const defaultGuild = require("./data/defaultGuild.json");
const defaultUser = require("./data/defaultUser.json");
const defaultGuildUser = require("./data/defaultGuildUser.json");

// The idea behind these is if we haven't determined the object type, we'll do our best to assume what it is but in case 
//   we're wrong this will make most functionality still work.
const userPriority = { ...defaultGuild, ...defaultUser };
const guildPriority = { ...defaultUser, ...defaultGuild };

const deepClone = obj => {
    if (typeof obj === "object") return JSON.parse(JSON.stringify(obj))
    else return obj
}

function arrayProxy(array, parentProxy, parentTarget, parentProp) {
    // NOTE:
    // This proxy is only used on default-served arrays.
    // It is not served on all arrays.
    // This means, if you pop an array into it's default state, we don't really have a way to erase the property.
    // But that's fine here. Better that than error out.

    return new Proxy(array, {
        get(target, prop) {
            if (typeof target[prop] === "function") {
                // Wrap methods like push, pop, etc.
                return (...args) => {
                    const result = target[prop](...args); // Perform the array operation

                    // After modifying the array, ensure the parent is updated
                    if (parentProxy && parentTarget) {
                        parentProxy.set(parentTarget, parentProp, target);
                    }

                    return result; // Return the result of the array method
                };
            }
            return target[prop]; // Regular get for non-function properties
        },
        set(target, prop, value) {
            target[prop] = value; // Set the value
            // Propagate the change up the chain
            if (parentProxy && parentTarget) {
                parentProxy.set(parentTarget, parentProp, target);
            }
            return true;
        },
    });
}

function dynamicUserIDProxy(target = {}, _, lastProxy, ltarget, lprop) {
    // 2nd imput param is to be compatable with internall calling convensions of the defaultHandlingProxy

    // The special .users field is keyed by IDs, which obviously can't be "default"
    //   however the contents of these objects are default, attempting to read one should
    //   serve the defaultGuildUser just like attempting to read an undefined guild
    //   serves defaultGuild.json.
    // This proxy file simply needs to get over the bump of the userID
    // Similar to the other defaultHandlingProxy, both set and delete calls are passed up the chain when necessary.

    return new Proxy(target, {
        get(target, userID) {
            const thisUser = target[userID];
            // ONLY 'objects' should be stored under the .user prop, therefore we assume:
            // thisUser is always an object.
            // thisUser is never `null`
            // thisUser can be undefined, in which case we proxy to the default data. 

            // Proxy-wrap either current or empty data to the defaultGuildUser
            return defaultHandlingProxy(thisUser ?? {}, defaultGuildUser, this, target, userID);
        },

        set(users, userID, userObj) {
            // Since this UserID proxy stores objects only, we don't need to check if we need to delete our own props
            // We just need to follow external delete requests
            if (userObj === deleteSignal) {
                delete users[userID];

                // Pass delete check / request up the chain towards the base.
                if (Object.keys(users).length === 0 && lastProxy) {
                    lastProxy.set(ltarget, lprop, deleteSignal);
                }
            } else {
                // If we got an external set request

                // make sure we exit in the parent
                if (!(lprop in ltarget)) {
                    ltarget[lprop] = users;
                }

                // Set the requested user
                users[userID] = userObj;

                // Propagate the change up to the root proxy
                if (lastProxy && ltarget) {
                    lastProxy.set(ltarget, lprop, ltarget[lprop]);
                }
            }

            return true;
        },

        deleteProperty(target, prop) {
            // Standard delete and pass-up-chain code.
            if (prop in target) {
                delete target[prop];

                if (Object.keys(target).length === 0 && lastProxy) {
                    lastProxy.set(ltarget, lprop, undefined);
                }

                return true;
            }
            return false;
        }
    });

}

function defaultHandlingProxy(target = {}, defaultObj = undefined, lastProxy, ltarget, lprop) {
    return new Proxy(target, {
        get(target, prop) {
            const targetVal = target?.[prop] ?? deepClone(defaultObj?.[prop]);

            // Special handling for the .user field (which is part of the defaultGuild) to
            //   serve defaultGuildUser to that array
            if (prop === 'users') {
                // Jump to a proxy that allows us to get over the userID that, though it is not default, is expected/required here.
                // return new Proxy(targetVal, dynamicUserIDProxy(defaultGuildUser, this, target, prop));
                return dynamicUserIDProxy(
                    target[prop] ?? {},
                    null,
                    this,
                    target,
                    prop
                );
            }

            // Arrays (other than the users one) are objects, but should be returned dirrectly, 
            //   we likely won't ever store defaults in an array 
            if (Array.isArray(targetVal)) {
                if (target[prop]) return targetVal; // If this exists in the target, no need to proxy it
                else return arrayProxy(
                    targetVal,
                    this,
                    target,
                    prop
                );
            }

            if (typeof targetVal !== 'object' || targetVal === null) {
                return targetVal;
            }

            return defaultHandlingProxy(
                target[prop] ?? {},
                defaultObj?.[prop],
                this,
                target,
                prop
            );
        },

        set(target, prop, value) {
            if (value === deleteSignal || (defaultObj && value === defaultObj[prop])) {
                delete target[prop];

                if (Object.keys(target).length === 0 && lastProxy) {
                    lastProxy.set(ltarget, lprop, deleteSignal);
                }
            } else {
                if (lastProxy && ltarget && !(lprop in ltarget)) {
                    ltarget[lprop] = target; // Create the parent path dynamically
                }

                target[prop] = value;

                // Propagate the change up to the root proxy
                if (lastProxy && ltarget) {
                    lastProxy.set(ltarget, lprop, ltarget[lprop]);
                }
            }

            return true;
        },

        deleteProperty(target, prop) {
            if (prop in target) {
                delete target[prop];

                if (Object.keys(target).length === 0 && lastProxy) {
                    lastProxy.set(ltarget, lprop, undefined);
                }

                return true;
            }
            return false;
        }
    });
}

function createDatabaseProxy(databaseJSON) {
    return new Proxy(databaseJSON, {
        get(target, objectID) {
            if (objectID in target) {
                const thisObj = target[objectID];

                if (typeof thisObj === 'object' && thisObj !== null) {
                    // If this is explicitly marked as a guild, use the guild props. Otherwise assume it's a user, with a fallback to guild props in case we assumed wrong
                    const isGuild = thisObj.isGuild;
                    const defaultObj = isGuild ? guildPriority : userPriority;

                    return defaultHandlingProxy(thisObj, defaultObj, this, target, objectID);
                }

                return thisObj;
            } else if (String(objectID).match(/^\d+$/)) { // ID format key...
                // If this is a new object, assume it's a user for now.
                // If it's a server creation, hopefully it's being accessed to set isGuild, 
                //   and our assumptions can be corrected on subsequent accesses.
                return defaultHandlingProxy({}, userPriority, this, target, objectID);
            }

            return undefined;
        },

        set(target, prop, value) {
            // Dynamically create parent paths if needed
            if (value === deleteSignal) {
                delete target[prop]
            }
            // else if (typeof value === 'object' && value !== null) {
            //     target[prop] = value;
            // } 
            else {
                target[prop] = value;
            }
            return true;
        },

        deleteProperty(target, prop) {
            delete target[prop];
            return true;
        }
    });
}

// const storage = {
//     "983074750165299250": { // A server
//         "isGuild": true,
//         "filter": { "active": true }
//     },
//     "471091072546756849": { // A user
//         "config": { "dmOffenses": false }
//     }
// };

module.exports = {
    createDatabaseProxy
}

// const proxy = createDatabaseProxy(storage);

// console.log(proxy["983074750165299250"].users["87983725323423593"].roles)
// proxy["983074750165299250"].users["87983725323423593"].roles.push("test value")
// console.log(proxy)
// proxy["983074750165299250"].users["87983725323423593"].roles.pop()
// console.log(proxy["983074750165299250"])






// Older tests
// console.log(proxy["983074750165299250"].users["879837593"].stars)
// console.log(proxy)
// proxy["983074750165299250"].users["879837593"].stars = 1
// console.log(proxy)
// proxy["983074750165299250"].users["879837593"].stars = 0
// console.log(proxy)

// proxy["1849038795382"].config.aiPings = false
// console.log(proxy)
// proxy["1849038795382"].config.aiPings = true
// console.log(proxy)



// proxy["471091072546756849"].config.aiPings = false;
// console.log(JSON.stringify(proxy));
// console.log(`=== ===`)
// proxy["471091072546756849"].config.aiPings = true;
// console.log(JSON.stringify(proxy));

// console.log(proxy["471091072546756849"].undefinedProp);

// console.log(proxy.primedEmbed);
// console.log(proxy.config.aiPings);
// proxy.config.aiPings = false
// console.log(proxy.config.aiPings);
// console.log(proxy.config);
// console.log(JSON.stringify(proxy));
// proxy.config.aiPings = true;
// proxy.config.timeOffset = 2
// console.log(JSON.stringify(proxy));




// TODO: 
// monkeypatch array protos to set the array if anything is pushed? 
// consider using symbols for when a prop should be deleted, instead of relying on undefined