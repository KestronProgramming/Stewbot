const { Trackables } = require("./modules/database.js")
const { InteractionContextType: IT, ApplicationIntegrationType: AT, SlashCommandBuilder} = require("discord.js");

const config = require("../data/config.json");
const { getTrackableEditor } = require("./trackable.beta.js")

module.exports = {
    data: {
        sudo: true,
        
        command: new SlashCommandBuilder()
            .setContexts(
                IT.Guild,          // Server command
                IT.BotDM,          // Bot's DMs
                IT.PrivateChannel, // User commands
            )
            .setIntegrationTypes(
                AT.GuildInstall,   // Install to servers
                AT.UserInstall     // Install to users
            )
            .setName('sudo_trackable').setDescription('Do sudo stuff to trackables')
            .addSubcommand(command => command.setName("set_id").setDescription("Change a trackable ID")
                .addStringOption(option =>
                    option.setName("id_from").setDescription("What trackable to edit?").setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("id_to").setDescription("What should the ID be set to?").setRequired(true)
                )
            )
            .addSubcommand(command => command.setName("make_special").setDescription("Make a trackable special")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?").setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("new_id").setDescription("What should the ID be set to?").setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("new_tag").setDescription("What should the tag be?").setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("new_desc").setDescription("What should the description be?").setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("emoji").setDescription("What emoji should it use?").setRequired(false)
                )
            )
            .addSubcommand(command => command.setName("show_editor").setDescription("Pull up a trackable editor")
                .addStringOption(option =>
                    option.setName("id").setDescription("What trackable to edit?").setRequired(true)
                )
            ),

        requiredGlobals: [],

        help:{
            helpCategories: [""],//Do not show in any automated help pages
            shortDesc: "Stewbot's Admins Only",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Stewbot's Admins Only`
        }
    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd) {
        if (cmd.guild?.id === config.homeServer && cmd.channel.id === config.commandChannel) {
            switch (cmd.options.getSubcommand()) {

                case "set_id":
                    var id_from = cmd.options.getString("id_from");
                    var id_to = cmd.options.getString("id_to");

                    await Trackables.updateOne(
                        { id: id_from },
                        { "$set": { "id": id_to } }
                    )

                    await cmd.followUp("Done.");
                    break;

                case "make_special":
                    var new_id = cmd.options.getString("new_id");
                    var new_tag = cmd.options.getString("new_tag");
                    var new_desc = cmd.options.getString("new_desc");
                    var emoji = cmd.options.getString("emoji") || ":star2: ";

                    var trackable = await Trackables.findOne({ id: id_to });
                    if (!trackable) cmd.followUp("I couldn't find this trackable");
                    trackable.color = 0xf5d400;
                    trackable.name =  `${emoji} ${trackable.name}`;
                    trackable.owner = "special";
                    if (new_id) trackable.id = new_id;
                    if (new_tag) trackable.tag = new_tag;
                    if (new_desc) trackable.desc = new_desc;

                    await trackable.save()
                    await cmd.followUp("Done.");
                    break;

                case "show_editor":
                    var id = cmd.options.getString("id");
                    var trackable = await Trackables.findOne({ id });

                    if (!trackable) cmd.followUp("I couldn't find this trackable");

                    // @ts-ignores
                    cmd.followUp(getTrackableEditor(trackable, true));
                    break;
            }
        }
        else {
            cmd.reply("This command is for bot admins only, and can only be used in mod bot commands.");
        }
    },

};
