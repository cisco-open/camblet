"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDocumentLinkTarget = exports.register = void 0;
const cancellation_1 = require("../utils/cancellation");
const vscode_uri_1 = require("vscode-uri");
function register(context) {
    return async (item, token = cancellation_1.NoneCancellationToken) => {
        const data = item.data;
        if (data) {
            const service = context.services[data.serviceId];
            if (!service.resolveDocumentLink)
                return item;
            Object.assign(item, data.original);
            item = await service.resolveDocumentLink(item, token);
            if (item.target) {
                item.target = transformDocumentLinkTarget(item.target, context);
            }
        }
        return item;
    };
}
exports.register = register;
function transformDocumentLinkTarget(target, context) {
    const targetUri = vscode_uri_1.URI.parse(target);
    const clearUri = targetUri.with({ fragment: '' }).toString();
    if (context.documents.isVirtualFileUri(clearUri)) {
        for (const [virtualFile, map] of context.documents.getMapsByVirtualFileUri(clearUri)) {
            if (!virtualFile.capabilities.documentSymbol) {
                continue;
            }
            target = map.sourceFileDocument.uri;
            const hash = targetUri.fragment;
            const range = hash.match(/^L(\d+)(,(\d+))?(-L(\d+)(,(\d+))?)?$/);
            if (range) {
                const startLine = Number(range[1]) - 1;
                const startCharacter = Number(range[3] ?? 1) - 1;
                if (range[5] !== undefined) {
                    const endLine = Number(range[5]) - 1;
                    const endCharacter = Number(range[7] ?? 1) - 1;
                    const sourceRange = map.toSourceRange({
                        start: { line: startLine, character: startCharacter },
                        end: { line: endLine, character: endCharacter },
                    });
                    if (sourceRange) {
                        target += '#L' + (sourceRange.start.line + 1) + ',' + (sourceRange.start.character + 1);
                        target += '-L' + (sourceRange.end.line + 1) + ',' + (sourceRange.end.character + 1);
                        break;
                    }
                }
                else {
                    const sourcePos = map.toSourcePosition({ line: startLine, character: startCharacter });
                    if (sourcePos) {
                        target += '#L' + (sourcePos.line + 1) + ',' + (sourcePos.character + 1);
                        break;
                    }
                }
            }
        }
    }
    return target;
}
exports.transformDocumentLinkTarget = transformDocumentLinkTarget;
//# sourceMappingURL=documentLinkResolve.js.map