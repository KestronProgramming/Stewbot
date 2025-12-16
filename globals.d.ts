// This prevents intellisence from complaining about globals.
// You could just set each to "Any", but I prefer to have more specific typings.

/** Map of command name to loaded command module */
declare const commands: any;

declare const client: import('discord.js').Client<true>;
declare const bootedAt: number;
declare const cmds: typeof import("./data/commands.json");
declare const config: typeof import('./data/config.js');

declare global {
    var commands: any;
    var client: import('discord.js').Client<true>;
    var bootedAt: number;
    var cmds: typeof import("./data/commands.json");
    var oldCmds: typeof import("./data/commands.json") | undefined;
    var config: typeof import('./data/config.js');
}

export {}