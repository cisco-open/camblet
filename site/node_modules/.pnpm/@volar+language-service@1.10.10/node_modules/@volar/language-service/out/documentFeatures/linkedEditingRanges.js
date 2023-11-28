"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => !!data.completion), (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            return service.provideLinkedEditingRanges?.(document, position, token);
        }, (data, map) => map ? ({
            wordPattern: data.wordPattern,
            ranges: data.ranges.map(range => map.toSourceRange(range)).filter(common_1.notEmpty),
        }) : data);
    };
}
exports.register = register;
//# sourceMappingURL=linkedEditingRanges.js.map