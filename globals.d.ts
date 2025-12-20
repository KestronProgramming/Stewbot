// This prevents intellisence from complaining about globals.
// You could just set each to "Any", but I prefer to have more specific typings.

// Inject our custom globals
declare global {
    // Make discord types globally accessible
    type Message = import("discord.js").Message;
    type Guild = import("discord.js").Guild;
    type InteractionReplyOptions = import("discord.js").InteractionReplyOptions;

    var commands: import("./command-module").CommandModule[];
    var client: import('discord.js').Client<true>;
    var bootedAt: number;
    var cmds: typeof import("./data/commands.json");
    var oldCmds: typeof import("./data/commands.json") | undefined;
    var config: typeof import('./data/config.js');

    // Tell it my env.json fields are valid
    namespace NodeJS {
        interface ProcessEnv extends Partial<typeof import("./env.json")> {
            beta: string | boolean | undefined;

            // Any other string is valid
            [key: string]: string | undefined;
        }
      }
    
}

// Globals can be accessed at root level without specifying global. first.

/** Map of command name to loaded command module */
declare const commands: any;

declare const client: import('discord.js').Client<true>;
declare const bootedAt: number;
declare const cmds: typeof import("./data/commands.json");
declare const config: typeof import('./data/config.js');


export {}