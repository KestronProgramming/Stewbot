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
export function execute(cmd: any, context: any): Promise<void>;
