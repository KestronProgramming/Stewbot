import { ContextMenuCommandBuilder } from "@discordjs/builders";
export namespace data {
    let command: ContextMenuCommandBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
        let desc: string;
    }
    let requiredGlobals: never[];
    let deferEphemeral: boolean;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
export let subscribedButtons: string[];
export function onbutton(cmd: any, context: any): Promise<void>;
