import type { ServiceContext } from '../types';
import type * as _ from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, token?: _.CancellationToken) => Promise<_.FoldingRange[] | undefined>;
//# sourceMappingURL=foldingRanges.d.ts.map