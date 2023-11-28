import { ServiceEnvironment } from '@volar/language-service';
import type * as ts from 'typescript/lib/tsserverlibrary';
export declare function getInferredCompilerOptions(ctx: Pick<ServiceEnvironment, 'getConfiguration' | 'onDidChangeConfiguration'> | undefined): Promise<ts.CompilerOptions>;
//# sourceMappingURL=inferredCompilerOptions.d.ts.map