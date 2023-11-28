"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormatCodeSettings = void 0;
const shared_1 = require("../shared");
async function getFormatCodeSettings(ctx, document, options) {
    let config = await ctx.env.getConfiguration?.((0, shared_1.getConfigTitle)(document) + '.format');
    config = config ?? {};
    return {
        convertTabsToSpaces: options?.insertSpaces,
        tabSize: options?.tabSize,
        indentSize: options?.tabSize,
        indentStyle: 2 /** ts.IndentStyle.Smart */,
        newLineCharacter: '\n',
        insertSpaceAfterCommaDelimiter: config.insertSpaceAfterCommaDelimiter ?? true,
        insertSpaceAfterConstructor: config.insertSpaceAfterConstructor ?? false,
        insertSpaceAfterSemicolonInForStatements: config.insertSpaceAfterSemicolonInForStatements ?? true,
        insertSpaceBeforeAndAfterBinaryOperators: config.insertSpaceBeforeAndAfterBinaryOperators ?? true,
        insertSpaceAfterKeywordsInControlFlowStatements: config.insertSpaceAfterKeywordsInControlFlowStatements ?? true,
        insertSpaceAfterFunctionKeywordForAnonymousFunctions: config.insertSpaceAfterFunctionKeywordForAnonymousFunctions ?? true,
        insertSpaceBeforeFunctionParenthesis: config.insertSpaceBeforeFunctionParenthesis ?? false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: config.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis ?? false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: config.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets ?? false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: config.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces ?? true,
        insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: config.insertSpaceAfterOpeningAndBeforeClosingEmptyBraces ?? true,
        insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: config.insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces ?? false,
        insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: config.insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces ?? false,
        insertSpaceAfterTypeAssertion: config.insertSpaceAfterTypeAssertion ?? false,
        placeOpenBraceOnNewLineForFunctions: config.placeOpenBraceOnNewLineForFunctions ?? false,
        placeOpenBraceOnNewLineForControlBlocks: config.placeOpenBraceOnNewLineForControlBlocks ?? false,
        semicolons: config.semicolons ?? 'ignore',
    };
}
exports.getFormatCodeSettings = getFormatCodeSettings;
//# sourceMappingURL=getFormatCodeSettings.js.map