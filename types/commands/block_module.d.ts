export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: string[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
        let block_module_message: string;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<any>;
export function autocomplete(cmd: any): Promise<void>;
