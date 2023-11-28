"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const dedupe = require("../utils/dedupe");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, 
        // note https://github.com/johnsoncodehk/volar/issues/2009
        data => typeof data.rename === 'object' ? !!data.rename.normalize : !!data.rename), async (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            const recursiveChecker = dedupe.createLocationSet();
            const result = [];
            await withMirrors(document, position);
            return result;
            async function withMirrors(document, position) {
                if (!service.provideDocumentHighlights)
                    return;
                if (recursiveChecker.has({ uri: document.uri, range: { start: position, end: position } }))
                    return;
                recursiveChecker.add({ uri: document.uri, range: { start: position, end: position } });
                const references = await service.provideDocumentHighlights(document, position, token) ?? [];
                for (const reference of references) {
                    let foundMirrorPosition = false;
                    recursiveChecker.add({ uri: document.uri, range: { start: reference.range.start, end: reference.range.start } });
                    const mirrorMap = context.documents.getMirrorMapByUri(document.uri)?.[1];
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
        }, (data, map) => data.map(highlight => {
            if (!map)
                return highlight;
            const range = map.toSourceRange(highlight.range);
            if (range) {
                return {
                    ...highlight,
                    range,
                };
            }
        }).filter(common_1.notEmpty), arr => arr.flat());
    };
}
exports.register = register;
//# sourceMappingURL=documentHighlights.js.map