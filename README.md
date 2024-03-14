# Stewbot
This is the open source page for Stewbot, an advanced Discord bot with the intention of helping keep your server running smoothly while also providing entertainment.
Stewbot is completely open source and free.

## Links
- [App Directory](https://discord.com/application-directory/966167746243076136)
- [Website](https://stewbot.kestron.software)
- [Support Server](https://discord.gg/k3yVkrrvez)

## Running Locally
To run this code with your own tokens, make sure you have node installed, and then you need to make a file called "env.json" in the same directory, and add the following fields:
```json
{
    "token":"DISCORD BOT TOKEN",
    "ownerId":"YOUR USER ID",
    "clientId":"THE BOT'S ID",
    "noticeChannel":"A CHANNEL ID TO POST NOTIFICATIONS TO",
    "inworldKey": "Inworld AI Key",
    "inworldSecret": "Inworld AI Secret",
    "inworldScene":"Inworld AI Character link",
    "logWebhook":"A webhook for errors to be posted to"
}
```
Make sure to `npm install` @discordjs/builders, @inworld/nodejs-sdk, @vitalets/google-translate-api, canvas, discord.js, and fs.
You will also need to run `node launchCommands.js` before you start the bot, which will automatically fill commands.json.
Then simply use either run.bat or run.sh depending on your system, or just node index.js.

## Current Working Features
All of the following work completely for free
 - Swear Filter, with censoring as opposed to just deletion
 - Definitions
 - Polls
 - AI Ping Response
 - AI Person Generation
 - AI Image Generation via Dall-E Mini
 - Would you Rathers
 - Notifications of important bot events
 - Auto roles (commonly known as Reaction Roles)
 - Memes
 - Starboard
 - Counting Game
 - Message embed previews for linked messages
 - Moving messages from one channel to another
 - Jokes
 - Auto join greetings
 - Translations
 - Moderator ticket system
 - Rows and Columns game
 - Sticky Roles
 - Logging
 - Moderator actions with better logging
 - Personal and Server configs for general options
 - Admin messaging
 - EXP Level up system
 - Random number generator
 - Coin flips
 - Magic 8-Ball Responses
 - KJV Bible Lookup
 - Roles applied upon joining the server

## I found a command, but there's nothing in the code for it
There is currently a treasure hunt within the bot going on! This is being run via a second smaller script. It will not be made available so as to preserve the hunt aspect. Once the hunt is over, this treasure hunt file will be provided. All bot functions still adhere to the [Privacy Policy](https://stewbot.kestron.software/privacy). You should join the hunt and see what you can uncover.

