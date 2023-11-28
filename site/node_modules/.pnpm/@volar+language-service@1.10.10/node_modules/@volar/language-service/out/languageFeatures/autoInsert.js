"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, autoInsertContext, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, { position, autoInsertContext }, function* (arg, map) {
            for (const position of map.toGeneratedPositions(arg.position, data => !!data.completion)) {
                const rangeOffset = map.map.toGeneratedOffset(arg.autoInsertContext.lastChange.rangeOffset)?.[0];
                const range = map.toGeneratedRange(arg.autoInsertContext.lastChange.range);
                if (rangeOffset !== undefined && range) {
                    yield {
                        position,
                        autoInsertContext: {
                            lastChange: {
                                ...arg.autoInsertContext.lastChange,
                                rangeOffset,
                                range,
                            },
                        },
                    };
                    break;
                }
            }
        }, (service, document, arg) => {
            if (token.isCancellationRequested)
                return;
            return service.provideAutoInsertionEdit?.(document, arg.position, arg.autoInsertContext, token);
        }, (item, map) => {
            if (!map || typeof item === 'string')
                return item;
            const range = map.toSourceRange(item.range);
            if (range) {
                item.range = range;
                return item;
            }
        });
    };
}
exports.register = register;
//# sourceMappingURL=autoInsert.js.map