// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const client = require("../client.js");
const { AttachmentBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require("discord.js");
function applyContext(context = {}) {
    for (let key in context) {
        this[key] = context[key];
    }
}

// #endregion CommandBoilerplate

const fs = require("fs");

// RaC utilities
let rac = {
    board: [],
    lastPlayer: "Nobody",
    timePlayed: 0,
    players: [],
    icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789"
};
function getRACBoard(localRac) {
    rac = localRac || rac; // Handle calls from inside modules and outside using the above global
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let mess = [];
    let temp = "  ";
    for (var i = 0; i < rac.board.length; i++) {
        mess.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp += ` ${racChars[i]}`;
    }
    mess.unshift(temp);
    const lastMoveStr = rac.lastPlayer === "Nobody" ? "None" : `<@${rac.lastPlayer}>`;
    let textMess = `Last Moved: ${lastMoveStr} ${(rac.timePlayed !== 0 ? `<t:${Math.round(rac.timePlayed / 1000)}:R>` : "")}\`\`\`\n${mess.join("\n")}\`\`\`\nPlayers: `;
    for (let i = 0; i < rac.players.length; i++) {
        textMess += `\n<@${rac.players[i]}>: \`${rac.icons[i]}\``;
    }
    return `**Rows & Columns**\n${textMess}`;
}
function readRACBoard(toRead) {
    rac.lastPlayer = toRead.split("<@")[1].split(">")[0];
    try {
        rac.timePlayed = Math.round(+toRead.split("<t:")[1].split(":R>")[0] * 1000);
    }
    catch {
        rac.timePlayed = 0;
    }
    let board = toRead.split("```\n")[1].split("```")[0];
    let rows = board.split("\n");
    rac.rowsActive = rows[0].replaceAll(" ", "");
    rows.splice(0, 1);
    for (var i = 0; i < rows.length; i++) {
        rows[i] = rows[i]
            .slice(3, rows[i].length)
            .replaceAll("|", "")
            .split("");
    }
    rac.board = rows;
    let tmpPlayers = toRead.split("Players: \n")[1].split("<@");
    rac.players = [];
    for (let i = 1; i < tmpPlayers.length; i++) {
        rac.players.push(tmpPlayers[i].split(">")[0]);
    }
}
function scoreRows(game, char) {
    var score = 0;
    game.forEach((row) => {
        row = row.join(""); // row is an array of chars, this function expects a string
        var search = char.repeat(row.length);
        while (search.length > 2 && row) {
            if (row.includes(search)) {
                row = row.substring(0, row.indexOf(search)) + row.substring(row.indexOf(search) + search.length);
                score += search.length - 2;
            }
            else {
                search = search.substring(1);
            }
        }
    });
    return score;
}
function rotateGame(game) {
    var newGame = [];
    for (var i = 0; i < game.length; i++) {
        var newCol = [];
        for (var j = 0; j < game.length; j++) {
            newCol.push(game[j][i]);
        }
        newGame.push(newCol);
    }
    return newGame;
}
function score(game, char) {
    var score = scoreRows(game, char);
    score += scoreRows(rotateGame(game), char);
    return score;
}
function tallyRac() {
    let playerObjects = []; // we're gonna manage this the right way
    for (var i = 0; i < rac.players.length; i++) {
        const playerScore = score(rac.board, rac.icons[i]);
        playerObjects.push({
            playerID: rac.players[i],
            score: playerScore
        });
    }
    // Build the board
    let resultsMessage = [];
    let temp = "  ";
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < rac.board.length; i++) {
        resultsMessage.push(`${racChars[i]} |${rac.board[i].join("|")}|`);
        temp += ` ${racChars[i]}`;
    }
    resultsMessage.unshift(temp);
    playerObjects.sort((a, b) => b.score - a.score);
    const highestScore = playerObjects[0].score;
    const winningPlayers = playerObjects.filter(player => player.score === highestScore);

    const winnersMention = `<@${winningPlayers.map(obj => obj.playerID).join(">, <@")}>`;
    let resultsMessageText = `Winner${winningPlayers.length > 1 ? "s" : ""}: ${winnersMention} :trophy:\`\`\`\n${resultsMessage.join("\n")}\`\`\`\nPlayers: `;

    // Now add everybody else
    const positionEmojis = [
        ":first_place:",
        ":second_place:",
        ":third_place:"
    ];

    let currentRank = 0;
    let previousScore = null;
    playerObjects.forEach((player, index) => {
        if (player.score !== previousScore) {
            currentRank = index;
        }
        const emoji = positionEmojis[currentRank] || "";
        resultsMessageText += `\n<@${player.playerID}>: \`${rac.icons[rac.players.indexOf(player.playerID)]}\` - score ${player.score} ${emoji}`;
        previousScore = player.score;
    });

    return `**Rows & Columns**\n${resultsMessageText}`;
}
function randomName() {
    var letters = "abcdefghiklmnopqrstuvwxyz";
    var vowels = "aeiouy";//Y is considered a vowel here because the idea is just a janky "does this sound work"
    let nameR = "";
    for (var k = 0; k < 2; k++) {
        nameR += letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)] + vowels[Math.floor(Math.random() * vowels.length)];
    }
    nameR += letters[Math.floor(Math.random() * letters.length)];
    return nameR[0].toUpperCase() + nameR.slice(1);
}

// ============================================
// MINESWEEPER GAME GENERATOR
// ============================================

/**
 * Gets all valid neighbor indices for a given cell position
 * @param {number} index - The cell index in the flat board array
 * @param {number} width - Board width
 * @param {number} height - Board height
 * @returns {number[]} Array of valid neighbor indices
 */
function getNeighborIndices(index, width, height) {
    const row = Math.floor(index / width);
    const col = index % width;
    const neighbors = [];

    // Check all 8 directions: top-left, top, top-right, left, right, bottom-left, bottom, bottom-right
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
            // Skip the center cell (the cell itself)
            if (deltaRow === 0 && deltaCol === 0) continue;

            const newRow = row + deltaRow;
            const newCol = col + deltaCol;

            // Check if the neighbor is within bounds
            if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width) {
                neighbors.push(newRow * width + newCol);
            }
        }
    }

    return neighbors;
}

/**
 * Recursively reveals all connected cells that have zero adjacent mines
 * @param {number} startIndex - The starting cell index
 * @param {number[]} board - The game board (9 = mine, 0-8 = count)
 * @param {boolean[]} revealed - Which cells are currently revealed
 * @param {number} width - Board width
 * @param {number} height - Board height
 */
function revealConnectedZeros(startIndex, board, revealed, width, height) {
    const toProcess = [startIndex];
    const processed = new Set();

    while (toProcess.length > 0) {
        const currentIndex = toProcess.pop();

        // Skip if already processed
        if (processed.has(currentIndex)) continue;
        processed.add(currentIndex);

        // Reveal this cell
        revealed[currentIndex] = true;

        // If this cell has zero adjacent mines, reveal its neighbors too
        if (board[currentIndex] === 0) {
            const neighbors = getNeighborIndices(currentIndex, width, height);

            for (const neighborIndex of neighbors) {
                // Only process unrevealed, non-mine neighbors
                if (!revealed[neighborIndex] && board[neighborIndex] !== 9) {
                    revealed[neighborIndex] = true;

                    // If neighbor is also a zero, add it to the queue
                    if (board[neighborIndex] === 0 && !processed.has(neighborIndex)) {
                        toProcess.push(neighborIndex);
                    }
                }
            }
        }
    }
}

/**
 * Generates a complete Minesweeper game board
 * @param {number} width - Board width
 * @param {number} height - Board height
 * @param {number} mineCount - Number of mines to place
 * @param {boolean} autoRevealStart - Whether to auto-reveal a safe starting area
 * @returns {Object} Object containing board data and revealed state
 */
function generateMinesweeper(width, height, mineCount, autoRevealStart = false) {
    const totalCells = width * height;
    const MINE_VALUE = 9;

    // Initialize board with all zeros
    const board = new Array(totalCells).fill(0);
    const revealed = new Array(totalCells).fill(false);

    // Ensure mine count doesn't exceed available cells
    const actualMineCount = Math.min(mineCount, totalCells - 1);

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < actualMineCount) {
        const randomIndex = Math.floor(Math.random() * totalCells);

        // Only place mine if cell doesn't already have one
        if (board[randomIndex] !== MINE_VALUE) {
            board[randomIndex] = MINE_VALUE;
            minesPlaced++;
        }
    }

    // Calculate numbers for non-mine cells
    for (let i = 0; i < totalCells; i++) {
        // Skip mine cells
        if (board[i] === MINE_VALUE) continue;

        // Count adjacent mines
        const neighbors = getNeighborIndices(i, width, height);
        let adjacentMines = 0;

        for (const neighborIndex of neighbors) {
            if (board[neighborIndex] === MINE_VALUE) {
                adjacentMines++;
            }
        }

        board[i] = adjacentMines;
    }

    // Always reveal at least one safe starting cell
    // Find a random cell with zero adjacent mines
    const zeroCells = [];
    for (let i = 0; i < totalCells; i++) {
        if (board[i] === 0) {
            zeroCells.push(i);
        }
    }

    // If we found any zero cells, reveal one (and optionally its connected area)
    if (zeroCells.length > 0) {
        const randomZeroIndex = zeroCells[Math.floor(Math.random() * zeroCells.length)];

        if (autoRevealStart) {
            // Reveal the entire connected zero area (start_me = true)
            revealConnectedZeros(randomZeroIndex, board, revealed, width, height);
        }
        else {
            // Just reveal the single random zero cell (start_me = false)
            // This keeps us under Discord's 100 spoiler tag limit, which causes a square to be unrevealed if a 10*10 board. We apply this rule everywhere else for consistency.
            revealed[randomZeroIndex] = true;
        }
    }

    return { board, revealed };
}

/**
 * Formats the Minesweeper board for Discord markdown
 * @param {number[]} board - The game board
 * @param {boolean[]} revealed - Which cells are revealed
 * @param {string[]} emojis - Emoji set to use (0-8 for numbers, 9 for mine)
 * @param {number} width - Board width
 * @param {number} height - Board height
 * @returns {string} Formatted Discord message
 */
function formatMinesweeperBoard(board, revealed, emojis, width, height) {
    let output = "";

    for (let row = 0; row < height; row++) {
        let rowText = "";

        for (let col = 0; col < width; col++) {
            const index = row * width + col;
            const cellEmoji = emojis[board[index]];

            // Wrap in spoiler tags if not revealed
            if (revealed[index]) {
                rowText += cellEmoji;
            }
            else {
                rowText += `||${cellEmoji}||`;
            }
        }

        output += rowText + "\n";
    }

    return output;
}

module.exports = {
    data: {
        // Slash command data
        command: new SlashCommandBuilder().setName("fun")
            .setDescription("Posts something fun to enjoy")
            .addSubcommand(command =>
                command.setName("meme").setDescription("Posts a meme")
                    .addIntegerOption(option =>
                        option.setName("number").setDescription("Specific meme # to post (optional)")
                            .setMinValue(0)
                    )
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            )
            .addSubcommand(command =>
                command.setName("joke").setDescription("Posts a joke")
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            )
            .addSubcommand(command =>
                command.setName("wyr").setDescription("Posts a Would-You-Rather question")
            )
            .addSubcommand(command =>
                command.setName("dne").setDescription("Posts a picture of a person - who never existed! (AI Person generation)")
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            )
            .addSubcommand(command =>
                command.setName("rac").setDescription("Play a game of Rows & Columns")
                    .addBooleanOption(option =>
                        option.setName("help").setDescription("View the rules instead of playing?")
                    )
                    .addIntegerOption(option =>
                        option.setName("size").setDescription("Set your amount of rows and start playing!")
                            .setMinValue(process.env.beta ? 1 : 3)
                            .setMaxValue(26)
                    )
            )
            .addSubcommand(command =>
                command.setName("name_me").setDescription("Generate a random set of letters in an attempt to make an original name")
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            )
            .addSubcommand(command =>
                command.setName("rock_paper_scissors").setDescription("Play Rock Paper Scissors with the bot")
                    .addStringOption(option =>
                        option.setName("choice").setDescription("Rock, Paper, Scissors, Shoot!")
                            .addChoices(
                                { "name": "Rock", "value": "Rock" },
                                { "name": "Paper", "value": "Paper" },
                                { "name": "Scissors", "value": "Scissors" }
                            )
                            .setRequired(true)
                    )
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            )
            .addSubcommand(command =>
                command.setName("minesweeper").setDescription("Play Minesweeper!")
                    .addBooleanOption(option =>
                        option.setName("use_ascii").setDescription("Use Ascii instead of Emojis? (Default: false)")
                            .setRequired(false)
                    )
                    .addBooleanOption(option =>
                        option.setName("start_me").setDescription("Reveal a section of the board to start? (Default: false)")
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName("width").setDescription("Width of the map? (Default: 10)")
                            .setMinValue(3)
                            .setMaxValue(10)
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName("height").setDescription("Height of the map? (Default: 10)")
                            .setMinValue(3)
                            .setMaxValue(10)
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName("mines").setDescription("How many mines are there on the board? (Default: 10)")
                            .setMinValue(1)
                            .setMaxValue(40)
                            .setRequired(false)
                    )
                    .addBooleanOption(option =>
                        option.setName("private").setDescription("Make the response ephemeral?")
                            .setRequired(false)
                    )
            ),

        // Optional fields

        extra: { "contexts": [0, 1, 2], "integration_types": [0, 1] },

        requiredGlobals: [],

        help: {
            "dne": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Posts a picture of a person who never existed using AI",
                detailedDesc:
					`Uses https://thispersondoesnotexist.com/ to display a picture of a completely fake human face.`
            },
            "rac": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Play a game of Rows & Columns",
                detailedDesc:
					`**Rows & Columns**\n
					\n
					In this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n
					\n
					To join the game, press the Join Game button.\n
					To make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type \`AC\`).\n
					\n
					This is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.`
            },
            "wyr": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Posts a Would-You-Rather question", //Should be the same as the command setDescription field
                detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts a would you rather question. Disclaimer: This command uses a third party API, and has no quality guarantee.`
            },
            "joke": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Posts a joke", //Should be the same as the command setDescription field
                detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts a joke. Disclaimer: This command uses a third party API, and has no quality guarantee.`
            },
            "meme": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Posts a meme", //Should be the same as the command setDescription field
                detailedDesc: //Detailed on exactly what the command does and how to use it
					`Posts one of the memes Stewbot's staff have approved for the bot to display. You can use the /submit_meme context menu command (holding down the message on mobile, right clicking on desktop, and then pressing Apps) to submit a meme for the Stewbot staff to review.`
            },
            "name_me": {
                helpCategories: [Categories.Entertainment],
                shortDesc: "Generate a random set of letters in an attempt to make an original name",
                detailedDesc: "Generate a random set of letters in an attempt to make an original name"
            }
            // helpSortPriority: 1
        }

    },

    /** @param {import('discord.js').ChatInputCommandInteraction} cmd */
    async execute(cmd, context) {
        applyContext(context);

        switch (cmd.options.getSubcommand()) {
            case "dne":
                fetch("https://thispersondoesnotexist.com").then(d => d.arrayBuffer())
                    .then(d => {
                        const tempDne = new AttachmentBuilder(Buffer.from(d), { name: "dne.png" });
                        cmd.followUp({
                            content: `Image courtesy of <https://thispersondoesnotexist.com>`,
                            files: [tempDne]
                        });
                    });
                break;
            case "wyr":
                fetch("https://would-you-rather.p.rapidapi.com/wyr/random", {
                    method: "GET",
                    headers: {
                        "X-RapidAPI-Key": process.env.wyrKey,
                        "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com"
                    }
                }).then(d => d.json())
                    .then(async d => {
                        if (d?.message?.startsWith?.("You have exceeded the ")) {
                            cmd.followUp("I'm sorry, I need to wait a little bit before I can run this command again.");
                            return;
                        }
                        let firstQues = d[0].question.split("Would you rather ")[1];
                        let firstQuest = firstQues[0].toUpperCase() + firstQues.slice(1, firstQues.length).split(" or ")[0];
                        let nextQues = firstQues.split(" or ")[1];
                        let nextQuest = nextQues[0].toUpperCase() + nextQues.slice(1, nextQues.length).split("?")[0];
                        cmd.followUp(`**Would you Rather**\n🅰️: ${firstQuest}\n🅱️: ${nextQuest}\n\n-# *\\*Disclaimer: All WYRs are provided by a third party API*`);
                        if (cmd.channel?.permissionsFor?.(client.user.id).has(PermissionFlagsBits.AddReactions)) {
                            let msg = await cmd.fetchReply();
                            msg.react("🅰️").then(() => msg.react("🅱️").catch(() => null))
                                .catch(() => null);
                        }
                    });
                break;
            case "name_me":
                cmd.followUp(`A possible name could be \`${randomName()}\`.`);
                break;
            case "joke":
                fetch("https://v2.jokeapi.dev/joke/Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&safe-mode").then(d => d.json())
                    .then(d => {
                        cmd.followUp(d.type === "single" ? `${d.joke}` : `${d.setup}\n\n||${d.delivery}||`);
                    });
                break;
            case "meme":
                var memes = await fs.promises.readdir("./memes");
                if (memes.length === 0) {
                    cmd.followUp("I'm sorry, but I don't appear to have any at the moment.");
                    break;
                }
                var meme;
                try {
                    // meme = cmd.options.getInteger("number") ? memes.filter(m=>m.split(".")[0] === cmd.options.getInteger("number").toString())[0] : memes[Math.floor(Math.random()*memes.length)];
                    meme = memes.filter(m => m.split(".")[0] === cmd.options.getInteger("number").toString())[0];
                    if (!meme) meme = memes[Math.floor(Math.random() * memes.length)];
                }
                catch { // Give a random meme if it fails because there is no number. OPTIMIZE: check if there were options passed rather than try-catching
                    meme = memes[Math.floor(Math.random() * memes.length)];
                }
                cmd.followUp({ content: `Meme #${meme.split(".")[0]}`, files: [`./memes/${meme}`] });
                break;
            case "rac":
                if (cmd.options.getBoolean("help")) {
                    cmd.followUp("**Rows & Columns**\n\nIn this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n\nTo join the game, press the Join Game button.\nTo make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type `AC`).\n\nThis is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed.");
                    break;
                }
                var size = cmd.options.getInteger("size") || 5;
                rac = {
                    board: [],
                    lastPlayer: "Nobody",
                    timePlayed: 0,
                    players: [],
                    icons: "!@$%^&()+=[]{};':~,./<>?0123456789"
                };
                for (var k = 0; k < size; k++) {
                    rac.board.push([]);
                    for (var j = 0; j < size; j++) {
                        rac.board[k].push("-");
                    }
                }
                rac.players = [cmd.user.id];
                await cmd.followUp({
                    content: getRACBoard(rac),
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("racJoin")
                                    .setLabel("Join Game")
                                    .setStyle(ButtonStyle.Danger),
                                new ButtonBuilder()
                                    .setCustomId("racMove")
                                    .setLabel("Make a Move")
                                    .setStyle(ButtonStyle.Success)
                            )
                            .toJSON()
                    ]
                });
                break;
            case "rock_paper_scissors":
                var humanChoice = cmd.options.getString("choice");
                var computerChoice = ["Rock", "Paper", "Scissors"][Math.floor(Math.random() * 3)];
                var won = 0;
                if (humanChoice === "Rock" && computerChoice === "Paper" || humanChoice === "Paper" && computerChoice === "Scissors" || humanChoice === "Scissors" && computerChoice === "Rock") {
                    won = 1;
                }
                else if (humanChoice !== computerChoice) {
                    won = 2;
                }
                let emojified = {
                    "Rock": ":rock:",
                    "Scissors": ":scissors:",
                    "Paper": ":newspaper2:"
                };
                const result =
                    `You played: ${humanChoice} ${emojified[humanChoice]}\n` +
					`I played: ${computerChoice} ${emojified[computerChoice]}\n` +
					`\n${won == 0 ? `We` : `You`} ${won == 0 ? `tied` : won == 1 ? `lost` : `won`}! ${won == 1 ? ":stew:" : ""}`;
                cmd.followUp(result);
                break;
            case "minesweeper":
                // Parse command options with defaults
                const boardWidth = cmd.options.getInteger("width") ?? 10;
                const boardHeight = cmd.options.getInteger("height") ?? 10;
                const mineCount = cmd.options.getInteger("mines") ?? 10;
                const useAscii = cmd.options.getBoolean("use_ascii") ?? false;
                const autoReveal = cmd.options.getBoolean("start_me") ?? false;

                // Choose emoji set based on ASCII preference
                const emojis = useAscii
                    ? ["`0`", "`1`", "`2`", "`3`", "`4`", "`5`", "`6`", "`7`", "`8`", "`*`"]
                    : ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "💣"];

                // Generate the game
                const { board, revealed } = generateMinesweeper(boardWidth, boardHeight, mineCount, autoReveal);

                // Format output message
                const boardText = formatMinesweeperBoard(board, revealed, emojis, boardWidth, boardHeight);
                const headerText = `New Markdown Minesweeper Game!\n` +
                                `There are ${mineCount} mines.\n` +
                                `Map size is ${boardWidth}x${boardHeight}.\n` +
                                `----------------------------------\n`;

                // Send response
                cmd.followUp(headerText + boardText);
                break;
        }
    },

    subscribedButtons: ["racMove", "racJoin", "moveModal"],

    // TODO: All onbutton's need to be updated to this jsdoc
    /** @param {import('discord.js').ButtonInteraction | import('discord.js').AnySelectMenuInteraction | import('discord.js').ModalSubmitInteraction } cmd */
    async onbutton(cmd, context) {
        applyContext(context);
        if (!("customId" in cmd)) return;

        switch (cmd.customId) {
            case "racMove":
                if (!("showModal" in cmd)) return;

                let moveModal = new ModalBuilder().setCustomId("moveModal")
                    .setTitle("Rows & Columns Move");
                let moveModalInput = new TextInputBuilder().setCustomId("moveMade")
                    .setLabel("Where would you like to move? (Example: AC)")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2)
                    .setRequired(true);
                let row = new ActionRowBuilder().addComponents(moveModalInput);
                // @ts-ignore
                moveModal.addComponents(row);
                await cmd.showModal(moveModal);
                break;

            case "racJoin": {
                readRACBoard(cmd.message.content);
                var bad = false;
                for (var i = 0; i < rac.players.length; i++) {
                    if (rac.players[i] === cmd.user.id) {
                        cmd.reply({
                            content: "You can't join more than once!",
                            ephemeral: true
                        });
                        bad = true;
                    }
                }
                if (bad) break;
                rac.players.push(cmd.user.id);
                if (rac.players.length > rac.icons.length) {
                    cmd.reply({ content: "I'm sorry, but this game has hit the limit of players. I don't have any more symbols to use.", ephemeral: true });
                    return;
                }
                if (getRACBoard().length > 1999) {
                    rac.players.splice(rac.players.length - 1, 1);
                    cmd.reply({ content: "Sadly the board can't handle any more players. This is a Discord character limit, and you can add more players by using less rows.", ephemeral: true });
                    let row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("racJoin")
                        .setLabel("Join Game")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true), new ButtonBuilder().setCustomId("racMove")
                        .setLabel("Make a Move")
                        .setStyle(ButtonStyle.Success));
                    // @ts-ignore
                    cmd.message.edit({ content: getRACBoard(), components: [row] });
                    return;
                }
                if ("update" in cmd) cmd.update(getRACBoard());
                break;
            }

            // Modal
            case "moveModal": {
                if (!("fields" in cmd)) return;
                let cont = cmd.fields.getTextInputValue("moveMade").toUpperCase();
                readRACBoard(cmd.message.content);
                let foundOne = -1;
                for (let i = 0; i < rac.players.length; i++) {
                    if (rac.players[i] === cmd.user.id) {
                        foundOne = i;
                    }
                }
                if (foundOne === -1) {
                    cmd.reply({ content: "I didn't find you in the player list, use the `Join Game` button first.", ephemeral: true });
                    break;
                }
                if (!rac.rowsActive.includes(cont[0]) || !rac.rowsActive.includes(cont[1])) {
                    cmd.reply({ content: "That location isn't on the board", ephemeral: true });
                    break;
                }
                if ((Date.now() - +rac.timePlayed) < 900000 && cmd.user.id === rac.lastPlayer) {
                    cmd.reply({ content: `I'm sorry, you can make another move after somebody else does OR <t:${Math.round((rac.timePlayed + 900000) / 1000)}:R>`, ephemeral: true });
                    break;
                }
                if (rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])] !== "-") {
                    cmd.reply({ content: "That location is occupied.", ephemeral: true });
                    break;
                }
                rac.lastPlayer = cmd.user.id;
                rac.timePlayed = Date.now();
                rac.board[rac.rowsActive.indexOf(cont[0])][rac.rowsActive.indexOf(cont[1])] = rac.icons[foundOne];

                // @ts-ignore
                await cmd.update(getRACBoard());

                let foundZero = false;
                for (let i = 0; i < rac.board.length; i++) {
                    for (var j = 0; j < rac.board[i].length; j++) {
                        if (rac.board[i][j] === "-") {
                            foundZero = true;
                        }
                    }
                }
                if (!foundZero) {
                    let row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("racJoin")
                            .setLabel("Join Game")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId("racMove")
                            .setLabel("Make a Move")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                    );
                    // @ts-ignore
                    cmd.message.edit({ content: tallyRac(), components: [row] });
                }
                break;
            }

        }
    }
};
