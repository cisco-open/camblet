"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCall = exports.isJsonDocument = exports.isTsDocument = exports.getConfigTitle = void 0;
function getConfigTitle(document) {
    if (document.languageId === 'javascriptreact') {
        return 'javascript';
    }
    if (document.languageId === 'typescriptreact') {
        return 'typescript';
    }
    return document.languageId;
}
exports.getConfigTitle = getConfigTitle;
function isTsDocument(document) {
    return document.languageId === 'javascript' ||
        document.languageId === 'typescript' ||
        document.languageId === 'javascriptreact' ||
        document.languageId === 'typescriptreact';
}
exports.isTsDocument = isTsDocument;
function isJsonDocument(document) {
    return document.languageId === 'json' ||
        document.languageId === 'jsonc';
}
exports.isJsonDocument = isJsonDocument;
function safeCall(cb) {
    try {
        return cb();
    }
    catch { }
}
exports.safeCall = safeCall;
//# sourceMappingURL=shared.js.map