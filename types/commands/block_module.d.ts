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
export function execute(cmd: any, context: any): Promise<any>;
export function autocomplete(cmd: any): Promise<void>;
