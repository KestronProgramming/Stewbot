const envs = require('./env.json');
Object.keys(envs).forEach(key => process.env[key] = envs[key] );
const {Client}=require("discord.js");
const client=new Client({
    intents:[],
    partials:[]
});
client.once("ready",()=>{
    console.log(`Maintenance message now being served on ${client.user.tag}`);
});
client.on("interactionCreate",cmd=>{
    cmd.reply({content:`I'm sorry, Stewbot is temporarily offline for planned maintenance, and will return shortly. Please try again in a few minutes.`,ephemeral:true});
});
client.login(process.env.token);