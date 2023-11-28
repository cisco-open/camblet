"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const PConst = require("../protocol.const");
const modifiers_1 = require("../utils/modifiers");
const shared_1 = require("../shared");
const getSymbolKind = (kind) => {
    switch (kind) {
        case PConst.Kind.module: return 2;
        case PConst.Kind.class: return 5;
        case PConst.Kind.enum: return 10;
        case PConst.Kind.interface: return 11;
        case PConst.Kind.method: return 6;
        case PConst.Kind.memberVariable: return 7;
        case PConst.Kind.memberGetAccessor: return 7;
        case PConst.Kind.memberSetAccessor: return 7;
        case PConst.Kind.variable: return 13;
        case PConst.Kind.const: return 13;
        case PConst.Kind.localVariable: return 13;
        case PConst.Kind.function: return 12;
        case PConst.Kind.localFunction: return 12;
        case PConst.Kind.constructSignature: return 9;
        case PConst.Kind.constructorImplementation: return 9;
    }
    return 13;
};
function register(ctx) {
    return (uri) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(document.uri);
        const barItems = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getNavigationTree(fileName));
        if (!barItems)
            return [];
        // The root represents the file. Ignore this when showing in the UI
        const result = barItems.childItems
            ?.map(function convertNavTree(item) {
            if (!shouldIncludeEntry(item)) {
                return [];
            }
            let remain = item.childItems ?? [];
            return item.spans.map(span => {
                const childItems = [];
                remain = remain.filter(child => {
                    const childStart = child.spans[0].start;
                    const childEnd = child.spans[child.spans.length - 1].start + child.spans[child.spans.length - 1].length;
                    if (childStart >= span.start && childEnd <= span.start + span.length) {
                        childItems.push(child);
                        return false;
                    }
                    return true;
                });
                const nameSpan = item.spans.length === 1
                    ? (item.nameSpan ?? span)
                    : span;
                const fullRange = {
                    start: Math.min(span.start, nameSpan.start),
                    end: Math.max(span.start + span.length, nameSpan.start + nameSpan.length),
                };
                const symbol = {
                    name: item.text,
                    kind: getSymbolKind(item.kind),
                    range: {
                        start: document.positionAt(fullRange.start),
                        end: document.positionAt(fullRange.end),
                    },
                    selectionRange: {
                        start: document.positionAt(nameSpan.start),
                        end: document.positionAt(nameSpan.start + nameSpan.length),
                    },
                    children: childItems.map(convertNavTree).flat(),
                };
                const kindModifiers = (0, modifiers_1.parseKindModifier)(item.kindModifiers);
                if (kindModifiers.has(PConst.KindModifiers.deprecated)) {
                    symbol.deprecated = true;
                    symbol.tags ??= [];
                    symbol.tags.push(1);
                }
                return symbol;
            });
        })
            .flat();
        return result ?? [];
        function shouldIncludeEntry(item) {
            if (item.kind === PConst.Kind.alias) {
                return false;
            }
            return !!(item.text && item.text !== '<function>' && item.text !== '<class>');
        }
    };
}
exports.register = register;
//# sourceMappingURL=documentSymbol.js.map