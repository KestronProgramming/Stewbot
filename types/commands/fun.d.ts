export namespace data {
    let command: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    namespace help {
        namespace dne {
            let helpCategories: string[];
            let shortDesc: string;
            let detailedDesc: string;
        }
        namespace rac {
            let helpCategories_1: string[];
            export { helpCategories_1 as helpCategories };
            let shortDesc_1: string;
            export { shortDesc_1 as shortDesc };
            let detailedDesc_1: string;
            export { detailedDesc_1 as detailedDesc };
        }
        namespace wyr {
            let helpCategories_2: string[];
            export { helpCategories_2 as helpCategories };
            let shortDesc_2: string;
            export { shortDesc_2 as shortDesc };
            let detailedDesc_2: string;
            export { detailedDesc_2 as detailedDesc };
        }
        namespace joke {
            let helpCategories_3: string[];
            export { helpCategories_3 as helpCategories };
            let shortDesc_3: string;
            export { shortDesc_3 as shortDesc };
            let detailedDesc_3: string;
            export { detailedDesc_3 as detailedDesc };
        }
        namespace meme {
            let helpCategories_4: string[];
            export { helpCategories_4 as helpCategories };
            let shortDesc_4: string;
            export { shortDesc_4 as shortDesc };
            let detailedDesc_4: string;
            export { detailedDesc_4 as detailedDesc };
        }
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
export let subscribedButtons: string[];
export function onbutton(cmd: any, context: any): Promise<void>;
