#!/usr/local/bin/node

// Info:
// To make this file runable, run `chmod +x ./stderrLog.js`
// Example useage: `node crash.js 2>&1 | ./stderrLog.js`
// Requires logWebhook in env.json

// Using fetch instead of discord.js, less libraries means less chance this script fails
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const fs = require("node:fs")

const logWebhook = require("./env.json").logWebhook;

// Collect stdin here
let data = "";

// Read input
process.stdin.on("readable", () => {
    let chunk;
    while (null !== (chunk = process.stdin.read())) {
        data += chunk;
    }
});

// When input is done, log it
process.stdin.on("end", () => {

    // Make data a little more readable (this can be changed if the md parsing is too ugly)
    data = "=====\n" + data + "\n====="

    const isToLong = data.length > 2000;

    // Save just the chunk that the webhook can send (2K chars) to a var
    const webhookData = isToLong ? data.slice(0,1997) + "..." : data; 

    // Now, we'll write this error stream to a file instead
    if (isToLong) {
        // mm-dd-yyyy-<military time>
        const dateTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replaceAll("/", "-").replaceAll(":", "").replaceAll(", ", "-");
        
        // write this error to file
        fs.writeFileSync("./errorLogs/error-"+dateTime+".txt", data)
    }

    fetch(logWebhook, {
        'method': 'POST',
        'headers': {
            "Content-Type": "application/json"
        },
        'body': JSON.stringify({ 
            'username': "stderrLog.js", 
            "content": webhookData
        })
    }).then(re => re.text()).then(re => {
        // There are only responeses on errors
        if (re.trim()) {
            console.log("Response from stderr webhook:\n" + re)
        }
    });
});


