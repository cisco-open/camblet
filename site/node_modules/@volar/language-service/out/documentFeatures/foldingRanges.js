"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const transformer = require("../transformer");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.documentFeatureWorker)(context, uri, file => !!file.capabilities.foldingRange, (service, document) => {
            if (token.isCancellationRequested)
                return;
            return service.provideFoldingRanges?.(document, token);
        }, (data, map) => map ? transformer.asFoldingRanges(data, range => map.toSourceRange(range)) : data, arr => arr.flat());
    };
}
exports.register = register;
//# sourceMappingURL=foldingRanges.js.map