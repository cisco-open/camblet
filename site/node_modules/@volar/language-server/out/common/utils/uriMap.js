"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUriMap = exports._ = void 0;
const vscode_uri_1 = require("vscode-uri");
exports._ = require("vscode-uri");
function createUriMap(fileNameToUri, map = new Map()) {
    const uriToUri = new Map();
    const pathToUri = new Map();
    return {
        clear,
        values,
        uriKeys: keys,
        uriDelete,
        uriGet,
        uriHas,
        uriSet,
        pathDelete,
        pathGet,
        pathHas,
        pathSet,
    };
    function getUriByUri(uri) {
        if (!uriToUri.has(uri))
            uriToUri.set(uri, normalizeUri(uri).toLowerCase());
        return uriToUri.get(uri);
    }
    function getUriByPath(path) {
        if (!pathToUri.has(path)) {
            pathToUri.set(path, fileNameToUri(path).toLowerCase());
        }
        return pathToUri.get(path);
    }
    function clear() {
        return map.clear();
    }
    function values() {
        return map.values();
    }
    function keys() {
        return map.keys();
    }
    function uriDelete(_uri) {
        return map.delete(getUriByUri(_uri));
    }
    function uriGet(_uri) {
        return map.get(getUriByUri(_uri));
    }
    function uriHas(_uri) {
        return map.has(getUriByUri(_uri));
    }
    function uriSet(_uri, item) {
        return map.set(getUriByUri(_uri), item);
    }
    function pathDelete(path) {
        return uriDelete(getUriByPath(path));
    }
    function pathGet(path) {
        return uriGet(getUriByPath(path));
    }
    function pathHas(path) {
        return uriGet(getUriByPath(path));
    }
    function pathSet(path, item) {
        return uriSet(getUriByPath(path), item);
    }
}
exports.createUriMap = createUriMap;
function normalizeUri(uri) {
    try {
        return vscode_uri_1.URI.parse(uri).toString();
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=uriMap.js.map