"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return (uri, range, legend) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const file = ctx.env.uriToFileName(uri);
        const start = range ? document.offsetAt(range.start) : 0;
        const length = range ? (document.offsetAt(range.end) - start) : document.getText().length;
        if (ctx.typescript?.languageServiceHost.getCancellationToken?.().isCancellationRequested())
            return;
        const response2 = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getEncodedSyntacticClassifications(file, { start, length }));
        if (!response2)
            return;
        if (ctx.typescript?.languageServiceHost.getCancellationToken?.().isCancellationRequested())
            return;
        const response1 = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getEncodedSemanticClassifications(file, { start, length }, ts.SemanticClassificationFormat.TwentyTwenty));
        if (!response1)
            return;
        let tokenModifiersTable = [];
        tokenModifiersTable[2 /* TokenModifier.async */] = 1 << legend.tokenModifiers.indexOf('async');
        tokenModifiersTable[0 /* TokenModifier.declaration */] = 1 << legend.tokenModifiers.indexOf('declaration');
        tokenModifiersTable[3 /* TokenModifier.readonly */] = 1 << legend.tokenModifiers.indexOf('readonly');
        tokenModifiersTable[1 /* TokenModifier.static */] = 1 << legend.tokenModifiers.indexOf('static');
        tokenModifiersTable[5 /* TokenModifier.local */] = 1 << legend.tokenModifiers.indexOf('local'); // missing in server tokenModifiers
        tokenModifiersTable[4 /* TokenModifier.defaultLibrary */] = 1 << legend.tokenModifiers.indexOf('defaultLibrary');
        tokenModifiersTable = tokenModifiersTable.map(mod => Math.max(mod, 0));
        const tokenSpan = [...response1.spans, ...response2.spans];
        const tokens = [];
        let i = 0;
        while (i < tokenSpan.length) {
            const offset = tokenSpan[i++];
            const length = tokenSpan[i++];
            const tsClassification = tokenSpan[i++];
            let tokenModifiers = 0;
            let tokenType = getTokenTypeFromClassification(tsClassification);
            if (tokenType !== undefined) {
                // it's a classification as returned by the typescript-vscode-sh-plugin
                tokenModifiers = getTokenModifierFromClassification(tsClassification);
            }
            else {
                // typescript-vscode-sh-plugin is not present
                tokenType = tokenTypeMap[tsClassification];
                if (tokenType === undefined) {
                    continue;
                }
            }
            const serverToken = tsTokenTypeToServerTokenType(tokenType);
            if (serverToken === undefined) {
                continue;
            }
            const serverTokenModifiers = tsTokenModifierToServerTokenModifier(tokenModifiers);
            // we can use the document's range conversion methods because the result is at the same version as the document
            const startPos = document.positionAt(offset);
            const endPos = document.positionAt(offset + length);
            for (let line = startPos.line; line <= endPos.line; line++) {
                const startCharacter = (line === startPos.line ? startPos.character : 0);
                const endCharacter = (line === endPos.line ? endPos.character : docLineLength(document, line));
                tokens.push([line, startCharacter, endCharacter - startCharacter, serverToken, serverTokenModifiers]);
            }
        }
        return tokens;
        function tsTokenTypeToServerTokenType(tokenType) {
            return legend.tokenTypes.indexOf(tokenTypes[tokenType]);
        }
        function tsTokenModifierToServerTokenModifier(input) {
            let m = 0;
            let i = 0;
            while (input) {
                if (input & 1) {
                    m |= tokenModifiersTable[i];
                }
                input = input >> 1;
                i++;
            }
            return m;
        }
    };
}
exports.register = register;
function docLineLength(document, line) {
    const currentLineOffset = document.offsetAt({ line, character: 0 });
    const nextLineOffset = document.offsetAt({ line: line + 1, character: 0 });
    return nextLineOffset - currentLineOffset;
}
function getTokenTypeFromClassification(tsClassification) {
    if (tsClassification > 255 /* TokenEncodingConsts.modifierMask */) {
        return (tsClassification >> 8 /* TokenEncodingConsts.typeOffset */) - 1;
    }
    return undefined;
}
function getTokenModifierFromClassification(tsClassification) {
    return tsClassification & 255 /* TokenEncodingConsts.modifierMask */;
}
const tokenTypes = [];
tokenTypes[0 /* TokenType.class */] = 'class';
tokenTypes[1 /* TokenType.enum */] = 'enum';
tokenTypes[2 /* TokenType.interface */] = 'interface';
tokenTypes[3 /* TokenType.namespace */] = 'namespace';
tokenTypes[4 /* TokenType.typeParameter */] = 'typeParameter';
tokenTypes[5 /* TokenType.type */] = 'type';
tokenTypes[6 /* TokenType.parameter */] = 'parameter';
tokenTypes[7 /* TokenType.variable */] = 'variable';
tokenTypes[8 /* TokenType.enumMember */] = 'enumMember';
tokenTypes[9 /* TokenType.property */] = 'property';
tokenTypes[10 /* TokenType.function */] = 'function';
tokenTypes[11 /* TokenType.method */] = 'method';
const tokenModifiers = [];
tokenModifiers[2 /* TokenModifier.async */] = 'async';
tokenModifiers[0 /* TokenModifier.declaration */] = 'declaration';
tokenModifiers[3 /* TokenModifier.readonly */] = 'readonly';
tokenModifiers[1 /* TokenModifier.static */] = 'static';
tokenModifiers[5 /* TokenModifier.local */] = 'local'; // missing in server tokenModifiers
tokenModifiers[4 /* TokenModifier.defaultLibrary */] = 'defaultLibrary';
// mapping for the original ExperimentalProtocol.ClassificationType from TypeScript (only used when plugin is not available)
const tokenTypeMap = [];
tokenTypeMap[11 /* ExperimentalProtocol.ClassificationType.className */] = 0 /* TokenType.class */;
tokenTypeMap[12 /* ExperimentalProtocol.ClassificationType.enumName */] = 1 /* TokenType.enum */;
tokenTypeMap[13 /* ExperimentalProtocol.ClassificationType.interfaceName */] = 2 /* TokenType.interface */;
tokenTypeMap[14 /* ExperimentalProtocol.ClassificationType.moduleName */] = 3 /* TokenType.namespace */;
tokenTypeMap[15 /* ExperimentalProtocol.ClassificationType.typeParameterName */] = 4 /* TokenType.typeParameter */;
tokenTypeMap[16 /* ExperimentalProtocol.ClassificationType.typeAliasName */] = 5 /* TokenType.type */;
tokenTypeMap[17 /* ExperimentalProtocol.ClassificationType.parameterName */] = 6 /* TokenType.parameter */;
//# sourceMappingURL=semanticTokens.js.map