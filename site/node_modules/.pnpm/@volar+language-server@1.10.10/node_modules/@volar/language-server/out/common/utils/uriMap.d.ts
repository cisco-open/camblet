export * as _ from 'vscode-uri';
interface Options<T> {
    delete(key: string): boolean;
    get(key: string): T | undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    clear(): void;
    values(): IterableIterator<T>;
    keys(): IterableIterator<string>;
}
export declare function createUriMap<T>(fileNameToUri: (fileName: string) => string, map?: Options<T>): {
    clear: () => void;
    values: () => IterableIterator<T>;
    uriKeys: () => IterableIterator<string>;
    uriDelete: (_uri: string) => boolean;
    uriGet: (_uri: string) => T | undefined;
    uriHas: (_uri: string) => boolean;
    uriSet: (_uri: string, item: T) => void;
    pathDelete: (path: string) => boolean;
    pathGet: (path: string) => T | undefined;
    pathHas: (path: string) => T | undefined;
    pathSet: (path: string, item: T) => void;
};
//# sourceMappingURL=uriMap.d.ts.map