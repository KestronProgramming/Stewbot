/**
 * Gets the unicode from an emoji
 *
 * @param {string} emoji The emoji from the user message.
 * @returns {string|false} The unicode of the emoji or false if the emoji is invalid.
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
* Parse an emoji into either a unicode emoji or a discord emoji
*
* @param {string} emoji 
* @returns {string} The unicode emoji or discord emoji
*/
function parseEmoji(emoji){
	if(emoji.match(/<a?:\w+:\d+>/)){
			return emoji;
	}

	// split into 6 digit hex values
	try {
			const hexValues = emoji.match(/.{6}/g);
			return String.fromCodePoint(...hexValues.map(hex => parseInt(hex, 16)));
	} catch (error) {
			return emoji;
	}
}

module.exports = {
	getEmojiFromMessage,
	parseEmoji
}