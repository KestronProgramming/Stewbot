export const Guilds: mongoose.Model<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any): Promise<mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/** @returns {Promise<import("mongoose").InferSchemaType<typeof guildSchema>>} */
export function guildByObj(obj: any): Promise<import("mongoose").InferSchemaType<typeof guildSchema>>;
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
/** @returns {Promise<import("mongoose").InferSchemaType<typeof userSchema>>} */
export function userByObj(obj: any): Promise<import("mongoose").InferSchemaType<typeof userSchema>>;
export let guildConfigSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    antihack_log_channel?: string | null | undefined;
    antihack_to_log?: boolean | null | undefined;
    antihack_auto_delete?: boolean | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    antihack_log_channel?: string | null | undefined;
    antihack_to_log?: boolean | null | undefined;
    antihack_auto_delete?: boolean | null | undefined;
}>> & mongoose.FlatRecord<{
    antihack_log_channel?: string | null | undefined;
    antihack_to_log?: boolean | null | undefined;
    antihack_auto_delete?: boolean | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
import mongoose = require("mongoose");
declare let guildSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }> & {
        messType?: string | null | undefined;
        threshold?: number | null | undefined;
        active?: boolean | null | undefined;
        channel?: string | null | undefined;
        posted?: any;
        posters?: any;
        emoji?: string | null | undefined;
    }>;
    config?: {
        antihack_log_channel?: string | null | undefined;
        antihack_to_log?: boolean | null | undefined;
        antihack_auto_delete?: boolean | null | undefined;
    } | null | undefined;
    disableAntiHack?: boolean | null | undefined;
    user?: Map<string, {
        safeTimestamp?: number | null | undefined;
    }> | null | undefined;
    groupmute?: string | null | undefined;
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
export {};
