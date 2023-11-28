"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (uri, token = cancellation_1.NoneCancellationToken) => {
        return await (0, featureWorkers_1.languageFeatureWorker)(context, uri, undefined, (arg) => [arg], async (service, document) => {
            if (token.isCancellationRequested)
                return;
            let codeLens = await service.provideCodeLenses?.(document, token);
            const serviceId = Object.keys(context.services).find(key => context.services[key] === service);
            codeLens?.forEach(codeLens => {
                codeLens.data = {
                    kind: 'normal',
                    uri,
                    original: {
                        data: codeLens.data,
                    },
                    serviceId: serviceId,
                };
            });
            const ranges = await service.provideReferencesCodeLensRanges?.(document, token);
            const referencesCodeLens = ranges?.map(range => ({
                range,
                data: {
                    kind: 'references',
                    uri,
                    range,
                    serviceId: serviceId,
                },
            }));
            codeLens = [
                ...codeLens ?? [],
                ...referencesCodeLens ?? [],
            ];
            return codeLens;
        }, (data, map) => data.map(codeLens => {
            if (!map)
                return codeLens;
            const range = map.toSourceRange(codeLens.range);
            if (range) {
                return {
                    ...codeLens,
                    range,
                };
            }
        }).filter(common_1.notEmpty), arr => arr.flat()) ?? [];
    };
}
exports.register = register;
//# sourceMappingURL=codeLens.js.map