export namespace data {
    let command: null;
    namespace help {
        let helpCategories: any[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export function onmessage(msg: any, context: any): Promise<void>;
export function daily(context: any): Promise<void>;
