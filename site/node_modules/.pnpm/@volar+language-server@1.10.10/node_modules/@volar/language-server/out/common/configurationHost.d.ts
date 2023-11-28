import { ServiceEnvironment } from '@volar/language-service';
import * as vscode from 'vscode-languageserver';
export declare function createConfigurationHost(params: vscode.InitializeParams, connection: vscode.Connection): Pick<ServiceEnvironment, 'getConfiguration' | 'onDidChangeConfiguration'> & {
    ready(): void;
};
//# sourceMappingURL=configurationHost.d.ts.map