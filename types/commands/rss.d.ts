export namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    namespace help {
        namespace follow {
            let helpCategories: string[];
            let shortDesc: string;
            let detailedDesc: string;
        }
        namespace unfollow {
            let helpCategories_1: string[];
            export { helpCategories_1 as helpCategories };
            let shortDesc_1: string;
            export { shortDesc_1 as shortDesc };
            let detailedDesc_1: string;
            export { detailedDesc_1 as detailedDesc };
        }
        namespace check {
            let helpCategories_2: string[];
            export { helpCategories_2 as helpCategories };
            let shortDesc_2: string;
            export { shortDesc_2 as shortDesc };
            let detailedDesc_2: string;
            export { detailedDesc_2 as detailedDesc };
        }
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
export function daily(context: any): Promise<void>;
