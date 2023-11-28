"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const PConst = require("../protocol.const");
const modifiers_1 = require("../utils/modifiers");
const typeConverters = require("../utils/typeConverters");
const path = require("path-browserify");
const shared_1 = require("../shared");
function register(ctx) {
    function doPrepare(uri, position) {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const calls = (0, shared_1.safeCall)(() => ctx.typescript.languageService.prepareCallHierarchy(fileName, offset));
        if (!calls)
            return [];
        const items = Array.isArray(calls) ? calls : [calls];
        return items.map(item => fromProtocolCallHierarchyItem(item));
    }
    function getIncomingCalls(item) {
        const document = ctx.getTextDocument(item.uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(item.uri);
        const offset = document.offsetAt(item.selectionRange.start);
        const calls = (0, shared_1.safeCall)(() => ctx.typescript.languageService.provideCallHierarchyIncomingCalls(fileName, offset));
        if (!calls)
            return [];
        const items = Array.isArray(calls) ? calls : [calls];
        return items.map(item => fromProtocolCallHierarchyIncomingCall(item));
    }
    function getOutgoingCalls(item) {
        const document = ctx.getTextDocument(item.uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(item.uri);
        const offset = document.offsetAt(item.selectionRange.start);
        const calls = (0, shared_1.safeCall)(() => ctx.typescript.languageService.provideCallHierarchyOutgoingCalls(fileName, offset));
        if (!calls)
            return [];
        const items = Array.isArray(calls) ? calls : [calls];
        return items.map(item => fromProtocolCallHierarchyOutgoingCall(item, document));
    }
    return {
        doPrepare,
        getIncomingCalls,
        getOutgoingCalls,
    };
    function isSourceFileItem(item) {
        return item.kind === PConst.Kind.script || item.kind === PConst.Kind.module && item.selectionSpan.start === 0;
    }
    function fromProtocolCallHierarchyItem(item) {
        const rootPath = ctx.typescript.languageService.getProgram()?.getCompilerOptions().rootDir ?? '';
        const document = ctx.getTextDocument(ctx.env.fileNameToUri(item.file)); // TODO
        const useFileName = isSourceFileItem(item);
        const name = useFileName ? path.basename(item.file) : item.name;
        const detail = useFileName ? path.relative(rootPath, path.dirname(item.file)) : item.containerName ?? '';
        const result = {
            kind: typeConverters.SymbolKind.fromProtocolScriptElementKind(item.kind),
            name,
            detail,
            uri: ctx.env.fileNameToUri(item.file),
            range: {
                start: document.positionAt(item.span.start),
                end: document.positionAt(item.span.start + item.span.length),
            },
            selectionRange: {
                start: document.positionAt(item.selectionSpan.start),
                end: document.positionAt(item.selectionSpan.start + item.selectionSpan.length),
            },
        };
        const kindModifiers = item.kindModifiers ? (0, modifiers_1.parseKindModifier)(item.kindModifiers) : undefined;
        if (kindModifiers?.has(PConst.KindModifiers.deprecated)) {
            result.tags = [1];
        }
        return result;
    }
    function fromProtocolCallHierarchyIncomingCall(item) {
        const document = ctx.getTextDocument(ctx.env.fileNameToUri(item.from.file));
        return {
            from: fromProtocolCallHierarchyItem(item.from),
            fromRanges: item.fromSpans.map(fromSpan => ({
                start: document.positionAt(fromSpan.start),
                end: document.positionAt(fromSpan.start + fromSpan.length),
            })),
        };
    }
    function fromProtocolCallHierarchyOutgoingCall(item, document) {
        return {
            to: fromProtocolCallHierarchyItem(item.to),
            fromRanges: item.fromSpans.map(fromSpan => ({
                start: document.positionAt(fromSpan.start),
                end: document.positionAt(fromSpan.start + fromSpan.length),
            })),
        };
    }
}
exports.register = register;
;
//# sourceMappingURL=callHierarchy.js.map