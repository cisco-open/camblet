"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.renameInfoOptions = void 0;
const shared_1 = require("../shared");
/* typescript-language-features is hardcode true */
exports.renameInfoOptions = { allowRenameOfImportPath: true };
function register(ctx) {
    return (uri, position) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const renameInfo = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getRenameInfo(fileName, offset, exports.renameInfoOptions));
        if (!renameInfo)
            return;
        if (!renameInfo.canRename) {
            return { message: renameInfo.localizedErrorMessage };
        }
        return {
            start: document.positionAt(renameInfo.triggerSpan.start),
            end: document.positionAt(renameInfo.triggerSpan.start + renameInfo.triggerSpan.length),
        };
    };
}
exports.register = register;
//# sourceMappingURL=prepareRename.js.map