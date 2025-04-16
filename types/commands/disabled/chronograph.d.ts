import { SlashCommandBuilder } from "@discordjs/builders";
export namespace data {
    let command: SlashCommandBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: string[];
}
/** @param {import('discord.js').ChatInputCommandInteraction} cmd */
export function execute(cmd: import("discord.js").ChatInputCommandInteraction, context: any): Promise<void>;
