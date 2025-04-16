// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Guilds, Users, guildByID, userByID, guildByObj, userByObj, guildUserByObj, GuildUsers } = require("./modules/database.js")
const { ContextMenuCommandBuilder, InteractionContextType: IT, ApplicationIntegrationType: AT, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
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

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("warnings").setDescription("See the warnings that have been dealt in the server")
            .addUserOption(option=>
                option.setName("who").setDescription("Do you want to see the warnings for a specific person?")
            ).addBooleanOption(option=>
                option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
            ).addStringOption(option =>
                option.setName("sort").setDescription("How to sort the warnings").setChoices(
                    { name: "By number of warnings", value: "warnings" },
                    { name: "By sum of severity", value: "severity" },
                ).setRequired(false)
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["defaultGuildUser"],

		help: {
			helpCategories: [Categories.Administration, Categories.Information, Categories.Server_Only],
			shortDesc: "See the warnings that have been dealt in the server",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Moderators can use this command to view a list of warnings dealt, specifying a user will show only the warnings affecting that user, and not specifying a user will list users that have received warnings and a sum of the severities.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);

        const sortMethod = cmd.options.getString("sort") || "severity";
        const who = cmd.options.getUser("who");
		
        if(who!==null) {

            const guildUser = await guildUserByObj(cmd.guild, who.id);

            cmd.followUp({
                content: limitLength(
                    `${
                        guildUser.warnings.length > 0
                            ? `There are ${
                                guildUser.warnings.length
                              } warnings for <@${
                                  who.id
                              }>.${
                                guildUser.warnings
                                    .map(
                                        (a, i) =>
                                            `\n${i}. <@${a.moderator}>: \`${a.reason}\`, level **${a.severity}**, given <t:${a.when}:R>.`
                                    )
                                    .join("")}`
                            : `This user has no warnings currently present.`
                    }`
                ),
                allowedMentions: { parse: [] },
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Remove a Warning")
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(
                                `remWarn-${who.id}`
                            ),
                        new ButtonBuilder()
                            .setLabel("Clear all Warnings")
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(
                                `clearWarn-${who.id}`
                            )
                    ),
                ],
            });
        }
        else {
            // Decide how to sort
            let sortStage = { };
            switch (sortMethod) {
                case "warnings":
                    sortStage = {
                        warningsCount: -1,
                        sumSeverity: -1,
                    }
                    break
                case "severity":
                    sortStage = {
                        sumSeverity: -1,
                        warningsCount: -1,
                    }
                    break
            }

            // Collect all users with warnings
            const warningData = await GuildUsers.aggregate([
                {
                    // Get all users of this guild, with at least one warning
                    $match: {
                        guildId: cmd.guild.id,
                        "warnings.0": { $exists: true }
                    }
                },
                {
                    // get the number of warnings, the sum of the severity, and the user ID.
                    $project: {
                        userId: 1,
                        warningsCount: { $size: "$warnings" },
                        sumSeverity: {
                            $sum: {
                                $map: {
                                    input: "$warnings",
                                    as: "w",
                                    in: {
                                        $cond: {
                                            if: {
                                                $gt: ["$$w.severity", null]
                                            },
                                            then: "$$w.severity",
                                            else: 0
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                // Finally sort as requested
                { $sort: sortStage }
            ]);

            // Parse data into warnings message
            const warningsMessage = warningData.map( data => {
                return `\n- <@${data.userId}>: \`${data.warningsCount}\` warnings dealt. Sum of Severities: \`${data.sumSeverity}\``
            })

            cmd.followUp({
                content: limitLength(
                    `**Warnings in ${cmd.guild.name}**${
                        warningsMessage.length > 0 
                            ? warningsMessage.join("") 
                            : `\n-# No Warnings have been issued. Use ${cmds.warn.mention} to issue a warning.`}`
                ),
                allowedMentions: { parse: [] },
            });
        }
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/.*Warn.*/],
	
    /** @param {import('discord.js').ButtonInteraction} cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		if(cmd.customId?.startsWith("remWarn-")){
            if(cmd.member.permissions.has(PermissionFlagsBits.ManageNicknames)){
                cmd.showModal(new ModalBuilder().setTitle("Remove a Warning").setCustomId(`remWarning-${cmd.customId.split("remWarn-")[1]}`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("warning").setLabel("Warning to remove").setPlaceholder("1").setStyle(TextInputStyle.Short).setMaxLength(2))));
            }
            else{
                cmd.deferUpdate();
            }
        }
        
        if(cmd.customId?.startsWith("clearWarn-")){
            if(cmd.member.permissions.has(PermissionFlagsBits.KickMembers)){
                cmd.showModal(new ModalBuilder().setTitle("Clear All Warnings - Are you sure?").setCustomId(`clearWarning-${cmd.customId.split("clearWarn-")[1]}`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("confirm").setLabel("Are you sure?").setPlaceholder("\"Yes\"").setStyle(TextInputStyle.Short).setMaxLength(3).setMinLength(3))));
            }
            else{
                cmd.deferUpdate();
            }
        }

        if(cmd.customId?.startsWith("remWarning-")){
            const guildUser = await guildUserByObj(cmd.guild, cmd.customId.split("remWarning-")[1]);

            if(!/\d\d?/ig.test(cmd.fields.getTextInputValue("warning"))){
                cmd.deferUpdate();
            }
            else if (+cmd.fields.getTextInputValue("warning") >= guildUser.warnings.length) {
                cmd.deferUpdate();
            }
            else{
                guildUser.warnings.splice(cmd.fields.getTextInputValue("warning")-1, 1);
                cmd.reply({content:`Alright, I have removed warning \`${cmd.fields.getTextInputValue("warning")}\` from <@${cmd.customId.split("-")[1]}>.`,allowedMentioned:{parse:[]}});
            }
            guildUser.save();
        }
        
        if(cmd.customId?.startsWith("clearWarning-")){
            const guildUser = await guildUserByObj(cmd.guild, cmd.customId.split("-")[1]);

            if(cmd.fields.getTextInputValue("confirm").toLowerCase()!=="yes"){
                cmd.deferUpdate();
            }
            else{
                guildUser.warnings=[];
                guildUser.save();
                cmd.reply({content:`Alright, I have cleared all warnings for <@${cmd.customId.split("-")[1]}>`,allowedMentions:{parse:[]}});
            }
        }
	}
};
