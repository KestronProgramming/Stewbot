const { getEmojiFromMessage } = require('./util')

const migrations = [
	{
		name: 'Migrate starboard to emojiboards',
		run: (guild) => {
			const emoji = getEmojiFromMessage(guild.starboard.emoji)

			guild.emojiboards = {
				...guild.emojiboards,
				[emoji]: guild.starboard
			}

			delete guild.emojiboards[emoji].emoji

			return guild
		},
		test: (storage) => {
			return ! storage.version
		},
		version: '1.1'
	}
]

const runMigration = () => {
	const storage = require('./storage.json')

	const EXCLUDED_KEYS = ['rss', 'version']

	migrations.forEach(migration => {
		if (!migration.test(storage)) return
	
		console.log(`Running migration: ${migration.name}`)
		
		for(const guildID in storage){
			if(EXCLUDED_KEYS.includes(guildID)) continue
			if(!storage[guildID].users) continue // skip if not a server

			storage[guildID] = migration.run(JSON.parse(JSON.stringify(storage[guildID])))
			console.log(`Migrated guild: ${guildID}`)
		}

		storage.version = migration.version
	})
	
	// update the storage.json file with the new data
	const fs = require('fs');
	const path = require('path');
	const filePath = path.join(__dirname, 'storage.json');
	fs.writeFileSync(filePath, JSON.stringify(storage));
}

runMigration()
