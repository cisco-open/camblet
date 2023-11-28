"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddedEditToSourceEdit = exports.mergeWorkspaceEdits = exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const dedupe = require("../utils/dedupe");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, newName, token = cancellation_1.NoneCancellationToken) => {
        let _data;
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, { position, newName }, function* (arg, map) {
            for (const mapped of map.toGeneratedPositions(arg.position, data => {
                _data = data;
                return typeof data.rename === 'object' ? !!data.rename.normalize : !!data.rename;
            })) {
                let newName = arg.newName;
                if (_data && typeof _data.rename === 'object' && _data.rename.normalize) {
                    newName = _data.rename.normalize(arg.newName);
                }
                yield { position: mapped, newName };
            }
            ;
        }, async (service, document, arg) => {
            if (token.isCancellationRequested)
                return;
            const recursiveChecker = dedupe.createLocationSet();
            let result;
            await withMirrors(document, arg.position, arg.newName);
            return result;
            async function withMirrors(document, position, newName) {
                if (!service.provideRenameEdits)
                    return;
                if (recursiveChecker.has({ uri: document.uri, range: { start: position, end: position } }))
                    return;
                recursiveChecker.add({ uri: document.uri, range: { start: position, end: position } });
                const workspaceEdit = await service.provideRenameEdits(document, position, newName, token);
                if (!workspaceEdit)
                    return;
                if (!result)
                    result = {};
                if (workspaceEdit.changes) {
                    for (const editUri in workspaceEdit.changes) {
                        const textEdits = workspaceEdit.changes[editUri];
                        for (const textEdit of textEdits) {
                            let foundMirrorPosition = false;
                            recursiveChecker.add({ uri: editUri, range: { start: textEdit.range.start, end: textEdit.range.start } });
                            const mirrorMap = context.documents.getMirrorMapByUri(editUri)?.[1];
                            if (mirrorMap) {
                                for (const mapped of mirrorMap.findMirrorPositions(textEdit.range.start)) {
                                    if (!mapped[1].rename)
                                        continue;
                                    if (recursiveChecker.has({ uri: mirrorMap.document.uri, range: { start: mapped[0], end: mapped[0] } }))
                                        continue;
                                    foundMirrorPosition = true;
                                    await withMirrors(mirrorMap.document, mapped[0], newName);
                                }
                            }
                            if (!foundMirrorPosition) {
                                if (!result.changes)
                                    result.changes = {};
                                if (!result.changes[editUri])
                                    result.changes[editUri] = [];
                                result.changes[editUri].push(textEdit);
                            }
                        }
                    }
                }
                if (workspaceEdit.changeAnnotations) {
                    for (const uri in workspaceEdit.changeAnnotations) {
                        if (!result.changeAnnotations)
                            result.changeAnnotations = {};
                        result.changeAnnotations[uri] = workspaceEdit.changeAnnotations[uri];
                    }
                }
                if (workspaceEdit.documentChanges) {
                    if (!result.documentChanges)
                        result.documentChanges = [];
                    result.documentChanges = result.documentChanges.concat(workspaceEdit.documentChanges);
                }
            }
        }, (data) => {
            return embeddedEditToSourceEdit(data, context.documents, 'rename');
        }, (workspaceEdits) => {
            const mainEdit = workspaceEdits[0];
            const otherEdits = workspaceEdits.slice(1);
            mergeWorkspaceEdits(mainEdit, ...otherEdits);
            if (mainEdit.changes) {
                for (const uri in mainEdit.changes) {
                    mainEdit.changes[uri] = dedupe.withTextEdits(mainEdit.changes[uri]);
                }
            }
            return workspaceEdits[0];
        });
    };
}
exports.register = register;
function mergeWorkspaceEdits(original, ...others) {
    for (const other of others) {
        for (const uri in other.changeAnnotations) {
            if (!original.changeAnnotations) {
                original.changeAnnotations = {};
            }
            original.changeAnnotations[uri] = other.changeAnnotations[uri];
        }
        for (const uri in other.changes) {
            if (!original.changes) {
                original.changes = {};
            }
            if (!original.changes[uri]) {
                original.changes[uri] = [];
            }
            const edits = other.changes[uri];
            original.changes[uri] = original.changes[uri].concat(edits);
        }
        if (other.documentChanges) {
            if (!original.documentChanges) {
                original.documentChanges = [];
            }
            for (const docChange of other.documentChanges) {
                pushEditToDocumentChanges(original.documentChanges, docChange);
            }
        }
    }
}
exports.mergeWorkspaceEdits = mergeWorkspaceEdits;
function embeddedEditToSourceEdit(tsResult, documents, mode, versions = {}) {
    const sourceResult = {};
    let hasResult = false;
    for (const tsUri in tsResult.changeAnnotations) {
        sourceResult.changeAnnotations ??= {};
        const tsAnno = tsResult.changeAnnotations[tsUri];
        if (!documents.isVirtualFileUri(tsUri)) {
            sourceResult.changeAnnotations[tsUri] = tsAnno;
        }
        else {
            for (const [_, map] of documents.getMapsByVirtualFileUri(tsUri)) {
                // TODO: check capability?
                const uri = map.sourceFileDocument.uri;
                sourceResult.changeAnnotations[uri] = tsAnno;
            }
        }
    }
    for (const tsUri in tsResult.changes) {
        sourceResult.changes ??= {};
        if (!documents.isVirtualFileUri(tsUri)) {
            sourceResult.changes[tsUri] = tsResult.changes[tsUri];
            hasResult = true;
            continue;
        }
        for (const [_, map] of documents.getMapsByVirtualFileUri(tsUri)) {
            const tsEdits = tsResult.changes[tsUri];
            for (const tsEdit of tsEdits) {
                if (mode === 'rename' || mode === 'fileName' || mode === 'codeAction') {
                    let _data;
                    const range = map.toSourceRange(tsEdit.range, data => {
                        _data = data;
                        return typeof data.rename === 'object' ? !!data.rename.apply : !!data.rename;
                    });
                    if (range) {
                        let newText = tsEdit.newText;
                        if (_data && typeof _data.rename === 'object' && _data.rename.apply) {
                            newText = _data.rename.apply(tsEdit.newText);
                        }
                        sourceResult.changes[map.sourceFileDocument.uri] ??= [];
                        sourceResult.changes[map.sourceFileDocument.uri].push({ newText, range });
                        hasResult = true;
                    }
                }
                else {
                    const range = map.toSourceRange(tsEdit.range);
                    if (range) {
                        sourceResult.changes[map.sourceFileDocument.uri] ??= [];
                        sourceResult.changes[map.sourceFileDocument.uri].push({ newText: tsEdit.newText, range });
                        hasResult = true;
                    }
                }
            }
        }
    }
    if (tsResult.documentChanges) {
        for (const tsDocEdit of tsResult.documentChanges) {
            sourceResult.documentChanges ??= [];
            let sourceEdit;
            if ('textDocument' in tsDocEdit) {
                if (documents.isVirtualFileUri(tsDocEdit.textDocument.uri)) {
                    for (const [_, map] of documents.getMapsByVirtualFileUri(tsDocEdit.textDocument.uri)) {
                        sourceEdit = {
                            textDocument: {
                                uri: map.sourceFileDocument.uri,
                                version: versions[map.sourceFileDocument.uri] ?? null,
                            },
                            edits: [],
                        };
                        for (const tsEdit of tsDocEdit.edits) {
                            if (mode === 'rename' || mode === 'fileName' || mode === 'codeAction') {
                                let _data;
                                const range = map.toSourceRange(tsEdit.range, data => {
                                    _data = data;
                                    // fix https://github.com/johnsoncodehk/volar/issues/1091
                                    return typeof data.rename === 'object' ? !!data.rename.apply : !!data.rename;
                                });
                                if (range) {
                                    let newText = tsEdit.newText;
                                    if (_data && typeof _data.rename === 'object' && _data.rename.apply) {
                                        newText = _data.rename.apply(tsEdit.newText);
                                    }
                                    sourceEdit.edits.push({
                                        annotationId: 'annotationId' in tsEdit ? tsEdit.annotationId : undefined,
                                        newText,
                                        range,
                                    });
                                }
                            }
                            else {
                                const range = map.toSourceRange(tsEdit.range);
                                if (range) {
                                    sourceEdit.edits.push({
                                        annotationId: 'annotationId' in tsEdit ? tsEdit.annotationId : undefined,
                                        newText: tsEdit.newText,
                                        range,
                                    });
                                }
                            }
                        }
                        if (!sourceEdit.edits.length) {
                            sourceEdit = undefined;
                        }
                    }
                }
                else {
                    sourceEdit = tsDocEdit;
                }
            }
            else if (tsDocEdit.kind === 'create') {
                sourceEdit = tsDocEdit; // TODO: remove .ts?
            }
            else if (tsDocEdit.kind === 'rename') {
                if (!documents.isVirtualFileUri(tsDocEdit.oldUri)) {
                    sourceEdit = tsDocEdit;
                }
                else {
                    for (const [_, map] of documents.getMapsByVirtualFileUri(tsDocEdit.oldUri)) {
                        // TODO: check capability?
                        sourceEdit = {
                            kind: 'rename',
                            oldUri: map.sourceFileDocument.uri,
                            newUri: tsDocEdit.newUri /* TODO: remove .ts? */,
                            options: tsDocEdit.options,
                            annotationId: tsDocEdit.annotationId,
                        };
                    }
                }
            }
            else if (tsDocEdit.kind === 'delete') {
                if (!documents.isVirtualFileUri(tsDocEdit.uri)) {
                    sourceEdit = tsDocEdit;
                }
                else {
                    for (const [_, map] of documents.getMapsByVirtualFileUri(tsDocEdit.uri)) {
                        // TODO: check capability?
                        sourceEdit = {
                            kind: 'delete',
                            uri: map.sourceFileDocument.uri,
                            options: tsDocEdit.options,
                            annotationId: tsDocEdit.annotationId,
                        };
                    }
                }
            }
            if (sourceEdit) {
                pushEditToDocumentChanges(sourceResult.documentChanges, sourceEdit);
                hasResult = true;
            }
        }
    }
    if (hasResult) {
        return sourceResult;
    }
}
exports.embeddedEditToSourceEdit = embeddedEditToSourceEdit;
function pushEditToDocumentChanges(arr, item) {
    const current = arr.find(edit => 'textDocument' in edit
        && 'textDocument' in item
        && edit.textDocument.uri === item.textDocument.uri);
    if (current) {
        current.edits.push(...item.edits);
    }
    else {
        arr.push(item);
    }
}
//# sourceMappingURL=rename.js.map