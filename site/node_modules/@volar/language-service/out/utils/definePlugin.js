"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitEmbedded = void 0;
async function visitEmbedded(documents, current, cb, rootFile = current) {
    for (const embedded of current.embeddedFiles) {
        if (!await visitEmbedded(documents, embedded, cb, rootFile)) {
            return false;
        }
    }
    for (const [_, map] of documents.getMapsByVirtualFileName(current.fileName)) {
        if (documents.getSourceByUri(map.sourceFileDocument.uri)?.root === rootFile) {
            if (!await cb(current, map)) {
                return false;
            }
        }
    }
    return true;
}
exports.visitEmbedded = visitEmbedded;
//# sourceMappingURL=definePlugin.js.map