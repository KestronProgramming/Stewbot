/**
 * Gets an emoji and returns either a discord emoji, or hexadecimal string.
 * This prevents us from storing arbitrary unicode characters in the database.
 *
 * @param {string} emoji The emoji from the user message.
 * @returns {string} The emoji in the correct format.
 */
function getEmojiFromMessage(emoji){
  emoji = emoji.trim();

  // if emoji is a discord custom emoji, return the emoji
  if(emoji.match(/<a?:\w+:\d+>/)){
      return emoji;
  }

  // if emoji is a unicode emoji, return the emoji encoded as a list of 6 digit hex values
  return emoji.split('').map(char => char.codePointAt(0).toString(16).padStart(6, '0')).join('');
}

/**
* Parse an emoji from either a hexadecimal string or a discord emoji.
*
* @param {string} emoji 
* @returns {string} The unicode emoji or discord emoji
*/
function parseEmoji(emoji){
  if(emoji.match(/<a?:\w+:\d+>/)){
    return emoji;
  }

  if(emoji.length % 6 !== 0) {
    return emoji
  }

  try {
    // split into groups of 6 characters and convert to unicode
    return String.fromCodePoint(...emoji.match(/.{6}/g).map(hex => parseInt(hex, 16)));
  } catch (error) {
    return emoji;
  }
}

module.exports = {
  getEmojiFromMessage,
  parseEmoji
}