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
export function execute(cmd: any, context: any): Promise<any>;
