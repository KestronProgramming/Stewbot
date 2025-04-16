export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: string[];
    let deferEphemeral: boolean;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
