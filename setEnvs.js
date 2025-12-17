// Utility to set process environment variables from envs.json
//   If beta, it sets process.env.token to process.env.betaToken.
//
// We'll try to keep this up to date, it is easy to forget about.

// The server should not early-exit
let skipValidateEnvs = process.argv.includes("--ignore-missing-envs");

const fs = require("fs");
const { jsonc } = require("jsonc");
const chalk = require("chalk").default;

// Utility to catch errors reading envs
function readEnvs(filename, warningOnMissing, warningOnInvalid, errorCallback) {
    let path;
    try {
        path = require.resolve(filename);
    }
    catch {
        // require.resolve throws an error if it cannot find it
        if (!skipValidateEnvs) console.log(warningOnMissing);
        skipValidateEnvs = true; // Can't validate envs if any failed to load
        errorCallback?.();
        console.log(chalk.red("env checking will be disabled due to invalid files."));
        return {};
    }
    try {
        return jsonc.parse(fs.readFileSync(path, "utf-8").toString());
    }
    catch {
        if (!skipValidateEnvs) console.log(warningOnInvalid);
        skipValidateEnvs = true; // Can't validate envs if any failed to load
        errorCallback?.();
        console.log(chalk.red("env checking will be disabled due to invalid files."));
        return {};
    }
}
const envs = readEnvs(
    "./env.json",
    chalk.red("Missing env.json file, please see the README.md for how to create it."),
    chalk.red("Invalid env.json file, please see the README.md for how to create it, " + chalk.bold("and make sure you removed the comments" + ".")),
    () => process.exit(1) // Envs are required to boot
);
const envTemplate = readEnvs(
    "./example.env.jsonc",
    chalk.yellow("Missing example.env.jsonc file, make sure you did not delete it when creating envs."),
    chalk.yellow("Invalid example.env.jsonc, make sure you did not modify it.")
);


const isBeta = Boolean(envs.beta);
let compiledEnvs = structuredClone(envs); // Start with all defined so ones missing from example are still defined
const missingEnvs = [];
const disabledModules = new Set();

// What modules absolutely require envs to function:
const envRequirementsMap = {
    "google.web": ["backuper.js"],
    "google.token": ["backuper.js"],
    "google.folderID": ["backuper.js"],
    "GROQ_API_KEY": ["chat.js"],
    "trackablesArchive": ["trackable.js"],
    "trackablesNotices": ["trackable.js"]
    // wyrKey: we don't support only disabling subcommands
};

function validateEnvTemplate(template, envs, parentKey = "") {
    let levelsCompiledEnvs = {};
    for (const [key, value] of Object.entries(template)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        const betaReplacementKey = `beta${key[0].toUpperCase() + key.slice(1)}`;
        const isBetaReplacementSet = betaReplacementKey in envs;
        const keyToUse = isBeta && isBetaReplacementSet ? betaReplacementKey : key;

        // Recurse if looking at object
        if (value && typeof value === "object" && !Array.isArray(value)) {
            levelsCompiledEnvs[key] = validateEnvTemplate(value, envs[keyToUse], fullKey);
            continue;
        }

        const isOptional = String(value).startsWith("Optional:");

        const isSet = keyToUse in envs;
        const envWasLeftAsDefault = isSet && envs[keyToUse] === value;

        if (!skipValidateEnvs && (!isSet || envWasLeftAsDefault)) {
            if (!isOptional) {
                console.log(chalk.red(`Missing required environment variable ${chalk.yellow.bold(fullKey)} in ${chalk.bold("env.json")}.`));
                console.log(chalk.red("Field description:"), chalk.yellow(value));
                console.log(chalk.red("Cannot start without this, please add it."));
                process.exit(1);
            }
            else {
                const keyDisabled = envRequirementsMap[fullKey] || [];
                keyDisabled.forEach(module => disabledModules.add(module));
                console.log(chalk.yellow(`Optional environment variable ${chalk.yellow.bold(fullKey)} not set.`));
                // console.log(chalk.yellow(`These modules will be disabled, other modules may have errors: ${chalk.blue.bold(envRequirementsMap[fullKey]?.join(", ") || "None")}`));
                if (envWasLeftAsDefault) delete compiledEnvs[key];
                missingEnvs.push(fullKey);
            }
        }
        else {
            levelsCompiledEnvs[key] = envs[keyToUse];
        }
    }
    return levelsCompiledEnvs;
}

// Validate envs against template
if (!skipValidateEnvs) {
    const validatedEnvs = validateEnvTemplate(envTemplate, envs);
    compiledEnvs = { ...compiledEnvs, ...validatedEnvs };
}

// Warn about disabled modules
if (disabledModules.size > 0) console.log(chalk.yellow(`These modules will be disabled, other modules may have errors: ${chalk.blue.bold([...disabledModules.values()].join(", "))}`));

// Apply compiledEnvs to process.env
Object.keys(compiledEnvs).forEach(key => process.env[key] = compiledEnvs[key]);

// Envs are all strings, so make beta falsy if it's "false"
if (process.env.beta == "false") delete process.env.beta;

module.exports = {
    missingEnvs,
    disabledModules,
    envs: compiledEnvs, // process.env only supports strings, objects need to be pulled from here.
    env: compiledEnvs   // Alias
};
