declare type ResultType = 'GE_CATEGORY' | 'DEPARTMENT' | 'COURSE' | 'INSTRUCTOR';
declare type Metadata = Record<string, string | string[]>;
declare interface SearchResult {
    readonly type: ResultType,
    readonly name: string,
    readonly metadata: Metadata,
}
declare function search(query: string, numResults?: number, mask?: ResultType[]): Record<string, SearchResult>;

export default search;
