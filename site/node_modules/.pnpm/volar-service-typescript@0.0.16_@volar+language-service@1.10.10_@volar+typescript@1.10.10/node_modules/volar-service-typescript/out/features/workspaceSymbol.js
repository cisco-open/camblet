"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const PConst = require("../protocol.const");
const modifiers_1 = require("../utils/modifiers");
const shared_1 = require("../shared");
function getSymbolKind(item) {
    switch (item.kind) {
        case PConst.Kind.method: return 6;
        case PConst.Kind.enum: return 10;
        case PConst.Kind.enumMember: return 22;
        case PConst.Kind.function: return 12;
        case PConst.Kind.class: return 5;
        case PConst.Kind.interface: return 11;
        case PConst.Kind.type: return 5;
        case PConst.Kind.memberVariable: return 8;
        case PConst.Kind.memberGetAccessor: return 8;
        case PConst.Kind.memberSetAccessor: return 8;
        case PConst.Kind.variable: return 13;
        default: return 13;
    }
}
function register(ctx) {
    return (query) => {
        const items = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getNavigateToItems(query));
        if (!items)
            return [];
        return items
            .filter(item => item.containerName || item.kind !== 'alias')
            .map(toWorkspaceSymbol)
            .filter((v) => !!v);
        function toWorkspaceSymbol(item) {
            const label = getLabel(item);
            const uri = ctx.env.fileNameToUri(item.fileName);
            const document = ctx.getTextDocument(uri);
            if (document) {
                const range = {
                    start: document.positionAt(item.textSpan.start),
                    end: document.positionAt(item.textSpan.start + item.textSpan.length),
                };
                const info = {
                    name: label,
                    kind: getSymbolKind(item),
                    location: { uri, range },
                };
                const kindModifiers = item.kindModifiers ? (0, modifiers_1.parseKindModifier)(item.kindModifiers) : undefined;
                if (kindModifiers?.has(PConst.KindModifiers.deprecated)) {
                    info.tags = [1];
                }
                return info;
            }
        }
        function getLabel(item) {
            const label = item.name;
            if (item.kind === 'method' || item.kind === 'function') {
                return label + '()';
            }
            return label;
        }
    };
}
exports.register = register;
//# sourceMappingURL=workspaceSymbol.js.map