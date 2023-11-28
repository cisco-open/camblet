"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const transformer = require("../transformer");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (item, token = cancellation_1.NoneCancellationToken) => {
        const data = item.data;
        if (data) {
            const service = context.services[data.serviceId];
            if (!service.resolveCompletionItem)
                return item;
            item = Object.assign(item, data.original);
            if (data.virtualDocumentUri) {
                for (const [_, map] of context.documents.getMapsByVirtualFileUri(data.virtualDocumentUri)) {
                    item = await service.resolveCompletionItem(item, token);
                    item = service.transformCompletionItem?.(item) ?? transformer.asCompletionItem(item, embeddedRange => map.toSourceRange(embeddedRange), map.virtualFileDocument);
                }
            }
            else {
                item = await service.resolveCompletionItem(item, token);
            }
        }
        // TODO: monkey fix import ts file icon
        if (item.detail !== item.detail + '.ts') {
            item.detail = item.detail;
        }
        return item;
    };
}
exports.register = register;
//# sourceMappingURL=completeResolve.js.map