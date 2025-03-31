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
export declare function onmessage(msg: any, globals: any): Promise<void>;
