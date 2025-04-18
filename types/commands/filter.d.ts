export namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
        let cat: number;
    }
    let requiredGlobals: never[];
    let priority: number;
    namespace help {
        export namespace config {
            let helpCategories: string[];
            let shortDesc: string;
            let detailedDesc: string;
        }
        export namespace add {
            let helpCategories_1: string[];
            export { helpCategories_1 as helpCategories };
            let shortDesc_1: string;
            export { shortDesc_1 as shortDesc };
            let detailedDesc_1: string;
            export { detailedDesc_1 as detailedDesc };
        }
        export namespace remove {
            let helpCategories_2: string[];
            export { helpCategories_2 as helpCategories };
            let shortDesc_2: string;
            export { shortDesc_2 as shortDesc };
            let detailedDesc_2: string;
            export { detailedDesc_2 as detailedDesc };
        }
        export namespace _import {
            let helpCategories_3: string[];
            export { helpCategories_3 as helpCategories };
            let shortDesc_3: string;
            export { shortDesc_3 as shortDesc };
            let detailedDesc_3: string;
            export { detailedDesc_3 as detailedDesc };
        }
        export { _import as import };
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export function onmessage(msg: import("discord.js").Message, context: any, guildStore: any, guildUserStore: any): Promise<void>;
export function onedit(msgO: any, msg: any, readGuild: any, readGuildUser: any): Promise<void>;
