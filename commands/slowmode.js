// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { Guilds, guildByID, guildByObj } = require("./modules/database.js")
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, Events }=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

const ms = require("ms")

async function finTempSlow(guildId, channel, force){
    var chan = await client.channels.fetch(channel);

    const guild = await guildByID(guildId);

    if(!guild.tempSlow.has(channel)){
        return;
    }
    if(guild.tempSlow.get(channel).ends-Date.now()>10000&&!force){
        setTimeout(()=>{finTempSlow(guildId, channel)},guild.tempSlow.get(channel).ends-Date.now());
        return;
    }
    if(!("permissionsFor" in chan) || !("setRateLimitPerUser" in chan)){
        (await client.users.fetch(guild.tempSlow.get(channel).invoker)).send(`<#${channel}> does not seem to support slowmode.`).catch(()=>{});
        guild.tempSlow.delete(channel);
        return;
    }
    if(chan===null||chan===undefined){
        (await client.users.fetch(guild.tempSlow.get(channel).invoker)).send(`I was unable to remove the temporary slowmode setting in <#${channel}>.`).catch(()=>{});
        guild.tempSlow.delete(channel);
        return;
    }
    if(!chan.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageChannels)){
        (await client.users.fetch(guild.tempSlow.get(channel).invoker)).send(`I was unable to remove the temporary slowmode setting in <#${channel}> due to not having the \`ManageChannels\` permission.`).catch(()=>{});
        guild.tempSlow.delete(channel);
        return;
    }
    chan.setRateLimitPerUser(guild.tempSlow.get(channel).origMode);
    if(!guild.tempSlow.get(channel).private){
        if (chan.isSendable()) chan.send(`Temporary slowmode setting reverted.`).catch(()=>{});
        guild.tempSlow.delete(channel);
    }

    guild.save();
}

async function getFinishingSlowmodes() {
    // For when the bot boots
    return Guilds.aggregate([
        {
            $match: {
                tempSlow: {
                    $exists: true,
                    $ne: {}
                }
            }
        },
        {
            $project: {
                tempSlow: {
                    $objectToArray: "$tempSlow"
                },
                guildId: "$id"
            }
        },
        {
            $unwind: {
                path: "$tempSlow"
            }
        },
        {
            $match: {
                "tempSlow.v.ends": {
                    $lte: Date.now() + ms("1d")
                }
            }
        },
        {
            $project: {
                userId: "$tempSlow.k",
                guildId: 1,
                ends: "$tempSlow.v.ends"
            }
        }
    ])
}

async function scheduleTodaysSlowmode() {
    (await getFinishingSlowmodes()).map(user => 
		setTimeout(() => { 
			finTempSlow(user.guildId, user.userId); 
		}, user.ends - Date.now())
	)
}

module.exports = {
    finTempSlow, 
    scheduleTodaysSlowmode,

	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('slowmode').setDescription('Set a slowmode for this channel, temporarily if desired').addIntegerOption(option=>
                option.setName("preset_mode").setDescription("Common presets for slowmode lengths").addChoices(
                    {"name":"Slowmode Off","value":0},
                    {"name":"5s","value":5},
                    {"name":"10s","value":10},
                    {"name":"15s","value":15},
                    {"name":"30s","value":30},
                    {"name":"1m","value":60},
                    {"name":"2m","value":120},
                    {"name":"5m","value":300},
                    {"name":"10m","value":600},
                    {"name":"15m","value":900},
                    {"name":"30m","value":1800},
                    {"name":"1h","value":3600},
                    {"name":"2h","value":7200},
                    {"name":"6h","value":21600}
                )
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours in between posts?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes in between posts?").setMinValue(1).setMaxValue(59)
            ).addIntegerOption(option=>
                option.setName("seconds").setDescription("How many seconds in between posts?").setMinValue(1).setMaxValue(59)
            ).addIntegerOption(option=>
                option.setName("hours_until_reverted").setDescription("Should I revert this setting? In how many hours?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes_until_reverted").setDescription("Should I revert this setting? In how many minutes?").setMinValue(1).setMaxValue(59)
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?")
            ).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
		
		// Optional fields
		
		extra: {"contexts": [0], "integration_types": [0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Configuration, Categories.Administration, Categories.Server_Only],
			shortDesc: "Set a slowmode for this channel, temporarily if desired",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Configure or remove a slowmode on the channel this command is used in, if you set hours or minutes until reverted, Stewbot will automatically repeal the slowmode change after the time is up.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
        const botPerms = cmd.channel?.permissionsFor?.(client.user.id);
        if(!botPerms?.has(PermissionFlagsBits.ManageChannels)){
            await cmd.followUp(`I do not have the \`ManageChannels\` permission, I am unable to set slow mode restrictions.`);
            return;
        }

        // Time until reset
        var timer=0;
        var hasRevertTime=false;
        if(cmd.options.getInteger("hours_until_reverted")!==null) timer+=cmd.options.getInteger("hours_until_reverted")*60000*60;
        if(cmd.options.getInteger("minutes_until_reverted")!==null) timer+=cmd.options.getInteger("minutes_until_reverted")*60000;
        if(timer > 0){
            hasRevertTime=true;
        }

        // Slowmode delay time
        var time=0;
        if(cmd.options.getInteger("preset_mode")!==null) time=cmd.options.getInteger("preset_mode");
        if(cmd.options.getInteger("hours")!==null) time+=cmd.options.getInteger("hours")*60*60;
        if(cmd.options.getInteger("minutes")!==null) time+=cmd.options.getInteger("minutes")*60;
        if(cmd.options.getInteger("seconds")!==null) time+=cmd.options.getInteger("seconds");
        
        // Validation
        time = Math.max(time, 0);
        time = Math.min(time, ms("24h")/1000);

        const guild = await guildByObj(cmd.guild);

        if(hasRevertTime&&guild.tempSlow.has(cmd.channel.id)){
            cmd.followUp({
                content: `You already have a temp slowmode running in this channel. You must clear it or let it expire before you add a new one. It expires on its own <t:${Math.round(
                    guild.tempSlow.get(cmd.channel.id).ends / 1000
                )}:R>.`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setLabel("Revert Now")
                            .setCustomId(`revertTempSlow`)
                    ).toJSON(),
                ],
            });
            return;
        }
        if(hasRevertTime){
            guild.tempSlow.set(cmd.channel.id, {
                "invoker": cmd.user.id,//If I'm unable to revert the slowmode for any reason, DM the person who set it
                "ends": Date.now() + timer,
                "origMode": cmd.channel.rateLimitPerUser,
                "guild": cmd.guild.id,
                "private": cmd.options.getBoolean("private") === null ? false : cmd.options.getBoolean("private")
            });
            setTimeout(()=>{finTempSlow(cmd.guild.id,cmd.channel.id)},timer);
        }
        await cmd.channel.setRateLimitPerUser(time);
        await cmd.followUp({
            content: `Alright, I have set a${
                hasRevertTime ? ` temporary` : ``
            } slowmode setting for this channel${
                hasRevertTime
                    ? ` until <t:${Math.round(
                          guild.tempSlow.get(cmd.channel.id).ends / 1000
                      )}:f> <t:${Math.round(
                          guild.tempSlow.get(cmd.channel.id).ends / 1000
                      )}:R>`
                    : ``
            }.`,
            components: hasRevertTime
                ? [
                      new ActionRowBuilder().addComponents(
                          new ButtonBuilder()
                              .setStyle(ButtonStyle.Danger)
                              .setLabel("Revert Now")
                              .setCustomId(`revertTempSlow`)
                      ).toJSON(),
                  ]
                : [],
        });

        await guild.save();
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: ["revertTempSlow"],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

        if(!cmd.channel.permissionsFor(cmd.user.id).has(PermissionFlagsBits.ManageChannels)){
            await cmd.reply({content:`You don't have sufficient permissions to use this button.`,ephemeral:true});
            return;
        }
        if(!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.ManageChannels)){
            await cmd.reply({content:`I don't have the \`ManageChannels\` permission and so I'm unable to revert the slowmode setting.`,ephemeral:true});
            return;
        }
        await finTempSlow(cmd.guild.id,cmd.channel.id,true);
        await cmd.message.edit({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Revert Now")
                        .setCustomId("revertTempSlow")
                        .setDisabled(true)
                ).toJSON(),
            ],
        });
        await cmd.reply({content:`Alright, reverted the setting early.`,ephemeral:true});
	},

    async [Events.ClientReady] () {
		await scheduleTodaysSlowmode();
	}
};
