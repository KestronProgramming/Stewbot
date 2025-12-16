// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const ms = require("ms");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj } = require("./modules/database.js")
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType, Events}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

// TODO: allow each user to have more than one giveaways?

// TODO_LINT: double check pulls lasting more than 24 hours and less

async function finHatPull(userId, force){
    const user = await userByID(userId);

    if(!user.hat_pull) {
        // This could have been ended early
        return;
    }

    // If this hat pull doesn't close in the next 10 seconds (and it's not being forced), register it to run at the proper time
    if (user.hat_pull.closes - Date.now() > ms("10s") && !force) {
        // Only reschedule it if it's in the next 24 hours, otherwise the daily handler will schedule it
        if (user.hat_pull.closes - Date.now() <= ms("1d")) {
            setTimeout(() => {
                finHatPull(userId)
            }, user.hat_pull.closes-Date.now());
        }
        return;
    }

    // Calculate winners
    var winners=[];
    for(var i=0;i<user.hat_pull.winCount;i++) {
        // TODO: use secure random here, just because we can
        winners.push(user.hat_pull.entered[Math.floor(Math.random()*user.hat_pull.entered.length)]);
    }
    const chan = await client.channels.fetch(user.hat_pull.location.split("/")[1]).catch(e => null);
    if(!chan || !chan.isTextBased?.()){
        (await client.users.fetch(userId)).send(
            `I could not end the hat pull.\n`+
            `https://discord.com/channels/${user.hat_pull.location}${winners.map(a=>`\n- <@${a}>`).join("")}`).catch(e=>{});
        await user.updateOne({ $unset: { "hat_pull": 1 } })
        return;
    }
    var cont = `This has ended! ${winners.length === 0 
        ? `Nobody entered though.` 
        : winners.length > 1 ? `Here are our winners!${winners.map(a => `\n- <@${a}>`).join("")}` : `Here is our winner: <@${winners[0]}>!`}`;
    
    const msg = await chan.messages.fetch(user.hat_pull.location.split("/")[2]).catch(() => null);

    if (!msg) {
        if (chan.isSendable?.()) {
            chan.send(cont);
        }
    }
    else {
        if (msg.editable) {
            msg.edit({ components: [] });
        }
        msg.reply(cont);
    }
    await user.updateOne({ $unset: { "hat_pull": 1 } })
}

async function scheduleTodaysHats() {
    const needsSchedulingFilter = { 
        hat_pull: { $exists: true },
        "hat_pull.closes": { $lt: Date.now() + ms("1d") },
        "hat_pull.scheduled": false,
    }

    // Grab all hat pulls
    const usersWithHats = await Users.find(needsSchedulingFilter);

    // Mark these as scheduled so we don't double schedule
    await Users.updateMany(
        { _id: { $in: usersWithHats.map(u => u._id) } },
        { $set: { "hat_pull.scheduled": true } }
    );
    
    for (const user of usersWithHats) {
        if (user.hat_pull.closes - Date.now() > 0) {
            // if it's in the future, schedule
            setTimeout(() => { 
                finHatPull(user.id)
            }, user.hat_pull.closes - Date.now());
        } else {
            // if it's in the past, run now that we're awake
            finHatPull(user.id);
        }
    }
}

async function resetHatScheduleLocks() {
    // marks all "scheduled" hat pulls as not. This is run at boot to reset locks.
    await Users.updateMany(
        { "hat_pull.scheduled": true }, 
        { $set: { "hat_pull.scheduled": false }
    });
}

module.exports = {
    finHatPull,
    scheduleTodaysHats,
    resetHatScheduleLocks,
    
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName('hat_pull').setDescription('Draw (a) name(s) from a hat, like a raffle or giveaway').addStringOption(option=>
                option.setName("message").setDescription("Message to display? (Use \\n for a newline)").setMinLength(1)
            ).addIntegerOption(option=>
                option.setName("limit").setDescription("Is there a limit to how many people can enter?").setMinValue(2)
            ).addIntegerOption(option=>
                option.setName("winners").setDescription("How many names should I pull when it is time? (Default: 1)").setMinValue(1)
            ).addIntegerOption(option=>
                option.setName("days").setDescription("How many days to enter before closing?").setMinValue(1).setMaxValue(30)
            ).addIntegerOption(option=>
                option.setName("hours").setDescription("How many hours to enter before closing?").setMinValue(1).setMaxValue(23)
            ).addIntegerOption(option=>
                option.setName("minutes").setDescription("How many minutes to enter before closing?").setMinValue(1).setMaxValue(59)
            ),
		
		// Optional fields
		
		extra: {"contexts": [0], "integration_types": [0]},

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Entertainment, Categories.Server_Only],
			shortDesc: "Draw (a) name(s) from a hat, like a raffle or giveaway",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Have Stewbot help manage a raffle or giveaway-like event, including automatic handling of entering and picking the winner(s) after a set amount of time.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        const user = await userByObj(cmd.user);
		
		// Code
        if(user.hat_pull){
            cmd.followUp(
                `You already have a hat pull running. You must close that one before starting another.\n`+
                `https://discord.com/channels/${user.hat_pull.location}`
            );
            return;
        }

        var timer=0;
        if (cmd.options.getInteger("days") !== null) timer += cmd.options.getInteger("days") * 60000 * 60 * 24;
        if (cmd.options.getInteger("hours") !== null) timer += cmd.options.getInteger("hours") * 60000 * 60;
        if (cmd.options.getInteger("minutes") !== null) timer += cmd.options.getInteger("minutes") * 60000;
        if (timer <= 0) {
            cmd.followUp(`You need to specify an amount of time for people to enter`);
            return;
        }

        const endTimestamps = `<t:${Math.round((timer + Date.now()) / 1000)}:f> <t:${Math.round((timer + Date.now()) / 1000)}:R>`;

        var resp = await cmd.followUp({
            content: `${
                cmd.options.getString("message") !== null
                    ? cmd.options.getString("message").replaceAll("\\n", "\n")
                    : `**Hat Pull**\nEnter by pressing the button below!`
                }\n\nThis ends ${endTimestamps}.`,
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setLabel("Enter")
                        .setCustomId("enterHatPull"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel("Leave")
                        .setCustomId("leaveHatPull"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Close")
                        .setCustomId("closeHatPull"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("cancelHatPull")
                        .setLabel("Cancel")
                ).toJSON(),
            ],
            allowedMentions: { parse: [] },
        });

        const scheduleNow = timer <= ms("1d");
        
        user.hat_pull = {
            "limit":cmd.options.getInteger("limit")!==null?cmd.options.getInteger("limit"):0,
            "winCount":cmd.options.getInteger("winners")!==null?cmd.options.getInteger("winners"):1,
            "closes":Date.now()+timer,
            "location":`${cmd.guild.id}/${cmd.channel.id}/${resp.id}`,
            "user":cmd.user.id,
            "entered": [],
            "scheduled": scheduleNow,
        };
        
        if (scheduleNow) {
            setTimeout(()=>{finHatPull(cmd.user.id)}, timer);
        }

        user.save();
	},

    async daily(context) {
        applyContext(context);

        scheduleTodaysHats()
    },

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/.*HatPull/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);
        if (!("customId" in cmd)) return;

        let hatPullHost; // Switches are a pain with defining stuff

		switch(cmd.customId) {
            case 'enterHatPull':
                await cmd.deferUpdate();

                // Grab the hatPull for this command
                hatPullHost = await Users.findOne({
                    "hat_pull.location": `${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`
                });

                if (!hatPullHost?.hat_pull) {
                    await cmd.followUp({ content: `This hat pull is no longer active.`, ephemeral: true });
                    return;
                }

                if (!hatPullHost.hat_pull.entered.includes(cmd.user.id)) {
                    hatPullHost.hat_pull.entered.push(cmd.user.id);
                } else {
                    await cmd.followUp({ content: `You've already entered this`, ephemeral: true });
                    return;
                }

                await hatPullHost.save();
                await cmd.followUp({ content: `You've been entered for this!`, ephemeral: true });
                break;

            case 'leaveHatPull':
                await cmd.deferUpdate();

                // Grab the hatPull for this command
                hatPullHost = await Users.findOne({
                    "hat_pull.location": `${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`
                });

                if (!hatPullHost?.hat_pull) {
                    await cmd.followUp({ content: `This hat pull is no longer active.`, ephemeral: true });
                    return;
                }

                if (hatPullHost.hat_pull.entered.includes(cmd.user.id)) {
                    hatPullHost.hat_pull.entered.splice(hatPullHost.hat_pull.entered.indexOf(cmd.user.id), 1);
                } else {
                    await cmd.followUp({ content: `You haven't entered this`, ephemeral: true });
                    return;
                }

                await hatPullHost.save();
                await cmd.followUp({ content: `You've been removed from this!`, ephemeral: true });
                break;

            case 'closeHatPull':
                await cmd.deferUpdate();

                // Grab the hatPull for this command
                hatPullHost = await Users.findOne({
                    "hat_pull.location": `${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`
                });

                if (!hatPullHost?.hat_pull) {
                    await cmd.followUp({ content: `This hat pull is no longer active.`, ephemeral: true });
                    return;
                }

                if (
                    hatPullHost.id === cmd.user.id || // This can be closed by the creator,
                    cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages) // Or it can be closed by moderators
                ) {
                    await finHatPull(hatPullHost.id, true);
                } else {
                    await cmd.followUp({ content: `This isn't yours to close`, ephemeral: true });
                    return;
                }
                break;

            case 'cancelHatPull':
                await cmd.deferUpdate();

                // Grab the hatPull for this command
                hatPullHost = await Users.findOne({
                    "hat_pull.location": `${cmd.guild.id}/${cmd.channel.id}/${cmd.message.id}`
                });

                if (!hatPullHost?.hat_pull) {
                    await cmd.followUp({ content: `This hat pull is no longer active.`, ephemeral: true });
                    return;
                }

                if (
                    hatPullHost.id === cmd.user.id || // This can be closed by the creator,
                    cmd.memberPermissions?.has(PermissionFlagsBits.ManageMessages) // Or it can be closed by moderators
                ) {
                    await cmd.message.edit({ components: [] });
                    await Users.updateOne({ id: hatPullHost.id }, { $unset: { hat_pull: "" } }); // Delete the hat pull from existence.
                    // TODO: edit it to say it was closed by the user or a mod, or smth.
                } else {
                    await cmd.followUp({ content: `This isn't yours to cancel`, ephemeral: true });
                    return;
                }
                break;
		}
	},

    async [Events.ClientReady] () {
        await resetHatScheduleLocks(); // Has to be run at boot before scheduling timers
        await scheduleTodaysHats();
    }
};
