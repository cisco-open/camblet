"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return (uri, position, context) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const options = {};
        if (context?.triggerKind === 1) {
            options.triggerReason = {
                kind: 'invoked'
            };
        }
        else if (context?.triggerKind === 2) {
            options.triggerReason = {
                kind: 'characterTyped',
                triggerCharacter: context.triggerCharacter,
            };
        }
        else if (context?.triggerKind === 3) {
            options.triggerReason = {
                kind: 'retrigger',
                triggerCharacter: context.triggerCharacter,
            };
        }
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const helpItems = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getSignatureHelpItems(fileName, offset, options));
        if (!helpItems)
            return;
        return {
            activeSignature: helpItems.selectedItemIndex,
            activeParameter: helpItems.argumentIndex,
            signatures: helpItems.items.map(item => {
                const signature = {
                    label: '',
                    documentation: undefined,
                    parameters: []
                };
                signature.label += ts.displayPartsToString(item.prefixDisplayParts);
                item.parameters.forEach((p, i, a) => {
                    const label = ts.displayPartsToString(p.displayParts);
                    const parameter = {
                        label,
                        documentation: ts.displayPartsToString(p.documentation)
                    };
                    signature.label += label;
                    signature.parameters.push(parameter);
                    if (i < a.length - 1) {
                        signature.label += ts.displayPartsToString(item.separatorDisplayParts);
                    }
                });
                signature.label += ts.displayPartsToString(item.suffixDisplayParts);
                return signature;
            }),
        };
    };
}
exports.register = register;
//# sourceMappingURL=signatureHelp.js.map