import type { ServiceContext } from '../types';
import type * as _ from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (oldUri: string, newUri: string, token?: _.CancellationToken) => Promise<_.WorkspaceEdit | undefined>;
//# sourceMappingURL=fileRename.d.ts.map