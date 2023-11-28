import { LanguageServerPlugin, InitializationOptions } from '../../types';
import * as vscode from 'vscode-languageserver';
import { Config } from '@volar/language-service';
export declare function setupCapabilities(server: vscode.ServerCapabilities, initOptions: InitializationOptions, plugins: ReturnType<LanguageServerPlugin>[], semanticTokensLegend: vscode.SemanticTokensLegend, services: NonNullable<Config['services']>): void;
//# sourceMappingURL=registerFeatures.d.ts.map