export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export function execute(cmd: any, context: any): Promise<void>;
export function onmessage(msg: any, context: any): Promise<void>;
export function replacements(inp: any, options?: {}, disabled?: any[]): any;
