"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileTextChangesToWorkspaceEdit = exports.register = void 0;
const path = require("path-browserify");
const prepareRename_1 = require("./prepareRename");
const getFormatCodeSettings_1 = require("../configs/getFormatCodeSettings");
const getUserPreferences_1 = require("../configs/getUserPreferences");
const shared_1 = require("../shared");
function register(ctx) {
    return async (uri, position, newName) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const renameInfo = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getRenameInfo(fileName, offset, prepareRename_1.renameInfoOptions));
        if (!renameInfo?.canRename)
            return;
        if (renameInfo.fileToRename) {
            const [formatOptions, preferences] = await Promise.all([
                (0, getFormatCodeSettings_1.getFormatCodeSettings)(ctx, document),
                (0, getUserPreferences_1.getUserPreferences)(ctx, document),
            ]);
            return renameFile(renameInfo.fileToRename, newName, formatOptions, preferences);
        }
        const { providePrefixAndSuffixTextForRename } = await (0, getUserPreferences_1.getUserPreferences)(ctx, document);
        const entries = ctx.typescript.languageService.findRenameLocations(fileName, offset, false, false, providePrefixAndSuffixTextForRename);
        if (!entries)
            return;
        const locations = locationsToWorkspaceEdit(newName, entries, ctx);
        return locations;
    };
    function renameFile(fileToRename, newName, formatOptions, preferences) {
        // Make sure we preserve file extension if none provided
        if (!path.extname(newName)) {
            newName += path.extname(fileToRename);
        }
        const dirname = path.dirname(fileToRename);
        const newFilePath = path.join(dirname, newName);
        const response = ctx.typescript.languageService.getEditsForFileRename(fileToRename, newFilePath, formatOptions, preferences);
        const edits = fileTextChangesToWorkspaceEdit(response, ctx);
        if (!edits.documentChanges) {
            edits.documentChanges = [];
        }
        edits.documentChanges.push({
            kind: 'rename',
            oldUri: ctx.env.fileNameToUri(fileToRename),
            newUri: ctx.env.fileNameToUri(newFilePath),
        });
        return edits;
    }
}
exports.register = register;
function fileTextChangesToWorkspaceEdit(changes, ctx) {
    const workspaceEdit = {};
    for (const change of changes) {
        if (!workspaceEdit.documentChanges) {
            workspaceEdit.documentChanges = [];
        }
        const uri = ctx.env.fileNameToUri(change.fileName);
        let doc = ctx.getTextDocument(uri);
        if (change.isNewFile) {
            workspaceEdit.documentChanges.push({ kind: 'create', uri });
        }
        if (!doc && !change.isNewFile)
            continue;
        const docEdit = {
            textDocument: {
                uri,
                version: null, // fix https://github.com/johnsoncodehk/volar/issues/2025
            },
            edits: [],
        };
        for (const textChange of change.textChanges) {
            docEdit.edits.push({
                newText: textChange.newText,
                range: {
                    start: doc?.positionAt(textChange.span.start) ?? { line: 0, character: 0 },
                    end: doc?.positionAt(textChange.span.start + textChange.span.length) ?? { line: 0, character: 0 },
                },
            });
        }
        workspaceEdit.documentChanges.push(docEdit);
    }
    return workspaceEdit;
}
exports.fileTextChangesToWorkspaceEdit = fileTextChangesToWorkspaceEdit;
function locationsToWorkspaceEdit(newText, locations, ctx) {
    const workspaceEdit = {};
    for (const location of locations) {
        if (!workspaceEdit.changes) {
            workspaceEdit.changes = {};
        }
        const uri = ctx.env.fileNameToUri(location.fileName);
        const doc = ctx.getTextDocument(uri);
        if (!doc)
            continue;
        if (!workspaceEdit.changes[uri]) {
            workspaceEdit.changes[uri] = [];
        }
        let _newText = newText;
        if (location.prefixText)
            _newText = location.prefixText + _newText;
        if (location.suffixText)
            _newText = _newText + location.suffixText;
        workspaceEdit.changes[uri].push({
            newText: _newText,
            range: {
                start: doc.positionAt(location.textSpan.start),
                end: doc.positionAt(location.textSpan.start + location.textSpan.length),
            },
        });
    }
    return workspaceEdit;
}
//# sourceMappingURL=rename.js.map