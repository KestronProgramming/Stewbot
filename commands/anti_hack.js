// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, Users, GuildUsers, guildByID, userByID, guildUserByID, guildByObj, userByObj, guildUserByObj } = require("./modules/database.js")
const { Events, ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
    for (key in context) {
        this[key] = context[key];
    }
}
/**
 * @typedef {import("./modules/database").GuildDoc} GuildDoc
 * @typedef {import("./modules/database").GuildUserDoc} GuildUserDoc
 * @typedef {import("./modules/database").UserDoc} UserDoc
 */
// #endregion CommandBoilerplate

const { requireServer } = require("../utils.js");
const crypto = require('crypto');


// Store post hashes so we can catch repeat posts
const cache = {};

module.exports = {
    data: {
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                // IT.BotDM,          // Bot's DMs
                // IT.PrivateChannel, // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                // AT.UserInstall     // Install to users
            )
            .setName("anti_hack").setDescription("Configure how hacked accounts are dealt with")
            .addBooleanOption(option =>
                option.setName("disable_anti_hack").setDescription("Do you want to disable the anti hack/spam account protection for this server?")
            ).addBooleanOption(option=>
                option.setName("log").setDescription("Whether to log incidents to a specific log channel instead of in public.")
            ).addChannelOption(option=>
                option.setName("log_channel").setDescription("The channel to log to")
            ).addBooleanOption(option=>
                option.setName("auto_delete").setDescription("Whether to automatically delete messages without moderator interaction.")
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.ManageMessages),
        
        // Not all modules will have help commands, but they can in theory to showcase bot features.
        help: {
            helpCategories: [Categories.Server_Only, Categories.Safety],
            shortDesc: "Defend server from hacked accounts.",
            detailedDesc: //Detailed on exactly what the command does and how to use it
            `This module watches for spam messages that look like they are from hacked accounts, and times out the user until they complete a captcha verification`
        },
    },
    
    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        if (requireServer(cmd)) return;
        applyContext(context);
        
        const guild = await guildByID(cmd.guildId);

        if (cmd.options.getBoolean("auto_delete") !== null) 
            guild.config.antihack_auto_delete = cmd.options.getBoolean("auto_delete");
        
        if (cmd.options.getBoolean("disable_anti_hack") !== null) 
            guild.disableAntiHack = cmd.options.getBoolean("disable_anti_hack");
        
        if (cmd.options.getChannel("log_channel") !== null) {
            guild.config.antihack_log_channel = cmd.options.getChannel("log_channel").id;
            guild.config.antihack_to_log = true; // Unless overridden, changing the log channel means enable logging
        }
        
        if (cmd.options.getBoolean("log") !== null) 
            guild.config.antihack_to_log = cmd.options.getBoolean("log");
        
        await guild.save();

        cmd.followUp("Anti-Hack response configured.");
    },
    
    /** 
     * @param {import('discord.js').Message} msg 
     * @param {GuildDoc} guildStore 
     * @param {UserDoc} guildUserStore 
     * */
    async [Events.MessageCreate] (msg, context, guildStore, guildUserStore) {
        if (!msg.guild) return;
        
        const guild = guildStore;

        if (guild.disableAntiHack) return;
        applyContext(context);
        
        // Don't run in DMs
        if (!msg.member) return
        
        // Config
        let toLog = guild.config.antihack_to_log || false;
        const logChannelId = toLog
            ? guild.config.antihack_log_channel || false 
            : false;
        let autoDelete = guild.config.antihack_auto_delete;
        
        const userIsAdmin = msg.member.permissions.has(PermissionFlagsBits.Administrator);
        const timeoutable = msg.member.manageable && !userIsAdmin;
        
        // Anti-hack message
        if(msg.guild && !msg.author.bot){
            // Create message data
            var hash = crypto.createHash('md5').update(msg.content.slice(0,148)).digest('hex'); // TODO: use something faster than md5
            
            // Make sure user / server is in cache
            cache[msg.guild.id] ??= {};
            cache[msg.guild.id].users ??= {};
            cache[msg.guild.id].users[msg.author.id] ??= {};
            cache[msg.guild.id].users[msg.author.id].lastMessages ??= [];
            cache[msg.author.id] ??= {}
            cache[msg.author.id].hashStreak ??= 0;
            
            if(cache[msg.author.id].lastHash===hash){
                // Check if this has the indications of a spammer
                if (
                    msg.content.toLowerCase().includes("@everyone") ||
                    msg.content.toLowerCase().includes("@here") ||
                    msg.content.toLowerCase().includes("http")
                ) cache[msg.author.id].hashStreak++;
                
                const spamThreshold = 3;
                
                if(cache[msg.author.id].hashStreak >= spamThreshold) {
                    // NOTE: To avoid spam when we only have delete perms, we only warn when this user hits a hash streak of 3. 
                    const toNotify = cache[msg.author.id].hashStreak == 3;
                    
                    const user = await userByObj(msg.author);
                    const userInGuild = guildUserStore; //await guildUserByObj(msg.guild, msg.author.id);

                    // Handle this user
                    user.captcha=true;
                    var botInServer=msg.guild?.members.cache.get(client.user.id);
                    if (
                        !guild.disableAntiHack && 
                        new Date() - (userInGuild.safeTimestamp || 0) > 60000 * 60 * 24 * 7
                    ) {
                        // Timeout if we have perms
                        if (timeoutable) {
                            msg.member.timeout(60000*60*24,`Detected spam activity of high profile pings and/or a URL of some kind. Automatically applied for safety.`); //One day, by then any automated hacks should've run their course
                            user.timedOutIn.push(msg.guild.id);
                        }

                        const logChannel = logChannelId
                            ? await msg.guild.channels.fetch(logChannelId).catch(async () => {
                                // If this channel doesn't exist (was deleted), disable logging to it
                                await guildByObj(msg.guild, {
                                    "guild.config.antihack_log_channel": "",
                                    "guild.config.antihack_to_log": false
                                });

                                toLog = false;
                                return msg.channel;
                            })
                            : msg.channel;

                        // Post about this user in this channel
                        if (logChannel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
                            
                            // Build buttons based on what permissions the bot has over the user.
                            const sendRow = [ ];
                            let missingPermissions = [ ]
                            
                            // Timeout button
                            if (botInServer.permissions.has(PermissionFlagsBits.ModerateMembers) && timeoutable) { // TODO: check this works
                                sendRow.push(new ButtonBuilder().setCustomId("untimeout-" + msg.author.id).setLabel("Remove Timeout").setStyle(ButtonStyle.Success));
                            } else missingPermissions.push("Timeout Members")
                            
                            // Ban button
                            if (botInServer.permissions.has(PermissionFlagsBits.BanMembers) && msg.member.bannable) {
                                sendRow.push(new ButtonBuilder().setCustomId("ban-" + msg.author.id).setLabel(`Ban`).setStyle(ButtonStyle.Danger));
                            } else missingPermissions.push("Ban Members")
                            
                            // Kick button
                            if (botInServer.permissions.has(PermissionFlagsBits.KickMembers) && msg.member.kickable) {
                                sendRow.push(new ButtonBuilder().setCustomId("kick-" + msg.author.id).setLabel(`Kick`).setStyle(ButtonStyle.Danger));
                            } else missingPermissions.push("Kick Members")
                            
                            // Delete messages button
                            if (botInServer.permissions.has(PermissionFlagsBits.ManageMessages)) {
                                if (autoDelete) {
                                    // Delete without asking
                                    for (var i = 0; i < cache[msg.guild.id].users[msg.author.id].lastMessages.length; i++) {
                                        try {
                                            var badMess = await client.channels.cache.get(
                                                cache[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[0]
                                            ).messages.fetch(
                                                cache[msg.guild.id].users[msg.author.id].lastMessages[i].split("/")[1]
                                            );
                                            badMess.delete().catch(e=>{}); // TODO: make one bulk-delete request instead of 4
                                        }
                                        catch(e){ console.log(e) }
                                    }
                                    
                                    // Finally, delete this current trigger message
                                    msg.delete()
                                    
                                    // Since they are deleted, now ignore them
                                    cache[msg.guild.id].users[msg.author.id].lastMessages = []
                                } else {
                                    sendRow.push(new ButtonBuilder().setCustomId("del-"+msg.author.id).setLabel(`Delete the Messages in Question`).setStyle(ButtonStyle.Primary));
                                }
                            } else missingPermissions.push("Manage Messages")
                            
                            // Build a message indicating 
                            let missingPermissionsMessage = "";
                            if (missingPermissions.length > 0) {
                                missingPermissions.unshift("\n\n-# :warning: I am missing the following permissions, features will be limited:")
                                missingPermissionsMessage = missingPermissions.join("\n-# - ")
                                missingPermissionsMessage += "\n\n-# Note: this could also be due to my role being below the triggering user, or the triggering user being an administrator."
                            }

                            let timeoutAttemptMessage = timeoutable
                                ? `I temporarily applied a timeout. To remove this timeout, <@${msg.author.id}> can use ${cmds.captcha.mention} in a DM with me, or a moderator can remove this timeout manually.`
                                : `I tried to apply a timeout to this account, but either I lack the \`Timeout Members\` permission, my role needs to be dragged above theirs, or they are an administrator. It is advisable to grant me these permissions to defend against spam and hacked accounts.`

                            let autoDeleteNotice = autoDelete
                                ? " which has since been automatically deleted"
                                : ""
                            
                            const components = [ ]
                            
                            if (sendRow.length > 0) {
                                components.push(
                                    new ActionRowBuilder().addComponents(
                                        ...sendRow
                                    )
                                )
                            }
                            
                            // Warn, then delete the message afterwards so they see it was deleted
                            if (toNotify) await logChannel.send({
                                content: 
                                `I have detected unusual activity from <@${msg.author.id}>${autoDeleteNotice}. ${timeoutAttemptMessage}\n` +
                                `\n` +
                                `If a mod wishes to change settings related to this behavior designed to protect servers from mass spam and hacked accounts, run ${cmds.anti_hack?.mention || "/anti_hack"}.` + // TODO: fix
                                missingPermissionsMessage,
                                components
                            });
                            
                            // Finally, DM This user if the message was set to go to a log channel
                            if (toNotify && toLog) {
                                msg.author.send(
                                    `I have detected unusual activity from your account, you have been given a timeout in one or more servers.\n`+
                                    `To remove this timeout, you can use can use ${cmds.captcha.mention} in a DM with me.`
                                )
                            }
                        }
                    }
                    
                    user.save();
                }
            }
            else{
                cache[msg.author.id].lastHash=hash;
                cache[msg.author.id].hashStreak=0;
                cache[msg.guild.id].users[msg.author.id].lastMessages=[];
            }
            cache[msg.guild.id].users[msg.author.id].lastMessages.push(`${msg.channel.id}/${msg.id}`);
            
        }
    },
    
    // Only button subscriptions matched will be sent to the handler 
    subscribedButtons: [/ban-.*/, /kick-.*/, /untimeout-.*/, /del-.*/],
    
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {

        const guild = await guildByObj(cmd.guild);

        if (guild.disableAntiHack) return cmd.reply({content:`AntiHack protection has been disabled for this servers.`, ephemeral:true});
        applyContext(context);
        
        if(cmd.customId?.startsWith("ban-")) {
            if(cmd.member.permissions.has(PermissionFlagsBits.BanMembers)){
                var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
                if(target){
                    target.ban({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to ban by ${cmd.user.username}.`});
                    cmd.message.delete();
                }
                else{
                    cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
                }
                if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                    for(var i=0;i<cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                        try{
                            var badMess = await client.channels.cache
                                .get(
                                    cache[cmd.guild.id].users[
                                        cmd.customId.split("-")[1]
                                    ].lastMessages[i].split("/")[0]
                                )
                                .messages.fetch(
                                    cache[cmd.guild.id].users[
                                        cmd.customId.split("-")[1]
                                    ].lastMessages[i].split("/")[1]
                                );
                            badMess.delete().catch(e=>{console.log(e)});
                            cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                            i--;
                        }
                        catch(e){ console.log(e) }
                    }
                }
            }
            else {
                cmd.reply({content:`You do not have sufficient permissions to ban members.`,ephemeral:true});
            }
        }
        
        if(cmd.customId?.startsWith("untimeout-")){
            if(cmd.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {

                var target = await cmd.guild.members.fetch(cmd.customId.split("-")[1]).catch(_ => null);
                if (target) {
                    await guildUserByObj(cmd.guild, cmd.customId.split("-")[1], {
                        safeTimestamp: new Date()
                    });

                    target.timeout(null);
                    cmd.message.delete();
                }
                else{
                    cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
                }
            }
            else{
                cmd.reply({content:`You do not have sufficient permissions to timeout members.`,ephemeral:true});
            }
        }
        
        if(cmd.customId?.startsWith("kick-")){
            if(cmd.member.permissions.has(PermissionFlagsBits.KickMembers)){
                var target=cmd.guild.members.cache.get(cmd.customId.split("-")[1]);
                if(target){
                    target.kick({reason:`Detected high spam activity with high profile pings and/or a URL, was instructed to kick by ${cmd.user.username}.`});
                    // await cmd.reply({content:`Done. Do you wish to delete the messages in question as well?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("del-"+target.id).setLabel("Yes").setStyle(ButtonStyle.Success))],ephemeral:true});
                    await cmd.reply({content:`Attempted to kick.`, ephemeral:true});
                    cmd.message.delete();
                }
                else{
                    cmd.reply({content:`I was unable to find the target in question.`,ephemeral:true});
                }
                if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                    for(var i=0;i<cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                        try{
                            var badMess = await client.channels.cache
                                .get(
                                    cache[cmd.guild.id].users[
                                        cmd.customId.split("-")[1]
                                    ].lastMessages[i].split("/")[0]
                                )
                                .messages.fetch(
                                    cache[cmd.guild.id].users[
                                        cmd.customId.split("-")[1]
                                    ].lastMessages[i].split("/")[1]
                                );
                            badMess.delete().catch(e=>{console.log(e)});
                            cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                            i--;
                        }
                        catch(e){console.log(e)}
                    }
                }
            }
            else{
                cmd.reply({content:`You do not have sufficient permissions to kick members.`,ephemeral:true});
            }
        }
        
        if(cmd.customId?.startsWith("del-")){
            if(cmd.member.permissions.has(PermissionFlagsBits.ManageMessages)){
                for(var i=0;i<cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.length;i++){
                    try{
                        var badMess = await client.channels.cache
                            .get(
                                cache[cmd.guild.id].users[
                                    cmd.customId.split("-")[1]
                                ].lastMessages[i].split("/")[0]
                            )
                            .messages.fetch(
                                cache[cmd.guild.id].users[
                                    cmd.customId.split("-")[1]
                                ].lastMessages[i].split("/")[1]
                            );
                        badMess.delete().catch(e=>{console.log(e)});
                        cache[cmd.guild.id].users[cmd.customId.split("-")[1]].lastMessages.splice(i,1);
                        i--;
                    }
                    catch(e){console.log(e)}
                }
                await cmd.reply({content:`Done.`,ephemeral:true});
                cmd.message.delete();
            }
            else{
                cmd.reply({content:`You do not have sufficient permissions to delete messages.`,ephemeral:true});
            }
        }
    }
};
