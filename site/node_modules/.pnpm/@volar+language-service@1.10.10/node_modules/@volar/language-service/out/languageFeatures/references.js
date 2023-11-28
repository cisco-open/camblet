"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const dedupe = require("../utils/dedupe");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => !!data.references), async (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            const recursiveChecker = dedupe.createLocationSet();
            const result = [];
            await withMirrors(document, position);
            return result;
            async function withMirrors(document, position) {
                if (!service.provideReferences)
                    return;
                if (recursiveChecker.has({ uri: document.uri, range: { start: position, end: position } }))
                    return;
                recursiveChecker.add({ uri: document.uri, range: { start: position, end: position } });
                const references = await service.provideReferences(document, position, token) ?? [];
                for (const reference of references) {
                    let foundMirrorPosition = false;
                    recursiveChecker.add({ uri: reference.uri, range: { start: reference.range.start, end: reference.range.start } });
                    const mirrorMap = context.documents.getMirrorMapByUri(reference.uri)?.[1];
                    if (mirrorMap) {
                        for (const mapped of mirrorMap.findMirrorPositions(reference.range.start)) {
                            if (!mapped[1].references)
                                continue;
                            if (recursiveChecker.has({ uri: mirrorMap.document.uri, range: { start: mapped[0], end: mapped[0] } }))
                                continue;
                            foundMirrorPosition = true;
                            await withMirrors(mirrorMap.document, mapped[0]);
                        }
                    }
                    if (!foundMirrorPosition) {
                        result.push(reference);
                    }
                }
            }
        }, (data) => {
            const results = [];
            for (const reference of data) {
                if (context.documents.isVirtualFileUri(reference.uri)) {
                    for (const [_, map] of context.documents.getMapsByVirtualFileUri(reference.uri)) {
                        const range = map.toSourceRange(reference.range, data => !!data.references);
                        if (range) {
                            results.push({
                                uri: map.sourceFileDocument.uri,
                                range,
                            });
                        }
                    }
                }
                else {
                    results.push(reference);
                }
            }
            return results;
        }, arr => dedupe.withLocations(arr.flat()));
    };
}
exports.register = register;
//# sourceMappingURL=references.js.map