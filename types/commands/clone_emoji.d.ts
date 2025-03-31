export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let deferEphemeral: boolean;
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<any>;
