export function resetAIRequests(): void;
export function convertCommandsToTools(commandsLoaded: any): {
    name: string;
    description: any;
    parameters: {
        type: string;
        properties: {};
        required: never[];
    };
}[];
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
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export declare function execute(cmd: import("discord.js").ChatInputCommandInteraction, globalsContext: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export declare function onmessage(msg: import("discord.js").Message, globals: any, guildStore: any, guildUserStore: any): Promise<void>;
