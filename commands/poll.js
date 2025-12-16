// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { guildByObj, keyEncode, keyDecode } = require("./modules/database.js")
const { AttachmentBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, GuildMember}=require("discord.js");
function applyContext(context={}) {
	for (let key in context) {
		this[key] = context[key];
	}
}

// #endregion CommandBoilerplate

/** @type {Array<[string, string]>} */
// @ts-ignore
const pieCols = require("../data/pieCols.json");
const { isDirty, censor } = require("./filter");
// const Chart = require("chart.js")

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { limitLength } = require("../utils.js")
const { notify } = require("../utils");


const CHART_WIDTH = 1200;
const CHART_HEIGHT = 1200;
const BACKGROUND = 'rgba(16, 16, 16)'
const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
	// type: "svg",
    backgroundColour: BACKGROUND, // Dark theme background, adjust as needed
    // backgroundColour: 'rgba(0,0,0)', // Dark theme background, adjust as needed
    // plugins: [ ChartDataLabels ]
    plugins: {
		modern: [require('chartjs-plugin-datalabels')]
	}
});

/**
 * Generates the poll chart image using Chart.js.
 * @param {Map<string, number>} results - Map of option names to vote counts.
 * @param {string[]} orderedChoices - The original order of choices for color mapping.
 * @param {Array<[string, string]>} colorPalette - The pieCols array.
 * @returns {Promise<AttachmentBuilder | null>} - The attachment or null if no votes.
 */
async function generatePollChart(results, orderedChoices, colorPalette, 
	{
		showLegend=true, 
		showLabels=false,
		title="Poll Results",
		chartType="pie"
	}) {
	chartType ??= "pie"; // in case null
	showLegend ??= true;
	
    if (results.size === 0) {
        return null; // No votes, no chart
    }

    let labels = orderedChoices
		.filter(choice => results.has(choice) && results.get(choice) > 0);
	
    const data = labels.map(label => results.get(label));
	
    const backgroundColors = labels.map(label => {
        const index = orderedChoices.indexOf(label);
        return `#${colorPalette[index]?.[0] || "2C2F33"}`;
    });

	// Limit length of labels to render better
	labels = labels.map(option => limitLength(option, 20));

	const configuration = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: BACKGROUND, // White border for segments
                borderWidth: data.length > 1 ? 5 : 0 // Only show border if multiple segments
                // borderWidth: 1,
            }]
        },
        options: {
            responsive: false, // Important for node canvas
            animation: false,  // Important for node canvas
            plugins: {
                legend: {
                    display: showLegend,
                    align: "center",
                    position: "top",
                    labels: {
                        color: '#FFFFFF',
                        font: {
                            size: 32,
                            weight: 'bold'
                        },
                        textStrokeColor: '#ff0000ff',
                        textStrokeWidth: 2
                    }
                },
				datalabels: {
					formatter: (value, ctx) => {
						// const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
						// const percentage = ((value / total) * 100).toFixed(1) + '%';
						const label = ctx.chart.data.labels[ctx.dataIndex];
						return `${label} - ${value} vote${value==1?"":"s"}`;
					},
					color: (ctx) => {
						const bgColor = ctx.chart.data.datasets[0].backgroundColor[ctx.dataIndex];
						// Convert hex to RGB and calculate luminance
						const hex = bgColor.replace('#', '');
						const r = parseInt(hex.substring(0, 2), 16);
						const g = parseInt(hex.substring(2, 4), 16);
						const b = parseInt(hex.substring(4, 6), 16);
						const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
						return luminance > 0.5 ? '#000000' : '#FFFFFF';
					},
					font: {
						weight: 'bold',
						size: 24,
					},
					textShadow: {
						color: 'rgba(0,0,0,0.7)',
						strokeWidth: 6
					},
					align: 'center',
					anchor: 'center',
					display: showLabels
				},
                title: {
                    display: true,
                    text: limitLength(title, 100),
                    color: '#FFFFFF',
                    font: {
                        size: 40
                    }
                }
            }
        }
    };

    try {
        // @ts-ignore
        const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        return new AttachmentBuilder(buffer, { name: 'poll_results.png' });
    } catch (error) {
        console.error("Error generating poll chart:", error);
        return null; // Return null if chart generation fails
    }
}

/**
 * Calculates poll results from the database entry.
 * @param {Map<string, string[]>} pollOptionsMap - The Map from pollDB.options.
 * @returns {{ results: Map<string, number>, totalVotes: number }}
 */
function calculatePollResults(pollOptionsMap) {
    const results = new Map();
    let totalVotes = 0;
    for (const [option, voters] of pollOptionsMap.entries()) {
        const voteCount = voters.length;
        results.set(keyDecode(option), voteCount);
        totalVotes += voteCount;
    }
    return { results, totalVotes };
}

/**
 * Formats the main content string for the poll message.
 * @param {object} parsedPoll - The result of parsePoll(..., true).
 * @param {Map<string, number>} results - Map of option names to vote counts.
 * @param {Array<[string, string]>} colorPalette - The pieCols array.
 * @param {string} titlePrefix - e.g., "" or "Poll Closed\n"
 * @returns {string} - The formatted message content.
 */
function formatPollMessageContent(parsedPoll, results, colorPalette, titlePrefix = "") {
    let content = `${titlePrefix}<@${parsedPoll.starter}> asks: **${parsedPoll.title}**`;
    content += parsedPoll.choices.map((choice, i) => {
        const voteCount = results.get(choice) || 0;
        const colorInfo = (voteCount > 0 && colorPalette[i]) ? ` - ${colorPalette[i][1]}` : ""; // Show color name if votes exist
        return `\n${i}. ${choice} **${voteCount}**${colorInfo}`;
    }).join("");
    return content;
}

/**
 * Formats the voter list string.
 * @param {Map<string, string[]>} pollOptionsMap - The Map from pollDB.options.
 * @returns {string}
 */
function formatVoterList(pollOptionsMap) {
    let voterList = "\n\n**Voters**";
    let hasVoters = false;
    for (const [option, voters] of pollOptionsMap.entries()) {
        if (voters.length > 0) {
            hasVoters = true;
            voterList += `\n${keyDecode(option)}${voters.map(userId => `\n- <@${userId}>`).join("")}`;
        }
    }
    return hasVoters ? voterList : ""; // Return empty string if no voters at all
}

/**
 * Parses a poll message content and extracts poll details.
 *
 * @param {string} c - The content of the poll message.
 * @param {boolean} published - Indicates whether the poll is published.
 * @returns {Object|undefined} An object containing the parsed poll details:
 * - `title` {string}: The title of the poll.
 * - `options` {Array<string>|Object<string, number>}: The poll options. If `published` is true, this will be an object mapping options to their vote counts.
 * - `choices` {Array<string>}: The list of poll choices (only if `published` is true).
 * - `starter` {string}: The ID of the user who started the poll (only if `published` is true).
 * Returns `undefined` if an error occurs during parsing.
 */
function parsePoll(c, published=false){
    try{
        var ret={};
        ret.title=c.split("**")[1];
        ret.options=c.match(/(?<=^\d\.\s|\d\d\.\s).+(?:$)/gm)||[];
        if(published){
            var temp={};
            ret.choices=[];
            ret.options.forEach(a=>{
                var t=+a.split("**")[a.split("**").length-1];
                a=a.split("**")[0].trim();
                ret.choices.push(a);
                temp[a]=t;
            });
            ret.options=structuredClone(temp);
            ret.starter=c.split("<@")[1].split(">")[0];
        }

		// Tack on additional data not in the string


        return ret;
    }
    catch(e){}
}

const NodeCache = require("node-cache")
const pollSettingsCache = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour

module.exports = {
	data: {
		// Slash command data
		command: new SlashCommandBuilder().setName("poll").setDescription("Make a poll with automatically tracked options")
			.addStringOption(option=>
				option.setName("prompt").setDescription("The prompt (We'll set options in a minute)").setRequired(true)
			)
			.addBooleanOption(option=>
				option.setName("legend").setDescription("Should this chart include a legend?").setRequired(false)
			)
			.addBooleanOption(option=>
				option.setName("labels").setDescription("Should this chart include labels?").setRequired(false)
			)
			.addStringOption(option=>
				option.setName("chart").setDescription("What type of chart should I use?").setRequired(false).addChoices(
					{ name: 'Pie Chart', value: 'pie' },
					{ name: 'Doughnut Chart', value: 'doughnut' },
					{ name: 'Bar Chart', value: 'bar' },
					{ name: 'Polar Area Chart', value: 'polarArea' }, // polarArea charts do have a bug with the labels always rendering, and behind the area
				)
			),
		
		// Optional fields
		
		extra: {"contexts":[0],"integration_types":[0]},

		deferEphemeral: true,

		requiredGlobals: [],

		help: {
			helpCategories: [Categories.Entertainment, Categories.Server_Only],
			shortDesc: "Make a poll with automatically tracked options",//Should be the same as the command setDescription field
			detailedDesc: //Detailed on exactly what the command does and how to use it
				`Posts a poll with an automatically updated pie chart representing the response density.`
		},
	},

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
		applyContext(context);
		if (await isDirty(cmd.options.getString("prompt"), cmd.guild)) {
			cmd.followUp({
				content: "This server doesn't want me to process that prompt.",
				ephemeral: true
			});
			return;
		}
		const configurationMessage = await cmd.followUp({ 
			content: `**${await censor(cmd.options.getString("prompt"))}**`, 
			ephemeral: true,
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("poll-addOption").setLabel("Add a poll option").setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId("poll-delOption").setLabel("Remove a poll option").setStyle(ButtonStyle.Danger),
				new ButtonBuilder().setCustomId("poll-publish").setLabel("Publish the poll").setStyle(ButtonStyle.Success)
			).toJSON()]
		});

		pollSettingsCache.set(configurationMessage.id, {
			labels: cmd.options.getBoolean("labels"),
			legend: cmd.options.getBoolean("legend"),
			chart: cmd.options.getString("chart"),
		})
	},

	subscribedButtons: [/poll-.+/, /voted.*/],
	
    /** @param {import('discord.js').ButtonInteraction | import('discord.js').AnySelectMenuInteraction | import('discord.js').ModalSubmitInteraction } cmd */
    async onbutton(cmd, context) {
		applyContext(context);

		if (!cmd.customId) return;

		const guild = await guildByObj(cmd.guild);
		const pollDB = guild.polls.get(cmd.message.id);

		const title = pollDB?.title;
		const labels = pollDB?.labels;
		const legend = pollDB?.legend;
		const chart = pollDB?.chart;

		// Embedded helper to update a poll
		const updateActivePoll = async (interaction, currentPollDB, currentParsedPoll) => {
            const { results, totalVotes } = calculatePollResults(currentPollDB.options);
            const chartAttachment = totalVotes > 0
                ? await generatePollChart(results, currentParsedPoll.choices, pieCols, {
					title,
					chartType: chart,
					showLegend: legend,
					showLabels: labels,
				})
                : null; // Generate chart only if there are votes

            const content = formatPollMessageContent(currentParsedPoll, results, pieCols);
            const files = chartAttachment ? [chartAttachment] : [];

            try {
                await interaction.message.edit({ content, files });
            } catch (error) {
                notify("Failed to update poll message:\n" + error.stack);
            }
        };

		// todo: test type exits
		switch (cmd.customId) {
			case 'poll-addOption':
				if (!cmd.isButton()) break;

				await cmd.showModal(
                    new ModalBuilder()
                        .setCustomId("poll-added")
                        .setTitle("Add a poll option")
                        .addComponents(
							// @ts-ignore
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("poll-addedInp")
									.setLabel("What should the option be?")
									.setStyle(TextInputStyle.Short)
									.setMinLength(1)
									.setMaxLength(70)
									.setRequired(true)
							)
                        )
                );
			break;

			case 'poll-delOption':
				if (!cmd.isButton()) break;

				cmd.showModal(
                    new ModalBuilder()
                        .setCustomId("poll-removed")
                        .setTitle("Remove a poll option")
                        .addComponents(
							// @ts-ignore
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("poll-removedInp")
                                    .setLabel("Which # option should I remove?")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(1)
                                    .setMaxLength(2)
                                    .setRequired(true)
                            )
                        )
                );
			break;

			case 'poll-voters':
				if (!pollDB) {
					await cmd.reply({ content: "Poll data could not be found.", ephemeral: true });
					break;
				}
				const voterListString = formatVoterList(pollDB.options);
				await cmd.reply({
					content: limitLength(`**Voters**${voterListString || "\nNo votes yet."}`), // Handle no voters
					ephemeral: true,
					allowedMentions: { parse: [] }
				});
				break;

			case 'poll-removeVote':
				if (!pollDB) {
					await cmd.reply({ content: "Poll data could not be found.", ephemeral: true });
					break;
				}
				let voteRemoved = false;
				for (const voters of pollDB.options.values()) {
					const userIndex = voters.indexOf(cmd.user.id);
					if (userIndex > -1) {
						voters.splice(userIndex, 1);
						voteRemoved = true;
					}
				}

				if (voteRemoved) {
					const parsedPoll = parsePoll(cmd.message.content, true); // Parse active poll message
					await updateActivePoll(cmd, pollDB, parsedPoll);
					await cmd.deferUpdate();
					// await guild.save(); // Save after modification
				} else {
					await cmd.reply({ content: "You haven't voted in this poll.", ephemeral: true });
				}
				break;

			case 'poll-publish':
				if (!cmd.isButton()) break;
				
				if (!cmd.channel.permissionsFor(client.user.id).has(PermissionFlagsBits.SendMessages)) {
					cmd.reply({ content: `I can't send messages in this channel.`, ephemeral: true });
					break;
				}

				var poll = parsePoll(cmd.message.content);
				
				// Poll options not stored in the config message
				const otherPollOptions = pollSettingsCache.get(cmd.message.id)
				Object.assign(poll, otherPollOptions);

				var comp = [];
				var comp2 = [];
				for (var i = 0; i < poll.options.length; i++) {
					comp2.push(new ButtonBuilder().setCustomId("voted" + i).setLabel(poll.options[i]).setStyle(ButtonStyle.Primary));
					if (comp2.length === 5) {
						comp.push(new ActionRowBuilder().addComponents(...comp2));
						comp2 = [];
					}
				}
				if (comp2.length > 0) comp.push(new ActionRowBuilder().addComponents(...comp2));
				
				const msg = await cmd.channel.send({
					content: `<@${cmd.user.id}> asks: **${poll.title}**${
						poll.options.map((a, i) => `\n${i}. ${keyDecode(a)} **0**`).join("")}`,
					components: [
						// @ts-ignore
						...comp,
						// @ts-ignore
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId("poll-removeVote")
								.setLabel("Remove vote")
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId("poll-voters")
								.setLabel("View voters")
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId(
									"poll-closeOption" + cmd.user.id
								)
								.setLabel("Close poll")
								.setStyle(ButtonStyle.Danger)
						),
					],
					allowedMentions: { users: [] },
				})

				// Compile these options on top of the poll object or smth like that
				var t = {};
				poll.options.forEach((option) => {
					t[keyEncode(option)] = [];
				});
				poll.options = structuredClone(t);

				// Finally save the poll
				guild.polls.set(msg.id, poll);
				
				// Clear original poll
				cmd.update({ "content": "\u200b", components: [] });
				break;

			// Modals
			case 'poll-added':
				if (!cmd.isModalSubmit()) break;

				var poll = parsePoll(cmd.message.content);
				if (!poll) {
					await cmd.reply({ content: "Unable to parse that poll.", ephemeral: true });
					break;
				}
				if(poll.options.length>=20){
					cmd.reply({content:"It looks like you've already generated the maximum amount of options!",ephemeral:true});
					break;
				}
				if(await isDirty(cmd.fields.getTextInputValue("poll-addedInp"), cmd.guild)){
					cmd.reply({ephemeral:true,content:"I have been asked not to add this option by this server"});
					break;
				}
				poll.options.push(cmd.fields.getTextInputValue("poll-addedInp"));
				// @ts-ignore
				cmd.update(
					await censor(`**${poll.title}**${poll.options.map((a,i)=>`\n${i}. ${a}`).join("")}`)
				)
			break;
			
			case 'poll-removed':
				if (!cmd.isModalSubmit()) break;

				var ii = cmd.fields.getTextInputValue("poll-removedInp");

				if (!/^\d+$/.test(ii)) {
					cmd.deferUpdate();
					return;
				}
				var poll = parsePoll(cmd.message.content);
				if (!poll) {
					await cmd.reply({ content: "Unable to parse that poll.", ephemeral: true });
					break;
				}
				if (+ii > poll.options.length || +ii < 1) {
					cmd.deferUpdate();
					return;
				}
				poll.options.splice(+ii - 1, 1);
				// @ts-ignore
				cmd.update(`**${poll.title}**${poll.options.map((a, ii) => `\n${ii}. ${a}`).join("")}`);
				break;
			
			default:
				// All other (dynamic) buttons

				// Close poll
				if(cmd.customId?.startsWith("poll-closeOption")){
					if (!pollDB) {
						await cmd.reply({ content: "Poll data could not be found.", ephemeral: true });
						break;
					}
					const starterId = cmd.customId.substring("poll-closeOption".length);
					const canClose = cmd.user.id === starterId || (cmd.member instanceof GuildMember && cmd.member?.permissions.has(PermissionFlagsBits.ManageMessages));
		
					if (!canClose) {
						await cmd.reply({ content: "You didn't start this poll and you don't have sufficient permissions to override this", ephemeral: true });
						break;
					}
		
					const parsedPoll = parsePoll(cmd.message.content, true);
					const { results, totalVotes } = calculatePollResults(pollDB.options);
					const chartAttachment = totalVotes > 0
							? await generatePollChart(results, parsedPoll.choices, pieCols, {
								title,
								chartType: chart,
								showLegend: legend,
								showLabels: labels,
							})
							: null;

					let finalContent = formatPollMessageContent(parsedPoll, results, pieCols, "**Poll Closed**\n");
					finalContent += formatVoterList(pollDB.options); // Add voter list

					const files = chartAttachment ? [chartAttachment] : [];

					// @ts-ignore
					await cmd.update({
						content: limitLength(finalContent, 4000), // Limit final message length
						components: [], // Remove buttons
						allowedMentions: { parse: [] },
						files: files
					});

					// Delete poll data from DB
					guild.polls.delete(cmd.message.id);
				}

				// Vote
				if (cmd.customId?.startsWith("voted")) {
					if (!pollDB) {
						await cmd.reply({ content: "Poll data could not be found.", ephemeral: true });
						break;
					}

					const voteIndexStr = cmd.customId.substring("voted".length);
					const voteIndex = parseInt(voteIndexStr, 10);

					const parsedPoll = parsePoll(cmd.message.content, true);
					if (!parsedPoll) {
						await cmd.reply({ content: "Unable to parse that poll.", ephemeral: true });
						break;
					}
					if (voteIndex < 0 || voteIndex >= parsedPoll.choices.length) {
						console.warn(`Vote index out of bounds: ${voteIndex} for poll ${cmd.message.id}`);
						await cmd.reply({ content: "Invalid vote option selected.", ephemeral: true });
						break;
					}
					const chosenOption = keyEncode(parsedPoll.choices[voteIndex]);

					// Remove existing vote(s) first
					let alreadyVotedForThis = false;
					for (const [option, voters] of pollDB.options.entries()) {
					// for (const [option, voters] of Object.entries(pollDB.options)) {
						const userIndex = voters.indexOf(cmd.user.id);
						if (userIndex > -1) {
							if (option === chosenOption) {
								alreadyVotedForThis = true;
							}
							voters.splice(userIndex, 1);
						}
					}

					// Add the new vote
					if (alreadyVotedForThis) {
						// User clicked the same option they already voted for - treat as removing vote
						await cmd.reply({ content: "Your vote for this option has been removed.", ephemeral: true });
					} else {
						const optionVoters = pollDB.options.get(chosenOption);
						if (!optionVoters) {
							await cmd.reply({ content: "This option is no longer available.", ephemeral: true });
							break;
						}
						optionVoters.push(cmd.user.id);
						// pollDB.options[chosenOption].push(cmd.user.id);
						await cmd.deferUpdate();
					}

					await updateActivePoll(cmd, pollDB, parsedPoll);
				}

				break;
		}
		
		// Save if changed
		await guild.save();
	}
};
