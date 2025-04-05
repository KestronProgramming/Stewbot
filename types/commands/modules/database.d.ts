export const Guilds: mongoose.Model<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}> & {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
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
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
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
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}> & {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>>} */
export function guildByObj(obj: any, updates?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildSchema>>>;
export const Users: mongoose.Model<{
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}> & {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}>> & mongoose.FlatRecord<{
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function userByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}> & {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>} */
export function userByObj(obj: any, updates?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>;
export const GuildUsers: mongoose.Model<{
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}> & {
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>} */
export function guildUserByObj(guild: any, userID: any, updateData?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>;
export const ConfigDB: mongoose.Model<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
}> & {
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
    pfp?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
import mongoose = require("mongoose");
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    filter: {
        channel: string;
        active: boolean;
        censor: boolean;
        log: boolean;
        blacklist: string[];
    };
    id: string;
    counting: {
        channel: string;
        active: boolean;
        reset: boolean;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        nextNum: number;
        highestNum: number;
    };
    levels: {
        active: boolean;
    };
    config: {
        domain_scanning: boolean;
        fake_link_check: boolean;
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        ai: boolean;
        embedPreviews: boolean;
    };
    emojiboards: Map<string, {
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        threshold?: number | null | undefined;
        messType?: string | null | undefined;
        posted?: Map<string, number> | null | undefined;
        posters?: Map<string, string> | null | undefined;
    }>;
    tempBans: Map<string, {
        private: boolean;
        reason?: string | null | undefined;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
    }>;
    alm: {
        channel: string;
        active: boolean;
        message: string;
    };
    ajm: {
        channel: string;
        active: boolean;
        message: string;
        dm: boolean;
    };
    autoJoinRoles: string[];
    blockedCommands: string[];
    daily: {
        devos: {
            channel: string;
            active: boolean;
        };
        memes: {
            channel: string;
            active: boolean;
        };
        verses: {
            channel: string;
            active: boolean;
        };
    };
    logs: {
        active: boolean;
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    testProp?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let userSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}>> & mongoose.FlatRecord<{
    id: {
        type: StringConstructor;
        required: true;
        unique: true;
        index: true;
        trim: true;
        match: [RegExp, string];
    };
    primedEmojiURL: {
        type: StringConstructor;
        defaut: "";
    };
    primedName: {
        type: StringConstructor;
        defaut: "";
    };
    timedOutIn: [StringConstructor];
    primedEmbed: any;
    config: {
        type: any;
        default: {};
    };
    dmOffenses: {
        type: BooleanConstructor;
        default: boolean;
    };
    hat_pull: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }>> & mongoose.FlatRecord<{
        limit: number;
        winCount: number;
        entered: string[];
        user?: string | null | undefined;
        location?: string | null | undefined;
        closes?: number | null | undefined;
        registered?: boolean | null | undefined;
    }> & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    captcha: BooleanConstructor;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let guildUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}>> & mongoose.FlatRecord<{
    guildId: string;
    userId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
    infractions?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
