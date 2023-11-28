"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notEmpty = exports.sleep = exports.resolveCommonLanguageId = exports.stringToSnapshot = exports.isInsideRange = exports.getOverlapRange = void 0;
function getOverlapRange(range1Start, range1End, range2Start, range2End) {
    const start = Math.max(range1Start, range2Start);
    const end = Math.min(range1End, range2End);
    if (start > end)
        return undefined;
    return {
        start,
        end,
    };
}
exports.getOverlapRange = getOverlapRange;
function isInsideRange(parent, child) {
    if (child.start.line < parent.start.line)
        return false;
    if (child.end.line > parent.end.line)
        return false;
    if (child.start.line === parent.start.line && child.start.character < parent.start.character)
        return false;
    if (child.end.line === parent.end.line && child.end.character > parent.end.character)
        return false;
    return true;
}
exports.isInsideRange = isInsideRange;
function stringToSnapshot(str) {
    return {
        getText: (start, end) => str.substring(start, end),
        getLength: () => str.length,
        getChangeRange: () => undefined,
    };
}
exports.stringToSnapshot = stringToSnapshot;
function resolveCommonLanguageId(uri) {
    const ext = uri.split('.').pop();
    switch (ext) {
        case 'js': return 'javascript';
        case 'cjs': return 'javascript';
        case 'mjs': return 'javascript';
        case 'ts': return 'typescript';
        case 'cts': return 'typescript';
        case 'mts': return 'typescript';
        case 'jsx': return 'javascriptreact';
        case 'tsx': return 'typescriptreact';
        case 'pug': return 'jade';
        case 'md': return 'markdown';
    }
    return ext;
}
exports.resolveCommonLanguageId = resolveCommonLanguageId;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function notEmpty(value) {
    return value !== null && value !== undefined;
}
exports.notEmpty = notEmpty;
//# sourceMappingURL=common.js.map