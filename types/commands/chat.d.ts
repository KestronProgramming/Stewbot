export function resetAIRequests(): void;
export declare namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export declare function execute(cmd: any, globalsContext: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export declare function onmessage(msg: import("discord.js").Message, globals: any): Promise<void>;
