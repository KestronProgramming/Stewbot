// #region Boilerplate
const { SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

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

		requiredGlobals: ["defaultGuildUser", "limitLength"],

		help: {
			helpCategories: ["Administration","Information","Server Only"],
			/*
				- General -> Generic commands almost every bot has
				- Information -> A command designed purely to provide information of some kind
				- Bot -> A command designed specifically for managing the bot itself
				- Administration -> A command that needs moderator priviledges
				- Configuration -> A command that changes settings of some kind
				- Entertainment -> A command that is related to a fun feature of some kind
				- Context Menu -> A command accessed via the context menu
				- Other/Misc -> Commands without another good category
				- Server Only -> Commands that can only be run in servers
				- User Install Only -> Commands that can only be run if Stewbot is installed to your user
			*/
			shortDesc: "See the warnings that have been dealt in the server",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Moderators can use this command to view a list of warnings dealt, specifying a user will show only the warnings affecting that user, and not specifying a user will list users that have received warnings and a sum of the severities.`
		},
	},

	async execute(cmd, context) {
		applyContext(context);

        const sortMethod = cmd.options.getString("sort") || "severity";
		
        if(cmd.options.getUser("who")!==null) {
            if(!storage[cmd.guild.id].users.hasOwnProperty(cmd.options.getUser("who").id)){
                storage[cmd.guild.id].users[cmd.options.getUser("who").id]=structuredClone(defaultGuildUser);
            }
            if(!storage[cmd.guild.id].users[cmd.options.getUser("who").id].hasOwnProperty("warnings")){
                storage[cmd.guild.id].users[cmd.options.getUser("who").id].warnings=[];
            }
            cmd.followUp({
                content: limitLength(
                    `${
                        storage[cmd.guild.id].users[
                            cmd.options.getUser("who").id
                        ].warnings.length > 0
                            ? `There are ${
                                  storage[cmd.guild.id].users[
                                      cmd.options.getUser("who").id
                                  ].warnings.length
                              } warnings for <@${
                                  cmd.options.getUser("who").id
                              }>.${storage[cmd.guild.id].users[
                                  cmd.options.getUser("who").id
                              ].warnings
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
                                `remWarn-${cmd.options.getUser("who").id}`
                            ),
                        new ButtonBuilder()
                            .setLabel("Clear all Warnings")
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(
                                `clearWarn-${cmd.options.getUser("who").id}`
                            )
                    ),
                ],
            });
        }
        else {
            // Collect all users with warnings
            const usersWithWarnings = Object.keys(storage[cmd.guild.id].users).filter(id => {
                const user = storage[cmd.guild.id].users[id];
                return user.hasOwnProperty("warnings") && user.warnings.length > 0;
            })

            // Collect data we need from these user
            const warningData = usersWithWarnings.map(id => {
                const usersWarnings = storage[cmd.guild.id].users[id].warnings;
                return [ // I'd use json but arrays are faster and we could be searching through 250K users
                    id,
                    usersWarnings.length,
                    usersWarnings.reduce((b, c) =>
                        (typeof b === "object" ? b.severity : b) + c.severity
                    , {severity:0}),
                ]
            })

            // Sort  <-  this is a code comment
            warningData.sort((data1, data2) => {
                switch (sortMethod) {
                    case "warnings":
                        return data2[1] - data1[1];
                    case "severity":
                        return data2[2] - data1[2];
                }
            })

            // Parse data into warnings message
            const warningsMessage = warningData.map( data => {
                return `\n- <@${data[0]}>: \`${data[1]}\` warnings dealt. Sum of Severities: \`${data[2]}\``
            })

            cmd.followUp({
                content: limitLength(
                    `**Warnings in ${cmd.guild.name}**${warningsMessage.length > 0 ? warningsMessage.join("") : `\n-# No Warnings have been issued. Use ${cmds.warn.mention} to issue a warning.`}`
                ),
                allowedMentions: { parse: [] },
            });
        }
	},

	// Only button subscriptions matched will be sent to the handler 
	subscribedButtons: [/.*Warn.*/],
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
            if(!/\d\d?/ig.test(cmd.fields.getTextInputValue("warning"))){
                cmd.deferUpdate();
            }
            else if(+cmd.fields.getTextInputValue("warning")>=storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings.length){
                cmd.deferUpdate();
            }
            else{
                storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings.splice(cmd.fields.getTextInputValue("warning")-1,1);
                cmd.reply({content:`Alright, I have removed warning \`${cmd.fields.getTextInputValue("warning")}\` from <@${cmd.customId.split("-")[1]}>.`,allowedMentioned:{parse:[]}});
            }
        }
        
        if(cmd.customId?.startsWith("clearWarning-")){
            if(cmd.fields.getTextInputValue("confirm").toLowerCase()!=="yes"){
                cmd.deferUpdate();
            }
            else{
                storage[cmd.guild.id].users[cmd.customId.split("-")[1]].warnings=[];
                cmd.reply({content:`Alright, I have cleared all warnings for <@${cmd.customId.split("-")[1]}>`,allowedMentions:{parse:[]}});
            }
        }
	}
};
