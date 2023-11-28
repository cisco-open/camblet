"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, color, range, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, range, (range, map, file) => {
            if (file.capabilities.documentSymbol) // TODO: add color capability setting
                return map.toGeneratedRanges(range);
            return [];
        }, (service, document, range) => {
            if (token.isCancellationRequested)
                return;
            return service.provideColorPresentations?.(document, color, range, token);
        }, (data, map) => map ? data.map(cp => {
            if (cp.textEdit) {
                const range = map.toSourceRange(cp.textEdit.range);
                if (!range)
                    return undefined;
                cp.textEdit.range = range;
            }
            if (cp.additionalTextEdits) {
                for (const textEdit of cp.additionalTextEdits) {
                    const range = map.toSourceRange(textEdit.range);
                    if (!range)
                        return undefined;
                    textEdit.range = range;
                }
            }
            return cp;
        }).filter(common_1.notEmpty) : data);
    };
}
exports.register = register;
//# sourceMappingURL=colorPresentations.js.map