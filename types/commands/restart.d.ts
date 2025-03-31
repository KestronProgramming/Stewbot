export function killMaintenanceBot(): void;
export declare namespace data {
    let command: null;
    let requiredGlobals: never[];
    namespace help {
        let helpCategories: string[];
        let shortDesc: string;
        let detailedDesc: string;
    }
}
export declare function execute(cmd: any, context: any): Promise<void>;
