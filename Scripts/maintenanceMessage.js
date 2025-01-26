const {Client}=require("discord.js");

// Make sure only one is running at a time
const { killMaintenanceBot } = require("../commands/restart");
killMaintenanceBot()

const client=new Client({
    intents:[],
    partials:[]
});

client.once("ready",()=>{
    console.log(`Maintenance message now being served on ${client.user.tag}`);
});

client.on("interactionCreate",cmd=>{
    if(cmd.isAutocomplete()){
        cmd.respond([{name:`Stewbot will be back soon`,value:`Stewbot will be back soon`}]);
        return;
    }
    cmd.reply({content:`I'm sorry, Stewbot is temporarily offline for planned maintenance, and will return shortly. Please try again in a few minutes.`,ephemeral:true});
});

client.login(require('../env.json').token);

// Now that we've started, write our PID down...

const path = require('path');
const os = require('os');
const fs = require("fs")
const PID_FILE = path.join(os.tmpdir(), 'stewbot-maintenance.pid');
fs.writeFileSync(PID_FILE, process.pid.toString());
