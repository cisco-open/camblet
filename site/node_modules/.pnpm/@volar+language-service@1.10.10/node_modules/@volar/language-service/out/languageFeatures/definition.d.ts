import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
import { FileRangeCapabilities, MirrorBehaviorCapabilities } from '@volar/language-core';
export declare function register(context: ServiceContext, apiName: 'provideDefinition' | 'provideTypeDefinition' | 'provideImplementation', isValidMapping: (data: FileRangeCapabilities) => boolean, isValidMirrorPosition: (mirrorData: MirrorBehaviorCapabilities) => boolean): (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
//# sourceMappingURL=definition.d.ts.map