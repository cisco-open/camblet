"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const dedupe = require("../utils/dedupe");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, undefined, function* (_) {
            yield _;
        }, async (service, document) => {
            if (token.isCancellationRequested)
                return;
            return await service.provideFileReferences?.(document, token) ?? [];
        }, (data) => data.map(reference => {
            if (!context.documents.isVirtualFileUri(reference.uri)) {
                return reference;
            }
            for (const [_, map] of context.documents.getMapsByVirtualFileUri(reference.uri)) {
                const range = map.toSourceRange(reference.range);
                if (range) {
                    reference.uri = map.sourceFileDocument.uri;
                    reference.range = range;
                    return reference;
                }
            }
        }).filter(common_1.notEmpty), arr => dedupe.withLocations(arr.flat()));
    };
}
exports.register = register;
//# sourceMappingURL=fileReferences.js.map