export namespace data {
    let command: null;
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export function onmessage(msg: any, context: any): Promise<void>;
