## Conversion
#### Notes about things when converting the database

Consider - port both of these locations:
if (storage[msg.guild.id].levels.hasOwnProperty("channelOrDM")) {
    storage[msg.guild.id].levels.location = storage[msg.guild.id].levels.channelOrDM;

if ajm.message (or alm) is "", make it the default and disable ajms


make transfer script mark all guilds as sentWelcome



# TODO:

CheckDirty needs aggressive caching... which needs to be invalidated when modified

On message handler should pass a read-only guild

# Changed things to test:
Test /restart

