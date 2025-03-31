import { SlashCommandBuilder } from "@discordjs/builders";
export namespace data {
    let command: SlashCommandBuilder;
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
export function execute(cmd: any, context: any): Promise<void>;
export let subscribedButtons: RegExp[];
export function onbutton(cmd: any, context: any): Promise<void>;
