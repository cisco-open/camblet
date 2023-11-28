"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundSpanToLocationLinks = exports.entriesToLocationLinks = exports.entriesToLocations = void 0;
function entriesToLocations(entries, ctx) {
    const locations = [];
    for (const entry of entries) {
        const entryUri = ctx.env.fileNameToUri(entry.fileName);
        const doc = ctx.getTextDocument(entryUri);
        if (!doc)
            continue;
        const range = {
            start: doc.positionAt(entry.textSpan.start),
            end: doc.positionAt(entry.textSpan.start + entry.textSpan.length),
        };
        const location = { uri: entryUri, range };
        locations.push(location);
    }
    return locations;
}
exports.entriesToLocations = entriesToLocations;
function entriesToLocationLinks(entries, ctx) {
    const locations = [];
    for (const entry of entries) {
        const entryUri = ctx.env.fileNameToUri(entry.fileName);
        const doc = ctx.getTextDocument(entryUri);
        if (!doc)
            continue;
        const targetSelectionRange = {
            start: doc.positionAt(entry.textSpan.start),
            end: doc.positionAt(entry.textSpan.start + entry.textSpan.length),
        };
        const targetRange = entry.contextSpan ? {
            start: doc.positionAt(entry.contextSpan.start),
            end: doc.positionAt(entry.contextSpan.start + entry.contextSpan.length),
        } : targetSelectionRange;
        const originSelectionRange = entry.originalTextSpan ? {
            start: doc.positionAt(entry.originalTextSpan.start),
            end: doc.positionAt(entry.originalTextSpan.start + entry.originalTextSpan.length),
        } : undefined;
        const location = {
            targetUri: entryUri,
            targetRange,
            targetSelectionRange,
            originSelectionRange,
        };
        locations.push(location);
    }
    return locations;
}
exports.entriesToLocationLinks = entriesToLocationLinks;
function boundSpanToLocationLinks(info, originalDoc, ctx) {
    const locations = [];
    if (!info.definitions)
        return locations;
    const originSelectionRange = {
        start: originalDoc.positionAt(info.textSpan.start),
        end: originalDoc.positionAt(info.textSpan.start + info.textSpan.length),
    };
    for (const entry of info.definitions) {
        const entryUri = ctx.env.fileNameToUri(entry.fileName);
        const doc = ctx.getTextDocument(entryUri);
        if (!doc)
            continue;
        const targetSelectionRange = {
            start: doc.positionAt(entry.textSpan.start),
            end: doc.positionAt(entry.textSpan.start + entry.textSpan.length),
        };
        const targetRange = entry.contextSpan ? {
            start: doc.positionAt(entry.contextSpan.start),
            end: doc.positionAt(entry.contextSpan.start + entry.contextSpan.length),
        } : targetSelectionRange;
        const location = {
            targetUri: entryUri,
            targetRange,
            targetSelectionRange,
            originSelectionRange,
        };
        locations.push(location);
    }
    return locations;
}
exports.boundSpanToLocationLinks = boundSpanToLocationLinks;
//# sourceMappingURL=transforms.js.map