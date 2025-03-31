export function updateBlocklists(): void;
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
/** @param {import('discord.js').Interaction} cmd */
export declare function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
export declare function onmessage(msg: any, context: any): Promise<any>;
export declare function daily(context: any): Promise<void>;
