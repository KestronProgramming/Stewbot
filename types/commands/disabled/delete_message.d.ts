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
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
