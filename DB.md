## Conversion
#### Notes about things when converting the database

Emojiboards is no an array of json - TODO: actually go back and make this one a map

Port guilds

Port guild users

Port users

Port root level storage (config)


Consider - port both of these locations:
if (storage[msg.guild.id].levels.hasOwnProperty("channelOrDM")) {
    storage[msg.guild.id].levels.location = storage[msg.guild.id].levels.channelOrDM;



TODO:
Once general_config is ported, test turning off embeds, chat, etc
Once prime embed is ported, test embedding it with embed_message




# TODO:
CheckDirty needs aggressive caching... which needs to be invalidated when modified


# TODO:
On message handler should pass a read-only guild

Ctrl+F for "TODO_DB

Double check all checkDirty calls with [1] after them, make sure await has parenths

Regex for:
userBy.+\(.+\.guild

Warn when guild object or guild user is provided to on obj functions, maybe warn in beta when ID seems like a guild ID or not?

Make sure all onmessage listeners use cmd.author instead of cmd.user

Ctrl+F for default stuff

