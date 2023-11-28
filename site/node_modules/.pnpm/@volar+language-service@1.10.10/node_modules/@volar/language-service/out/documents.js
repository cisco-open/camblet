"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentsAndSourceMaps = exports.MirrorMapWithDocument = exports.SourceMapWithDocuments = void 0;
const language_core_1 = require("@volar/language-core");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const common_1 = require("./utils/common");
class SourceMapWithDocuments {
    constructor(sourceFileDocument, virtualFileDocument, map) {
        this.sourceFileDocument = sourceFileDocument;
        this.virtualFileDocument = virtualFileDocument;
        this.map = map;
    }
    // Range APIs
    toSourceRange(range, filter = () => true) {
        for (const result of this.toSourceRanges(range, filter)) {
            return result;
        }
    }
    toGeneratedRange(range, filter = () => true) {
        for (const result of this.toGeneratedRanges(range, filter)) {
            return result;
        }
    }
    *toSourceRanges(range, filter = () => true) {
        for (const result of this.toRanges(range, filter, 'toSourcePositionsBase', 'matchSourcePosition')) {
            yield result;
        }
    }
    *toGeneratedRanges(range, filter = () => true) {
        for (const result of this.toRanges(range, filter, 'toGeneratedPositionsBase', 'matchGeneratedPosition')) {
            yield result;
        }
    }
    *toRanges(range, filter, api, api2) {
        const failedLookUps = [];
        for (const mapped of this[api](range.start, filter, 'left')) {
            const end = this[api2](range.end, mapped[1], 'right');
            if (end) {
                yield { start: mapped[0], end };
            }
            else {
                failedLookUps.push(mapped);
            }
        }
        for (const failedLookUp of failedLookUps) {
            for (const mapped of this[api](range.end, filter, 'right')) {
                yield { start: failedLookUp[0], end: mapped[0] };
            }
        }
    }
    // Position APIs
    toSourcePosition(position, filter = () => true, baseOffset) {
        for (const mapped of this.toSourcePositions(position, filter, baseOffset)) {
            return mapped;
        }
    }
    toGeneratedPosition(position, filter = () => true, baseOffset) {
        for (const mapped of this.toGeneratedPositions(position, filter, baseOffset)) {
            return mapped;
        }
    }
    *toSourcePositions(position, filter = () => true, baseOffset) {
        for (const mapped of this.toSourcePositionsBase(position, filter, baseOffset)) {
            yield mapped[0];
        }
    }
    *toGeneratedPositions(position, filter = () => true, baseOffset) {
        for (const mapped of this.toGeneratedPositionsBase(position, filter, baseOffset)) {
            yield mapped[0];
        }
    }
    *toSourcePositionsBase(position, filter = () => true, baseOffset) {
        let hasResult = false;
        for (const mapped of this.toPositions(position, filter, this.virtualFileDocument, this.sourceFileDocument, 'generatedRange', 'sourceRange', baseOffset ?? 'left')) {
            hasResult = true;
            yield mapped;
        }
        if (!hasResult && baseOffset === undefined) {
            for (const mapped of this.toPositions(position, filter, this.virtualFileDocument, this.sourceFileDocument, 'generatedRange', 'sourceRange', 'right')) {
                yield mapped;
            }
        }
    }
    *toGeneratedPositionsBase(position, filter = () => true, baseOffset) {
        let hasResult = false;
        for (const mapped of this.toPositions(position, filter, this.sourceFileDocument, this.virtualFileDocument, 'sourceRange', 'generatedRange', baseOffset ?? 'left')) {
            hasResult = true;
            yield mapped;
        }
        if (!hasResult && baseOffset === undefined) {
            for (const mapped of this.toPositions(position, filter, this.sourceFileDocument, this.virtualFileDocument, 'sourceRange', 'generatedRange', 'right')) {
                yield mapped;
            }
        }
    }
    *toPositions(position, filter, fromDoc, toDoc, from, to, baseOffset) {
        for (const mapped of this.map.matching(fromDoc.offsetAt(position), from, to, baseOffset === 'right')) {
            if (!filter(mapped[1].data)) {
                continue;
            }
            yield [toDoc.positionAt(mapped[0]), mapped[1]];
        }
    }
    matchSourcePosition(position, mapping, baseOffset) {
        let offset = this.map.matchOffset(this.virtualFileDocument.offsetAt(position), mapping['generatedRange'], mapping['sourceRange'], baseOffset === 'right');
        if (offset !== undefined) {
            return this.sourceFileDocument.positionAt(offset);
        }
    }
    matchGeneratedPosition(position, mapping, baseOffset) {
        let offset = this.map.matchOffset(this.sourceFileDocument.offsetAt(position), mapping['sourceRange'], mapping['generatedRange'], baseOffset === 'right');
        if (offset !== undefined) {
            return this.virtualFileDocument.positionAt(offset);
        }
    }
}
exports.SourceMapWithDocuments = SourceMapWithDocuments;
class MirrorMapWithDocument extends SourceMapWithDocuments {
    constructor(document, map) {
        super(document, document, map);
        this.document = document;
    }
    *findMirrorPositions(start) {
        for (const mapped of this.toGeneratedPositionsBase(start)) {
            yield [mapped[0], mapped[1].data[1]];
        }
        for (const mapped of this.toSourcePositionsBase(start)) {
            yield [mapped[0], mapped[1].data[0]];
        }
    }
}
exports.MirrorMapWithDocument = MirrorMapWithDocument;
function createDocumentsAndSourceMaps(env, host, mapper) {
    let version = 0;
    const map2DocMap = new WeakMap();
    const mirrorMap2DocMirrorMap = new WeakMap();
    const snapshot2Doc = new WeakMap();
    return {
        getSourceByUri(sourceFileUri) {
            return mapper.getSource(env.uriToFileName(sourceFileUri));
        },
        isVirtualFileUri(virtualFileUri) {
            return mapper.hasVirtualFile(env.uriToFileName(virtualFileUri));
        },
        getVirtualFileByUri(virtualFileUri) {
            return mapper.getVirtualFile(env.uriToFileName(virtualFileUri));
        },
        getMirrorMapByUri(virtualFileUri) {
            const fileName = env.uriToFileName(virtualFileUri);
            const [virtualFile] = mapper.getVirtualFile(fileName);
            if (virtualFile) {
                const map = mapper.getMirrorMap(virtualFile);
                if (map) {
                    if (!mirrorMap2DocMirrorMap.has(map)) {
                        mirrorMap2DocMirrorMap.set(map, new MirrorMapWithDocument(getDocumentByFileName(virtualFile.snapshot, fileName), map));
                    }
                    return [virtualFile, mirrorMap2DocMirrorMap.get(map)];
                }
            }
        },
        getMapsBySourceFileUri(uri) {
            return this.getMapsBySourceFileName(env.uriToFileName(uri));
        },
        getMapsBySourceFileName(fileName) {
            const source = mapper.getSource(fileName);
            if (source) {
                const result = [];
                (0, language_core_1.forEachEmbeddedFile)(source.root, (virtualFile) => {
                    for (const [sourceFileName, [sourceSnapshot, map]] of mapper.getMaps(virtualFile)) {
                        if (sourceSnapshot === source.snapshot) {
                            if (!map2DocMap.has(map)) {
                                map2DocMap.set(map, new SourceMapWithDocuments(getDocumentByFileName(sourceSnapshot, sourceFileName), getDocumentByFileName(virtualFile.snapshot, fileName), map));
                            }
                            result.push([virtualFile, map2DocMap.get(map)]);
                        }
                    }
                });
                return {
                    snapshot: source.snapshot,
                    maps: result,
                };
            }
        },
        getMapsByVirtualFileUri(virtualFileUri) {
            return this.getMapsByVirtualFileName(env.uriToFileName(virtualFileUri));
        },
        *getMapsByVirtualFileName(virtualFileName) {
            const [virtualFile] = mapper.getVirtualFile(virtualFileName);
            if (virtualFile) {
                for (const [sourceFileName, [sourceSnapshot, map]] of mapper.getMaps(virtualFile)) {
                    if (!map2DocMap.has(map)) {
                        map2DocMap.set(map, new SourceMapWithDocuments(getDocumentByFileName(sourceSnapshot, sourceFileName), getDocumentByFileName(virtualFile.snapshot, virtualFileName), map));
                    }
                    yield [virtualFile, map2DocMap.get(map)];
                }
            }
        },
        getDocumentByUri(snapshot, uri) {
            return this.getDocumentByFileName(snapshot, env.uriToFileName(uri));
        },
        getDocumentByFileName,
    };
    function getDocumentByFileName(snapshot, fileName) {
        if (!snapshot2Doc.has(snapshot)) {
            snapshot2Doc.set(snapshot, new Map());
        }
        const map = snapshot2Doc.get(snapshot);
        if (!map.has(fileName)) {
            const uri = env.fileNameToUri(fileName);
            map.set(fileName, vscode_languageserver_textdocument_1.TextDocument.create(uri, host.getLanguageId?.(fileName) ?? (0, common_1.resolveCommonLanguageId)(uri), version++, snapshot.getText(0, snapshot.getLength())));
        }
        return map.get(fileName);
    }
}
exports.createDocumentsAndSourceMaps = createDocumentsAndSourceMaps;
//# sourceMappingURL=documents.js.map