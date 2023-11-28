"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const rename_1 = require("./rename");
const dedupe = require("../utils/dedupe");
const language_core_1 = require("@volar/language-core");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (oldUri, newUri, token = cancellation_1.NoneCancellationToken) => {
        const rootFile = context.documents.getSourceByUri(oldUri)?.root;
        if (rootFile) {
            let tsExt;
            (0, language_core_1.forEachEmbeddedFile)(rootFile, embedded => {
                if (embedded.kind === language_core_1.FileKind.TypeScriptHostFile && embedded.fileName.replace(rootFile.fileName, '').match(/^\.(js|ts)x?$/)) {
                    tsExt = embedded.fileName.substring(embedded.fileName.lastIndexOf('.'));
                }
            });
            if (!tsExt) {
                return;
            }
            oldUri += tsExt;
            newUri += tsExt;
        }
        for (const service of Object.values(context.services)) {
            if (token.isCancellationRequested)
                break;
            if (!service.provideFileRenameEdits)
                continue;
            const workspaceEdit = await service.provideFileRenameEdits(oldUri, newUri, token);
            if (workspaceEdit) {
                const result = (0, rename_1.embeddedEditToSourceEdit)(workspaceEdit, context.documents, 'fileName');
                if (result?.documentChanges) {
                    result.documentChanges = dedupe.withDocumentChanges(result.documentChanges);
                }
                return result;
            }
        }
    };
}
exports.register = register;
//# sourceMappingURL=fileRename.js.map