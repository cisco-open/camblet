"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const transforms_1 = require("../utils/transforms");
const shared_1 = require("../shared");
function register(ctx) {
    return (uri) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(document.uri);
        const entries = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getFileReferences(fileName));
        if (!entries)
            return [];
        return (0, transforms_1.entriesToLocations)([...entries], ctx);
    };
}
exports.register = register;
//# sourceMappingURL=fileReferences.js.map