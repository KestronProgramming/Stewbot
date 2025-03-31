export namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
        let cat: number;
    }
    let requiredGlobals: never[];
    namespace help {
        let helpCategory: string;
        let helpDesc: string;
        let helpSortPriority: number;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<any>;
export function autocomplete(cmd: any): Promise<void>;
