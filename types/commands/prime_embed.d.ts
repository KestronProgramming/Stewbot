export function getPrimedEmbed(userId: any, guildIn: any): Promise<EmbedBuilder | {
    type: string;
    title: string;
    description: string;
    color: number;
}>;
import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";
export declare namespace data {
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
export declare function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
