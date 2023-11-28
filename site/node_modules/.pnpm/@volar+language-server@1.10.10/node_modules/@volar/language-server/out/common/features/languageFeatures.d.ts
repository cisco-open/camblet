import * as vscode from 'vscode-languageserver';
import type { Workspaces } from '../workspaces';
import { RuntimeEnvironment, InitializationOptions } from '../../types';
import { createDocuments } from '../documents';
export declare function register(connection: vscode.Connection, workspaces: Workspaces, initParams: vscode.InitializeParams, initOptions: InitializationOptions, semanticTokensLegend: vscode.SemanticTokensLegend, runtime: RuntimeEnvironment, documents: ReturnType<typeof createDocuments>): void;
export declare function sleep(ms: number): Promise<unknown>;
//# sourceMappingURL=languageFeatures.d.ts.map