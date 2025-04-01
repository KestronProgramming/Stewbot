export namespace data {
    let command: import("discord.js").SlashCommandOptionsOnlyBuilder;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
/** @param {import('discord.js').Interaction} cmd */
export function execute(cmd: import("discord.js").Interaction, context: any): Promise<void>;
/** @param {import('discord.js').Message} msg */
export function onmessage(msg: import("discord.js").Message, context: any): Promise<void>;
export let subscribedButtons: RegExp[];
/** @param {import('discord.js').ButtonInteraction} cmd */
export function onbutton(cmd: import("discord.js").ButtonInteraction, context: any): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
