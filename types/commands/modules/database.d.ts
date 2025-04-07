export const Guilds: mongoose.Model<{
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}> & {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>>} */
export function guildByObj(obj: any, updates?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>>;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function userByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
        } | null | undefined;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>} */
export function userByObj(obj: any, updates?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>;
export const GuildUsers: mongoose.Model<{
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}> & {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildUserByID(guildID: any, userID: any, updateData: {} | undefined, upsert: any): Promise<mongoose.Document<unknown, {}, {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}> & {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>} */
export function guildUserByObj(guild: any, userID: any, updateData?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>;
export const ConfigDB: mongoose.Model<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
    pfp?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
    pfp?: string | null | undefined;
}> & {
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
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
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
    pfp?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
    pfp?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    rss: Map<string, {
        channels: string[];
        lastSent: NativeDate;
        fails: number;
        hash?: string | null | undefined;
        url?: string | null | undefined;
    }>;
    wotd: string;
    pfp?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
import mongoose = require("mongoose");
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
    stickyRoles?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        active: boolean;
        channel: string;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    tempSlow: Map<string, {
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        private?: boolean | null | undefined;
        origMode?: number | null | undefined;
        guild?: string | null | undefined;
    }>;
    polls: Map<string, {
        options: Map<string, string[]>;
        title?: string | null | undefined;
    }>;
    persistence: Map<string, {
        active: boolean;
        content: string;
        lastPost: string;
    }>;
    alm: {
        message: string;
        active: boolean;
        channel: string;
    };
    ajm: {
        message: string;
        active: boolean;
        channel: string;
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
        msg: string;
        active: boolean;
        channel: string;
        location: string;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        memes: {
            active: boolean;
            channel: string;
        };
        devos: {
            active: boolean;
            channel: string;
        };
        verses: {
            active: boolean;
            channel: string;
        };
    };
    counting: {
        active: boolean;
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
        nextNum: number;
        highestNum: number;
    };
    logs: {
        active: boolean;
        channel_events: boolean;
        emoji_events: boolean;
        user_change_events: boolean;
        joining_and_leaving: boolean;
        invite_events: boolean;
        role_events: boolean;
        mod_actions: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
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
    };
    primedEmojiURL: string;
    primedName: string;
    timedOutIn: string[];
    dmOffenses: boolean;
    hat_pull?: {
        limit: number;
        winCount: number;
        entered: string[];
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
        user?: string | null | undefined;
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
            channelName: string;
            channelId: string;
        } | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let guildUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    tempRoles: Map<string, number>;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    lvl: number;
    exp: number;
    warnings: mongoose.Types.DocumentArray<{
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }> & {
        moderator?: string | null | undefined;
        reason?: string | null | undefined;
        severity?: number | null | undefined;
        when?: number | null | undefined;
    }>;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
