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
export declare function execute(cmd: any, context: any): Promise<void>;
export declare function daily(context: any): Promise<void>;
export declare let subscribedButtons: RegExp[];
export declare function onbutton(cmd: any, context: any): Promise<void>;
