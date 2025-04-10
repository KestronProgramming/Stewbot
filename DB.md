## Conversion
#### Notes about things when converting the database

Consider - port both of these locations:
if (storage[msg.guild.id].levels.hasOwnProperty("channelOrDM")) {
    storage[msg.guild.id].levels.location = storage[msg.guild.id].levels.channelOrDM;

if ajm.message (or alm) is "", make it the default and disable ajms


make transfer script mark all guilds as sentWelcome


TODO:
Once prime embed is ported, test embedding it with embed_message




# TODO:

Figure out what files to zip and backup
Check for db tools, warn about not backing up if not, link to https://www.mongodb.com/docs/database-tools/installation/#std-label-dbtools_installation
https://www.mongodb.com/try/download/shell
"MongoDB Command Line Database Tools Download"

CheckDirty needs aggressive caching... which needs to be invalidated when modified

On message handler should pass a read-only guild

Ctrl+F for TODO_DB

Regex for:
userBy.+\(.+\.guild

Warn when guild object or guild user is provided to on obj functions, maybe warn in beta when ID seems like a guild ID or not?

Make sure all onmessage listeners use cmd.author instead of cmd.user

Ctrl+F for default stuff

# Changed things to test:
Test /restart

