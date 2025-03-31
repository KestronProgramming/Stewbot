export const Guilds: mongoose.Model<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export function guildByID(id: any): Promise<mongoose.Document<unknown, {}, {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
}> & {
    id: string;
    emojiboards: mongoose.Types.DocumentArray<{
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }> & {
        emoji?: string | null | undefined;
        threshold?: number | null | undefined;
        channel?: string | null | undefined;
        active?: boolean | null | undefined;
        messType?: string | null | undefined;
        posted?: any;
        posters?: any;
    }>;
    groupmute?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
import mongoose = require("mongoose");
export declare let Users: undefined;
