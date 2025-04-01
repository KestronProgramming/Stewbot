export function processForNumber(text: any): number | null;
export declare namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    namespace help {
        namespace config {
            let helpCategories: string[];
            let shortDesc: string;
            let detailedDesc: string;
        }
        namespace set_number {
            let helpCategories_1: string[];
            export { helpCategories_1 as helpCategories };
            let shortDesc_1: string;
            export { shortDesc_1 as shortDesc };
            let detailedDesc_1: string;
            export { detailedDesc_1 as detailedDesc };
        }
    }
}
/** @param {import('discord.js').Interaction} cmd */
export declare function execute(cmd: import("discord.js").Interaction, context: any): Promise<any>;
/** @param {import('discord.js').Message} msg */
export declare function onmessage(msg: import("discord.js").Message, context: any): Promise<void>;
