export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export function execute(cmd: any, context: any): Promise<void>;
export function onmessage(msg: any, context: any): Promise<void>;
export let subscribedButtons: RegExp[];
export function onbutton(cmd: any, context: any): Promise<any>;
