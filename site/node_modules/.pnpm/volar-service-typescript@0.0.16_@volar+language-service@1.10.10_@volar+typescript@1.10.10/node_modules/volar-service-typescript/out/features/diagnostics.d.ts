import type * as vscode from '@volar/language-service';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): (uri: string, options: {
    semantic?: boolean;
    syntactic?: boolean;
    suggestion?: boolean;
    declaration?: boolean;
}) => vscode.Diagnostic[];
export declare function getEmitDeclarations(compilerOptions: ts.CompilerOptions): boolean;
//# sourceMappingURL=diagnostics.d.ts.map