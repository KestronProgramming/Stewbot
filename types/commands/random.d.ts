export namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    let help: {
        rng: {
            helpCategories: string[];
            shortDesc: string;
            detailedDesc: string;
        };
        "coin-flip": {
            helpCategories: string[];
            shortDesc: string;
            detailedDesc: string;
        };
        "8-ball": {
            helpCategories: string[];
            shortDesc: string;
            detailedDesc: string;
        };
        "dice-roll": {
            helpCategories: string[];
            shortDesc: string;
            detailedDesc: string;
        };
    };
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
