"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInferredCompilerOptions = void 0;
async function getInferredCompilerOptions(ctx) {
    let [implicitProjectConfig_1, implicitProjectConfig_2] = await Promise.all([
        ctx?.getConfiguration?.('js/ts.implicitProjectConfig'),
        ctx?.getConfiguration?.('javascript.implicitProjectConfig'),
    ]);
    implicitProjectConfig_1 = implicitProjectConfig_1 ?? {};
    implicitProjectConfig_2 = implicitProjectConfig_2 ?? {};
    const checkJs = readCheckJs();
    const experimentalDecorators = readExperimentalDecorators();
    const strictNullChecks = readImplicitStrictNullChecks();
    const strictFunctionTypes = readImplicitStrictFunctionTypes();
    const options = {
        ...inferredProjectCompilerOptions('typescript'),
        allowJs: true,
        allowSyntheticDefaultImports: true,
        allowNonTsExtensions: true,
        resolveJsonModule: true,
        jsx: 1 /* ts.JsxEmit.Preserve */,
    };
    return options;
    function readCheckJs() {
        return implicitProjectConfig_1['checkJs']
            ?? implicitProjectConfig_2['checkJs']
            ?? false;
    }
    function readExperimentalDecorators() {
        return implicitProjectConfig_1['experimentalDecorators']
            ?? implicitProjectConfig_2['experimentalDecorators']
            ?? false;
    }
    function readImplicitStrictNullChecks() {
        return implicitProjectConfig_1['strictNullChecks'] ?? false;
    }
    function readImplicitStrictFunctionTypes() {
        return implicitProjectConfig_1['strictFunctionTypes'] ?? true;
    }
    function inferredProjectCompilerOptions(projectType) {
        const projectConfig = {
            module: 1 /* ts.ModuleKind.CommonJS */,
            target: 7 /* ts.ScriptTarget.ES2020 */,
            jsx: 1 /* ts.JsxEmit.Preserve */,
        };
        if (checkJs) {
            projectConfig.checkJs = true;
            if (projectType === 'typescript') {
                projectConfig.allowJs = true;
            }
        }
        if (experimentalDecorators) {
            projectConfig.experimentalDecorators = true;
        }
        if (strictNullChecks) {
            projectConfig.strictNullChecks = true;
        }
        if (strictFunctionTypes) {
            projectConfig.strictFunctionTypes = true;
        }
        if (projectType === 'typescript') {
            projectConfig.sourceMap = true;
        }
        return projectConfig;
    }
}
exports.getInferredCompilerOptions = getInferredCompilerOptions;
//# sourceMappingURL=inferredCompilerOptions.js.map