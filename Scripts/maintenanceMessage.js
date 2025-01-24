const envs = require('../env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );

const {Client}=require("discord.js");

const client=new Client({
    intents:[],
    partials:[]
});

const PID_FILE = path.join(os.tmpdir(), 'stewbot-maintenance.pid');
fs.writeFileSync(PID_FILE, process.pid.toString());

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

client.login(process.env.token);