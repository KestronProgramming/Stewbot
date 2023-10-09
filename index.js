process.env=require("./env.json");
const {Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCOmmandBuilder, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle}=require("discord.js");
const fs=require("fs");

const client=new Client({intents:Object.keys(GatewayIntentBits).map((a)=>{
    return GatewayIntentBits[a]
})});

client.login(process.env.token);