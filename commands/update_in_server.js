// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, ConfigDB, guildByID, userByID, guildByObj, userByObj, GuildUsers } = require("./modules/database.js")
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType } = require("discord.js");
function applyContext(context = {}) {
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

module.exports = {    
    data: {
        command: null, // TODO: devadmin command globals. Really this is the only one rn

        requiredGlobals: [],
        help:{
            helpCategories: [""],//Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        const guilds = await client.guilds.fetch(); // The guilds here are only skeletons, don't contain the normal guild fields

        for (const [guildId, guildSkel] of guilds) {
            // Fetch the member to confirm they are in the guild
            const guild = await client.guilds.fetch(guildId);
            const members = await guild.members.fetch();
            const memberIds = members.map(member => member.id);
            
            // Mark everyone as not in this server
            await GuildUsers.updateMany(
                { guildId: guildId },
                { inServer: false }
            );

            // Now, if we just used GuildUsers.updateMany it would only change the documents we already know about
            // We need to update docs for users we know about, and add user we don't know about

            // Grab the users we know about
            const existingUserIds = (await GuildUsers.find(
                { guildId: guildId, userId: { $in: memberIds } },
                { userId: 1 } // just the userId. Same as .select
            ).lean())
                .map(user => user.userId);


            // updateMany docs for the users we already track
            if (existingUserIds.length > 0) {
                await GuildUsers.updateMany(
                    { guildId: guildId, userId: { $in: existingUserIds } },
                    { $set: { inServer: true } }
                );
            }

            // Insert ops for the users we don't already have docs for
            const newUserIds = memberIds.filter(id => !existingUserIds.includes(id));
            if (newUserIds.length > 0) {
                const newUsersToInsert = newUserIds.map(userId => ({
                    userId,
                    guildId,
                    inServer: true
                }));

                // Use insertMany for better performance with many users
                await GuildUsers.insertMany(
                    newUsersToInsert, 
                    { 
                        ordered: false,
                        setDefaultsOnInsert: false, 
                        runValidators: true,
                        lean: true         
                    }
                );
            }
        }

        cmd.followUp("Done")
    }
};
