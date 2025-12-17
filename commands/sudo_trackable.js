const { Trackables } = require("./modules/database.js");
const { InteractionContextType: IT, ApplicationIntegrationType: AT, SlashCommandBuilder } = require("discord.js");

const { getTrackableEditor } = require("./trackable.js");
const { isSudo } = require("../utils.js");

module.exports = {
    data: {
        sudo: true,

        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName("sudo_trackable")
            .setDescription("Do sudo stuff to trackables")
            .addSubcommand(command => command.setName("set_id").setDescription("Change a trackable ID")
                .addStringOption(option =>
                    option.setName("id_from").setDescription("What trackable to edit?")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("id_to").setDescription("What should the ID be set to?")
                        .setRequired(true)
                )
            )
            .addSubcommand(command => command.setName("make_special").setDescription("Make a trackable special")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("new_id").setDescription("What should the ID be set to?")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("new_tag").setDescription("What should the tag be?")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("new_desc").setDescription("What should the description be?")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("emoji").setDescription("What emoji should it use?")
                        .setRequired(false)
                )
            )
            .addSubcommand(command => command.setName("show_editor").setDescription("Pull up a trackable editor")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?")
                        .setRequired(true)
                )
            )
            .addSubcommand(command => command.setName("set_status").setDescription("Pull up a trackable editor")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("status").setDescription("What trackable to edit?")
                        .setRequired(true)
                        .addChoices(
                            { "name": "editing", "value": "editing" },
                            { "name": "published", "value": "published" },
                            { "name": "banned", "value": "banned" }
                        )
                )
            )
            .addSubcommand(command => command.setName("transfer").setDescription("Move a trackable into a user's inventory")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?")
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName("who").setDescription("Who to give it to?")
                        .setRequired(true)
                )
            ),

        requiredGlobals: [],

        help: {
            helpCategories: [""], //Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only", //Should be the same as the command setDescription field
            detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd) {
        const isSudoUser = await isSudo(cmd.user.id);

        if (isSudoUser) {
            switch (cmd.options.getSubcommand()) {

                case "set_id": {
                    let id_from = cmd.options.getString("id_from");
                    let id_to = cmd.options.getString("id_to");

                    await Trackables.updateOne(
                        { id: id_from },
                        { "$set": { "id": id_to } }
                    );

                    await cmd.followUp("Done.");
                    break;
                }

                case "make_special": {
                    let id = cmd.options.getString("id");
                    let new_id = cmd.options.getString("new_id");
                    let new_tag = cmd.options.getString("new_tag");
                    let new_desc = cmd.options.getString("new_desc");
                    let emoji = cmd.options.getString("emoji") || "🌟";

                    let trackable = await Trackables.findOne({ id });
                    if (!trackable) return cmd.followUp("I couldn't find this trackable");
                    trackable.color = 0xf5d400;
                    trackable.name =  `${emoji} ${trackable.name}`;
                    trackable.owner = "special";
                    if (new_id) trackable.id = new_id;
                    if (new_tag) trackable.tag = new_tag;
                    if (new_desc) trackable.desc = new_desc;

                    await trackable.save();
                    await cmd.followUp("Done.");
                    break;
                }

                case "show_editor": {
                    let id = cmd.options.getString("id");
                    let trackable = await Trackables.findOne({ id });

                    if (!trackable) return cmd.followUp("I couldn't find this trackable");

                    // @ts-ignores
                    cmd.followUp(getTrackableEditor(trackable, true));
                    break;
                }

                case "set_status": {
                    let id = cmd.options.getString("id");
                    let status = cmd.options.getString("status");

                    let trackable = await Trackables.findOne({ id });

                    if (!trackable) return cmd.followUp("I couldn't find this trackable");

                    // @ts-ignore
                    trackable.status = status;
                    trackable.save();

                    cmd.followUp("Done");
                    break;
                }

                case "transfer": {
                    let id = cmd.options.getString("id");
                    let who = cmd.options.getUser("who");

                    let trackable = await Trackables.findOne({ current: `u${who.id}` });
                    if (trackable) return cmd.followUp("That user already has a trackable in their inventory.");

                    await Trackables.updateOne(
                        { id },
                        {
                            $set: {
                                current: `u${who.id}`,
                                placed: Date.now(),
                                currentName: `Moved by admin`
                            },
                            $unset: ["expirationWarnedAboutAt"]
                        }
                    );

                    await cmd.followUp("Done");

                    break;
                }
            }
        }
        else {
            cmd.followUp("This command is for bot admins only.");
        }
    }

};
