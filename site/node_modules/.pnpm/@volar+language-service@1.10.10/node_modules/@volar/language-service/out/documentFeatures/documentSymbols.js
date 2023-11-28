"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const transformer = require("../transformer");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.documentFeatureWorker)(context, uri, file => !!file.capabilities.documentSymbol, async (service, document) => {
            if (token.isCancellationRequested)
                return;
            return service.provideDocumentSymbols?.(document, token);
        }, (data, map) => map
            ? data
                .map(symbol => transformer.asDocumentSymbol(symbol, range => map.toSourceRange(range)))
                .filter(common_1.notEmpty)
            : data, results => {
            for (let i = 0; i < results.length; i++) {
                for (let j = 0; j < results.length; j++) {
                    if (i === j)
                        continue;
                    results[i] = results[i].filter(child => {
                        for (const parent of results[j]) {
                            if ((0, common_1.isInsideRange)(parent.range, child.range)) {
                                parent.children ??= [];
                                parent.children.push(child);
                                return false;
                            }
                        }
                        return true;
                    });
                }
            }
            return results.flat();
        });
    };
}
exports.register = register;
//# sourceMappingURL=documentSymbols.js.map