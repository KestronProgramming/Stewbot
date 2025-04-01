export namespace data {
    let command: null;
    namespace help {
        let helpCategories: any[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').Message} msg */
export function onmessage(msg: import("discord.js").Message, context: any): Promise<void>;
export function daily(context: any): Promise<void>;
