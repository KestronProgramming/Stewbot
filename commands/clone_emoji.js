// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { userByObj } = require("./modules/database.js");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const { notify } = require("../utils");
const config = require("../data/config.json");

// If a custom emoji exists in the message, extract it's name and URL.
function getEmojiData(emoji) {
    const matches = emoji?.match?.(/<(a)?:([\w~_]+):(\d+)>/);
    const animated = Boolean(matches?.[1]);
    const emojiName = matches?.[2];
    const emojiId = matches?.[3];
    let url = null;
    if (emojiId) {
        url = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? "gif" : "png"}`;
    }
    return { url, emojiName };
}

/** @returns {Promise<[boolean, String]>} */
async function uploadEmoji(url, name, guild) {
    // returns [success, message]
    // We'll do the emoji count checking here

    const isAnimated = url.endsWith(".gif");

    // Get emoji upload limit
    const serverTier = guild?.premiumTier;
    let emojiLimit = [
        50,  // Level 0 (None)
        100, // Level 1
        150, // Level 2
        250  // Level 3
    ][serverTier];

    const emojis = await guild.emojis.fetch();
    const slotsUsed = emojis.filter(emoji => emoji.animated === isAnimated).size;
    const slotsLeft = emojiLimit - slotsUsed;

    if (slotsLeft <= 0) {
        return [false, `Discord only allows this server to have ${emojiLimit} ${isAnimated ? "animated " : ""}emojis. To add more, you will need to boost the server or delete some.`];
    }

    const newEmoji = await guild.emojis.create({
        attachment: url,
        name: name || "unnamed"
    });
    return [true, `Emoji cloned: ${newEmoji}\nYou have ${slotsLeft} ${isAnimated ? "animated " : ""}emoji slots left in this server.`];
}

/** @type {import("../command-module").CommandModule} */
module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder()
            .setName("clone_emoji")
            .setDescription("Upload an emoji from another server to this one")
            .addStringOption(option =>
                option.setName("action").setDescription("The action to perform")
                    .setChoices(
                        { name: "Prime emoji", value: "prime_emoji" },
                        { name: "Clone from primed emoji", value: "clone_primed" },
                        { name: "Clone from prime_embed", value: "clone_embed" },
                        { name: "Clone from emoji ID", value: "clone_id" },
                        { name: "Clone from a Nitro emoji", value: "direct_clone" }
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("emoji")
                    .setDescription("Emoji if priming / direct cloning, or emoji id")
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName("private").setDescription("Make the response ephemeral?")
                    .setRequired(false)
            ),

        deferEphemeral: true,

        requiredGlobals: [],

        help: {
            helpCategories: [Categories.General, Categories.Entertainment, Categories.Configuration],
            shortDesc: "Upload an emoji from another server to use in this one",
            detailedDesc:
				`This command will copy an emoji from another server here. Use Prime Emoji in another server to start the process, and then use clone from primed emoji to bring it here. Use clone from emoji ID to find the emoji using the emoji ID, clone from a Nitro emoji to enter the emoji using Nitro directly, etc.`
        }
    },

    async execute(cmd, context) {
        applyContext(context);

        const action = cmd.options.getString("action");
        const emoji = cmd.options.getString("emoji");

        // Error checking if this is an option that takes perms
        if ([
            "direct_clone",
            "clone_primed",
            "clone_embed",
            "clone_id"
        ].includes(action)) {
            if (!cmd.guild) {
                return cmd.followUp(`I must be installed in this server to add emojis. If you need to add me, you can use [this link](${config.install})`);
            }
            if (!(await cmd.guild.members.fetch(cmd.user.id)).permissions?.has(PermissionFlagsBits.CreateGuildExpressions)) {
                return cmd.followUp(`You must have permission to upload emojis to run this command.`);
            }
            if (!cmd.guild.members.me.permissions.has(PermissionFlagsBits.CreateGuildExpressions)) {
                return cmd.followUp(`I must have permission to upload emojis to use this feature.`);
            }
        }

        try {
            switch (action) {
                case "prime_emoji": {
                    let { url, emojiName } = getEmojiData(emoji);
                    let success = true;

                    if (!emoji) {
                        success = false;
                        cmd.followUp({ content: `Please provide a server emoji with these options.` });
                    }
                    else if (!url) {
                        success = false;
                        cmd.followUp({ content: `This does not appear to be valid server emoji.` });
                    }

                    await userByObj(cmd.user, {
                        primedEmojiURL: success ? url : "",
                        primedName: success ? emojiName || "unnamed" : ""
                    });

                    if (success) cmd.followUp({ content: `Emoji primed. Use it in a server with ${cmds.clone_emoji.mention}` });
                    break;
                }

                case "clone_primed": {
                    const user = await userByObj(cmd.user);
                    const primedURL = user.primedEmojiURL;
                    const primedName = user.primedName; // TODO_DB: look at this... doesn't seem to be set anywhere?
                    if (!primedURL) {
                        return cmd.followUp("You have not primed an emoji yet. Run this command with the `Prime emoji` option in another server to clone the emoji, and run this here again to upload the emoji.");
                    }
                    let [_worked, result] = await uploadEmoji(primedURL, primedName, cmd.guild);
                    return cmd.followUp(result);
                }

                case "clone_embed": {
                    const user2 = await userByObj(cmd.user);
                    const primedContent = user2.primedEmbed.content;
                    if (!primedContent) {
                        return cmd.followUp(`You haven't primed any messages. To do this, install [Stewbot](${config.install}) ("Add to My Apps"), right-click a message > Apps > \`prime_embed\`.`);
                    }

                    let { url, emojiName } = getEmojiData(primedContent);
                    if (!url) {
                        return cmd.followUp("The primed message does not appear to have a valid server emoji.");
                    }

                    let [_worked, result] = await uploadEmoji(url, emojiName, cmd.guild);
                    return cmd.followUp(result);
                }

                case "clone_id": {
                    // This one's a bit more complicated
                    // We have to find out if the emoji is animated first
                    // First, we'll check our cache.
                    // Then if we don't know from that, we'll attempt to fetch teh .gif version
                    //  if it returns an error (415, unsupported media), then we know it's not animated

                    if (!String(emoji).match(/^\d+$/)) {
                        return cmd.followUp("This option requires the emoji ID, which will be a long number.");
                    }

                    async function isEmojiAnimated(id) {
                        const emojiData = client.emojis.cache.get(id);
                        if (emojiData) {
                            return emojiData.animated;
                        }

                        // Determine based on server response to gif request
                        try {
                            const response = await fetch(`https://cdn.discordapp.com/emojis/${id}.gif?size=16`);
                            if (response.status !== 200) return false;
                            return true;
                        }
                        catch {
                            return false;
                        }
                    }

                    const animated = await isEmojiAnimated(emoji);
                    const adaptiveUrl = `https://cdn.discordapp.com/emojis/${emoji}.${animated ? "gif" : "png"}`;

                    let [_worked, result] = await uploadEmoji(adaptiveUrl, "cloned-emoji", cmd.guild);
                    return cmd.followUp(result);
                }

                case "direct_clone": {
                    let { url, emojiName } = getEmojiData(emoji);
                    if (!url) {
                        return cmd.followUp("The nitro message does not appear to have a valid server emoji.");
                    }

                    let [_worked, result] = await uploadEmoji(url, emojiName, cmd.guild);
                    return cmd.followUp(result);
                }

            }
        }
        catch (e) {
            notify("Caught clone_emoji error:\n" + e.stack);
            try { cmd.followUp(`There seems to have been an error, perhaps the message had an invalid emoji?`); }
            catch {}
        }
    }
};
