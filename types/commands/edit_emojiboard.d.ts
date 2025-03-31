export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: string[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export function execute(cmd: any, context: any): Promise<void>;
