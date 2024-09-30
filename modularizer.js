// This is a tedious process, what if I literally just write a script to do it for me lol

const fs = require("fs");

const command = "kick";

const code = fs.readFileSync("./index.js").toString()
const launchCommands = fs.readFileSync("./launchCommands.js").toString()

function extractSwitchStatement(code) {
    const startPattern = /else\s+switch\(cmd\.commandName\)\s*{/;
    const startMatch = code.match(startPattern);

    if (!startMatch) return null;  // No match found

    let startIndex = startMatch.index;
    let braceCount = 0;
    let endIndex = startIndex;

    // Find the opening brace
    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            if (braceCount === 1) {
                endIndex = i + 1;
                break;
            }
        }
    }

    // Find the matching closing brace
    for (let i = endIndex; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') braceCount--;

        if (braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }

    return code.substring(startIndex, endIndex);
}

// Get current code we're merging 
const switchCase = extractSwitchStatement(code);
const helpPages = code.match(/var helpPages(.|\n|\r)+?^\]/m)[0]
const extraInfo = launchCommands.match(/const extraInfo(.|\n|\r)+?^\}/mgui)[0]
const commands = launchCommands.match(/let commands(.|\n|\r)+?^\]/mgui)[0]

// Extract this data
const thisExtraInfoTemp = JSON.parse(extraInfo.match(new RegExp(`.+"${command}".+`))[0].match(/\{.+\}/)[0]);
try { delete thisExtraInfoTemp.cat } catch { }
const thisExtraInfo = JSON.stringify(thisExtraInfoTemp)

const thisHelpDesc = helpPages.match(new RegExp(`(?<=name.+\.${command}\..+\r?\n).+`, "mgi"))?.[0]?.match?.(/(?<=desc:").+(?=")/)?.[0]
const thisHelpCat = helpPages.match(new RegExp(`name:"(.+)",(\n|\r|.)+?\.${command}\.`, "m"))?.[1] // this is a better method lol

const thisCommand = commands.match(new RegExp(`new SlashC.+${command}(\r|\n|.)+?(?=new Slash)`))[0].trim();

const thisCode = switchCase.match(new RegExp(`case '${command}'.+\r?\n((\n|\r|.)+?)break.+\r?\n.+case`, "m"))[1];

// Grab template
var template = fs.readFileSync("./commands/template").toString()


// Inject into template
template = template.replace(/\/?\/?\s?extra.+/gmi, "extra: " + thisExtraInfo + ",")

template = template.replace(/new SlashC(\n|\r|.)+?,/, thisCommand)

if (thisHelpDesc) {
    const helpData = {
        "helpCategory": thisHelpCat || "TODO",
        "helpDesc": thisHelpDesc,
    };
    template = template.replace(/\/\/\s?help:(\r|\n|.)+?\},/m, "help: " + JSON.stringify(helpData) + ",")
}

template = template.replace("// Code", thisCode)


console.log(template)



// Write to command.js

fs.writeFileSync(`./commands/${command}.js`, String(template))


