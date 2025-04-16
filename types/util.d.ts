/**
 * Gets an emoji and returns either a discord emoji, or hexadecimal string.
 * This prevents us from storing arbitrary unicode characters in the database.
 *
 * @param {string} emoji The emoji from the user message.
 * @returns {string} The emoji in the correct format.
 */
export function getEmojiFromMessage(emoji: string): string;
/**
* Parse an emoji from either a hexadecimal string or a discord emoji.
*
* @param {string} emoji
* @returns {string} The unicode emoji or discord emoji
*/
export function parseEmoji(emoji: string): string;
