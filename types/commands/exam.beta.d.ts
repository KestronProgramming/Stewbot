export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: never[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<any>;
/** @param {import('discord.js').Message} msg */
export function onmessage(msg: import("discord.js").Message, context: any): Promise<void>;
export function autocomplete(cmd: any): Promise<void>;
export function daily(context: any): Promise<void>;
export let subscribedButtons: (string | RegExp)[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<void>;
