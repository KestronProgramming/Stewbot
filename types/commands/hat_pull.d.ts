export function finHatPull(who: any, force: any): Promise<void>;
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
/** @param {import('discord.js').Interaction} cmd */
export declare function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
export declare function daily(context: any): Promise<void>;
export declare let subscribedButtons: RegExp[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export declare function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<void>;
