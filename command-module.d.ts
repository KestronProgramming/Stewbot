// Define types used in command modules to help autotype them.

import type {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ClientEvents,
    InteractionResponse,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    SlashCommandBuilder,
} from "discord.js";

type PseudoGlobals = {
    config: typeof import("./data/config.json");
    [key: string]: unknown;
};

type ReadGuild = import("./commands/modules/database").RawGuildDoc;
type ReadGuildUser = import("./commands/modules/database").RawGuildUserDoc;
type ReadHomeGuild = import("./commands/modules/database").RawGuildDoc;
type ButtonOrComponentInteraction = ButtonInteraction | ModalSubmitInteraction | AnySelectMenuInteraction;

// These events have their types auto injected by our index.js framework.
// We use string literal keys because that's what ClientEvents uses internally.
type InjectedEvents = 'messageCreate' | 'messageUpdate' | 'messageDelete' | 'messageReactionAdd' | 'guildMemberAdd' | 'guildMemberRemove';

type AugmentedClientEvents = {
    messageCreate: [...ClientEvents['messageCreate'], PseudoGlobals, ReadGuild, ReadGuildUser, ReadHomeGuild];
    messageUpdate: [...ClientEvents['messageUpdate'], ReadGuild, ReadGuildUser, ReadHomeGuild];
    messageDelete: [...ClientEvents['messageDelete'], ReadGuild, ReadGuildUser];
    messageReactionAdd: [...ClientEvents['messageReactionAdd'], ReadGuild, ReadGuildUser];
    guildMemberAdd: [...ClientEvents['guildMemberAdd'], ReadGuild];
    guildMemberRemove: [...ClientEvents['guildMemberRemove'], ReadGuild];
} & {
    [K in Exclude<keyof ClientEvents, InjectedEvents>]: ClientEvents[K];
};

// Type our command modules, automatically expanding discord's builtin ClientEvents.
type CommandModule = {
    [K in keyof AugmentedClientEvents]?: (...args: AugmentedClientEvents[K]) => unknown;
} & {
    data?: {
        command?: SlashCommandBuilder | { name: string; description: string; default_member_permissions?: string };
        requiredGlobals?: string[];
        deferEphemeral?: boolean | Record<string, unknown>;
        priority?: number;
        [key: string]: unknown;
    };
    priority?: number;
    subscribedButtons?: (string | RegExp)[];

    // Our custom functions
    requestGlobals?: () => string[];
    autocomplete?: (cmd: AutocompleteInteraction, globals: PseudoGlobals) => unknown;
    execute?: (
        cmd: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
        globals: PseudoGlobals,
        deferred?: InteractionResponse
    ) => unknown;
    onbutton?: (cmd: ButtonOrComponentInteraction, globals: PseudoGlobals) => unknown;
    daily?: (globals: PseudoGlobals) => unknown;
    eventInterceptors?: Partial<Record<keyof ClientEvents, (handler: unknown, ...args: ClientEvents[keyof ClientEvents]) => boolean>>;

    // Allow additional custom exports
    [key: string]: unknown;
};

export type { CommandModule, PseudoGlobals, AugmentedClientEvents };