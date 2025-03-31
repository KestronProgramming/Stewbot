import { SlashCommandBuilder } from "@discordjs/builders";
export namespace data {
    let command: SlashCommandBuilder;
    namespace extra {
        let contexts: number[];
        let integration_types: number[];
    }
    let requiredGlobals: string[];
}
export function execute(cmd: any, context: any): Promise<void>;
