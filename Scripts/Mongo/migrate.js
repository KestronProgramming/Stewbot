const mongoose = require("mongoose");

async function migrate() {
    await import('../database.mjs');

    const guilds = await Guild.find({}); // Fetch all guilds

    for (const guild of guilds) {
        if (guild.persistence instanceof Map) {
            console.log(`Migrating guild: ${guild._id}`);

            // Convert Map to a plain JavaScript object
            const newPersistence = {};
            for (const [key, value] of guild.persistence.entries()) {
                newPersistence[key] = value;
            }

            // Update the document
            guild.persistence = newPersistence;
            await guild.save();
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

// Run the migration
migrate().catch(console.error);
