"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.documentFeatureWorker)(context, uri, file => !!file.capabilities.documentSymbol, // TODO: add color capability setting
        (service, document) => {
            if (token.isCancellationRequested)
                return;
            return service.provideDocumentColors?.(document, token);
        }, (data, map) => map ? data.map(color => {
            const range = map.toSourceRange(color.range);
            if (range) {
                return {
                    range,
                    color: color.color,
                };
            }
        }).filter(common_1.notEmpty) : data, arr => arr.flat());
    };
}
exports.register = register;
//# sourceMappingURL=documentColors.js.map