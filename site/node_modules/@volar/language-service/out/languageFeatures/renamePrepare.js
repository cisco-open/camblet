"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => typeof data.rename === 'object' ? !!data.rename.normalize : !!data.rename), (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            return service.provideRenameRange?.(document, position, token);
        }, (item, map) => {
            if (!map) {
                return item;
            }
            if ('start' in item && 'end' in item) {
                return map.toSourceRange(item);
            }
            return item;
        }, prepares => {
            for (const prepare of prepares) {
                if ('start' in prepare && 'end' in prepare) {
                    return prepare; // if has any valid range, ignore other errors
                }
            }
            return prepares[0];
        });
    };
}
exports.register = register;
//# sourceMappingURL=renamePrepare.js.map