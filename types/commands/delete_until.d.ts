import { ContextMenuCommandBuilder } from "@discordjs/builders";
export namespace data {
    let command: ContextMenuCommandBuilder;
    namespace extra {
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
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<import("discord.js").Message<boolean> | undefined>;
export let subscribedButtons: RegExp[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
