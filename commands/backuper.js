// #region CommandBoilerplate
const Categories = require("./modules/Categories");
const { Events }=require("discord.js");

// #endregion CommandBoilerplate

const { notify } = require("../utils")
const ms = require("ms");
const { startBackupThreadPromise } = require("../backup.js");

module.exports = {
	data: {
		command: null,

		help: {
			helpCategories: [ Categories.Module ],
			shortDesc: "Periodically backup the bot's database.",
			detailedDesc:
				`To avoid data loss on server issues, stewbot periodically backs up his database to a private cloud folder.`,
		},
	},

    async [Events.ClientReady] () {
        // Once backup.js fully imports, start the backup thread
        startBackupThreadPromise.then(startBackupThread => {
            startBackupThread(ms("1h"), error => {
                notify(String(error));
            })
        })
    }
}
