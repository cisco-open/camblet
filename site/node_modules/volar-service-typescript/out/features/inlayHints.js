"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const getUserPreferences_1 = require("../configs/getUserPreferences");
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return async (uri, range) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const preferences = await (0, getUserPreferences_1.getUserPreferences)(ctx, document);
        const fileName = ctx.env.uriToFileName(document.uri);
        const start = document.offsetAt(range.start);
        const end = document.offsetAt(range.end);
        const inlayHints = (0, shared_1.safeCall)(() => 'provideInlayHints' in ctx.typescript.languageService
            ? ctx.typescript.languageService.provideInlayHints(fileName, { start, length: end - start }, preferences)
            : []) ?? [];
        return inlayHints.map(inlayHint => {
            const result = {
                position: document.positionAt(inlayHint.position),
                label: inlayHint.text,
                kind: inlayHint.kind === ts.InlayHintKind.Type ? 1
                    : inlayHint.kind === ts.InlayHintKind.Parameter ? 2
                        : undefined,
            };
            result.paddingLeft = inlayHint.whitespaceBefore;
            result.paddingRight = inlayHint.whitespaceAfter;
            return result;
        });
    };
}
exports.register = register;
//# sourceMappingURL=inlayHints.js.map