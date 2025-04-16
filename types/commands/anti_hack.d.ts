export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
/**
 * @param {import('discord.js').Message} msg
 * @param {DB.GuildDoc} guildStore
 * */
export function onmessage(msg: import("discord.js").Message, context: any, guildStore: DB.GuildDoc, guildUserStore: any): Promise<void>;
export let subscribedButtons: RegExp[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
