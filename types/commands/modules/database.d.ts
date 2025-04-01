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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
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
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}> & {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function userByID(id: any): Promise<mongoose.Document<unknown, {}, {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}> & {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>} */
export function userByObj(obj: any): Promise<import("mongoose").HydratedDocument<import("mongoose").InferSchemaType<typeof userSchema>>>;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
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
    ajm: {
        active: boolean;
        channel: string;
        dm: boolean;
        message: string;
    };
    config: {
        antihack_log_channel: string;
        antihack_to_log: boolean;
        antihack_auto_delete: boolean;
    };
    autoJoinRoles: string[];
    groupmute?: string | null | undefined;
    disableAntiHack?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare let userSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    timedOutIn: string[];
    captcha?: boolean | null | undefined;
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
