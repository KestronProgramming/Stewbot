export function updateBlocklists(): void;
import { MessageReaction } from "discord.js";
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
/** @param {import('discord.js').Interaction} cmd */
export declare function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export declare function onmessage(msg: import("discord.js").Message, context: any): Promise<MessageReaction | import("discord.js").OmitPartialGroupDMChannel<import("discord.js").Message<boolean>> | undefined>;
export declare function daily(context: any): Promise<void>;
