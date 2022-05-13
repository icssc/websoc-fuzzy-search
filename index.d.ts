declare type Metadata = Record<string, string | string[]>;
declare type ResultType = 'GE_CATEGORY' | 'DEPARTMENT' | 'COURSE' | 'INSTRUCTOR';
declare interface FilterOptions {
    readonly courseLevel?: number[];
    readonly department?: string[];
    readonly geList?: string[];
    readonly school?: string[];
}
declare interface SearchParams {
    readonly query?: string;
    readonly numResults?: number;
    readonly resultType?: ResultType;
    readonly filterOptions?: FilterOptions;
}
declare interface SearchResult {
    readonly type: ResultType;
    readonly name: string;
    readonly metadata: Metadata;
}
declare function search(params?: SearchParams): Record<string, SearchResult>;

export default search;
