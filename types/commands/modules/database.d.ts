export type GuildDoc = import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>;
export type UserDoc = import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>;
export type GuildUserDoc = import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>;
export const Guilds: mongoose.Model<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<GuildDoc>} */
export function guildByObj(obj: any, updates?: {}): Promise<GuildDoc>;
export const Users: mongoose.Model<{
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function userByID(id: any, updates?: {}, upsert?: boolean): Promise<(mongoose.Document<unknown, {}, {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}) | null>;
/** @returns {Promise<UserDoc>} */
export function userByObj(obj: any, updates?: {}, upsert?: boolean): Promise<UserDoc>;
export const GuildUsers: mongoose.Model<{
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}> & {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildUserByID(guildID: any, userID: any, updateData: {} | undefined, upsert: any): Promise<mongoose.Document<unknown, {}, {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}> & {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<GuildUserDoc>} */
export function guildUserByObj(guild: any, userID: any, updateData?: {}): Promise<GuildUserDoc>;
export const ConfigDB: mongoose.Model<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
}> & {
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        url?: string | null | undefined;
        hash?: string | null | undefined;
    }>;
    wotd: string;
    bootedAt: number;
    restartedAt: number;
    pfp?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        posted: Map<string, string>;
        posters: Map<string, number>;
        channel?: string | null | undefined;
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        guild?: string | null | undefined;
        private?: boolean | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        origMode?: number | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        content: string;
        active: boolean;
        lastPost: string;
    }>;
    alm: {
        channel: string;
        message: string;
        active: boolean;
    };
    ajm: {
        channel: string;
        message: string;
        active: boolean;
        dm: boolean;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
        embedPreviews: boolean;
        levelUpMsgs: boolean;
    };
    levels: {
        location: string;
        channel: string;
        msg: string;
        active: boolean;
    };
    daily: {
        memes: {
            channel: string;
            active: boolean;
        };
        devos: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    counting: {
        public: boolean;
        channel: string;
        reset: boolean;
        active: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        channel: string;
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    sentWelcome: boolean;
    autoJoinRoles: string[];
    blockedCommands: string[];
    pinners?: string | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let userSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    config: {
        embedPreviews: boolean;
        levelUpMsgs: boolean;
        beenAIDisclaimered: boolean;
        aiPings: boolean;
        dmOffenses: boolean;
        returnFiltered: boolean;
        hasSetTZ: boolean;
        timeOffset: number;
        attachmentProtection: boolean;
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        scheduled: boolean;
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    } | null | undefined;
    timer?: {
        time?: number | null | undefined;
        respLocation?: string | null | undefined;
        reminder?: string | null | undefined;
    } | null | undefined;
    captcha?: boolean | null | undefined;
    primedEmbed?: {
        id: string;
        content: string;
        timestamp: number;
        attachmentURLs: string[];
        author?: {
            id: string;
            name: string;
            icon: string;
        } | null | undefined;
        server?: {
            id: string;
            name: string;
            icon: string;
            channelId: string;
            channelName: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let guildUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    roles: string[];
    guildId: string;
    userId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        reason?: string | null | undefined;
        moderator?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    inServer: boolean;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
import mongoose = require("mongoose");
export {};
