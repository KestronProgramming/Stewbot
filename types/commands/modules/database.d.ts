export const Guilds: mongoose.Model<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any, updates?: {}): Promise<mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
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
    config: any;
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
    config: any;
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
    config: any;
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
    config: any;
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
    config: any;
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
    config: any;
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
    config: any;
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
    config: any;
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
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: string;
    guildId: string;
    safeTimestamp: number;
}> & {
    userId: string;
    guildId: string;
    safeTimestamp: number;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: string;
    guildId: string;
    safeTimestamp: number;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>} */
export function guildUserByObj(guild: any, userID: any, updateData?: {}): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof guildUserSchema>>>;
export const ConfigDB: mongoose.Model<{
    useGlobalGemini: boolean;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    useGlobalGemini: boolean;
}> & {
    useGlobalGemini: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    useGlobalGemini: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    useGlobalGemini: boolean;
}>> & mongoose.FlatRecord<{
    useGlobalGemini: boolean;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
import mongoose = require("mongoose");
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }> & {
        type?: {
            messType?: string | null | undefined;
            threshold?: number | null | undefined;
            active?: boolean | null | undefined;
            channel?: string | null | undefined;
            posted?: any;
            posters?: any;
            emoji?: string | null | undefined;
        } | null | undefined;
        required?: unknown;
    }>;
    autoJoinRoles: string[];
    blockedCommands: string[];
    counting?: {
        channel: string;
        public: boolean;
        takeTurns: number;
        failRoleActive: boolean;
        warnRoleActive: boolean;
        failRole: string;
        warnRole: string;
        legit: boolean;
        reset: boolean;
    } | null | undefined;
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    tempBans?: Map<string, {
        private: boolean;
        invoker?: string | null | undefined;
        ends?: number | null | undefined;
        reason?: string | null | undefined;
    }> | null | undefined;
    alm?: {
        active: boolean;
        channel: string;
        message: string;
    } | null | undefined;
    ajm?: {
        active: boolean;
        channel: string;
        message: string;
        dm: boolean;
    } | null | undefined;
    config?: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
        domain_scanning: boolean;
        fake_link_check: boolean;
        ai: boolean;
    } | null | undefined;
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
    config: any;
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
    config: any;
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
    config: any;
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
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
}>> & mongoose.FlatRecord<{
    userId: string;
    guildId: string;
    safeTimestamp: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
