export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export function onmessage(msg: import("discord.js").Message, context: any): Promise<void>;
export function replacements(inp: any, options?: {}, disabled?: any[]): any;
