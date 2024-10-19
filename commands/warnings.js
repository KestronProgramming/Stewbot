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
            ).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		requiredGlobals: ["defaultGuildUser", "limitLength"],

		// help: {
		// 	helpCategory: "General",
		// 	helpDesc: "View uptime stats",
		// 	// helpSortPriority: 1
		// },
	},

	async execute(cmd, context) {
		applyContext(context);
		
        if(cmd.options.getUser("who")!==null) {
            if(!storage[cmd.guild.id].users.hasOwnProperty(cmd.options.getUser("who").id)){
                storage[cmd.guild.id].users[cmd.options.getUser("who").id]=structuredClone(defaultGuildUser);
            }
            if(!storage[cmd.guild.id].users[cmd.options.getUser("who").id].hasOwnProperty("warnings")){
                storage[cmd.guild.id].users[cmd.options.getUser("who").id].warnings=[];
            }
            cmd.followUp({content:limitLength(`${storage[cmd.guild.id].users[cmd.options.getUser("who").id].warnings.length>0?`There are ${storage[cmd.guild.id].users[cmd.options.getUser("who").id].warnings.length} warnings for <@${cmd.options.getUser("who").id}>.${storage[cmd.guild.id].users[cmd.options.getUser("who").id].warnings.map((a,i)=>`\n${i}. <@${a.moderator}>: \`${a.reason}\`, level **${a.severity}**, given <t:${a.when}:R>.`).join("")}`:`This user has no warnings currently present.`}`),allowedMentions:{parse:[]},components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Remove a Warning").setStyle(ButtonStyle.Danger).setCustomId(`remWarn-${cmd.options.getUser("who").id}`),new ButtonBuilder().setLabel("Clear all Warnings").setStyle(ButtonStyle.Danger).setCustomId(`clearWarn-${cmd.options.getUser("who").id}`))]});
        }
        else {

			const warningsArray = Object.keys(storage[cmd.guild.id].users).map(
                (a) =>
                    storage[cmd.guild.id].users[a].hasOwnProperty("warnings")
                        ? storage[cmd.guild.id].users[a].warnings.length > 0
                            ? `\n- <@${a}>: \`${
                                  storage[cmd.guild.id].users[a].warnings.length
                              }\` warnings dealt. Sum of Severities: \`${
                                  storage[cmd.guild.id].users[a].warnings
                                      .length > 1
                                      ? storage[cmd.guild.id].users[
                                            a
                                        ].warnings.reduce(
                                            (b, c) =>
                                                (typeof b === "object"
                                                    ? b.severity
                                                    : b) + c.severity
                                        )
                                      : storage[cmd.guild.id].users[a]
                                            .warnings[0].severity
                              }\``
                            : ``
                        : ``
            ).filter(warning => warning !== "");

            cmd.followUp({
                content: limitLength(
                    `**Warnings in ${cmd.guild.name}**${warningsArray.length > 0 ? warningsArray.join("") : `\n-# No Warnings have been issued. Use ${cmds.warn.mention} to issue a warning.`}`
                ),
                allowedMentions: { parse: [] },
            });
        }
	}
};
