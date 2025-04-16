export function finTempSlow(guildId: any, channel: any, force: any): Promise<void>;
export function scheduleTodaysSlowmode(): Promise<void>;
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
export declare function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
export declare let subscribedButtons: string[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export declare function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<void>;
