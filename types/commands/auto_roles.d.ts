export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: never[];
    let deferEphemeral: boolean;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
export let subscribedButtons: (string | RegExp)[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<void>;
