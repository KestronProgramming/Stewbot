export function isModuleBlocked(listener: any, guild: any, globalGuild: any, isAdmin: any): (string | boolean)[];
export declare namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: string[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
        let block_module_message: string;
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export declare function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<import("discord.js").Message<boolean> | undefined>;
export declare function autocomplete(cmd: any): Promise<void>;
