export const Guilds: mongoose.Model<{
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}> & {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}> & {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    captcha: BooleanConstructor;
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
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}> & {
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
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
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    useGlobalGemini: boolean;
    dailyMeme: number;
}> & {
    useGlobalGemini: boolean;
    dailyMeme: number;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    useGlobalGemini: boolean;
    dailyMeme: number;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
}>> & mongoose.FlatRecord<{
    useGlobalGemini: boolean;
    dailyMeme: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
import mongoose = require("mongoose");
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: Map<string, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    tempBans: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }>;
    alm: {
        active: boolean;
        channel: string;
        message: string;
    };
    ajm: {
        active: boolean;
        channel: string;
        message: string;
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
    };
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    captcha: BooleanConstructor;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let guildUserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
    countTurns: number;
    beenCountWarned: boolean;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
