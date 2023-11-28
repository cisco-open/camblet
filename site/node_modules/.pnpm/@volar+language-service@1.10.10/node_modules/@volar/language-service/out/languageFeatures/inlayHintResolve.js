"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (item, token = cancellation_1.NoneCancellationToken) => {
        const data = item.data;
        if (data) {
            const service = context.services[data.serviceId];
            if (!service.resolveInlayHint)
                return item;
            Object.assign(item, data.original);
            item = await service.resolveInlayHint(item, token);
        }
        return item;
    };
}
exports.register = register;
//# sourceMappingURL=inlayHintResolve.js.map