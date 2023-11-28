"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const rename_1 = require("./rename");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (item, token = cancellation_1.NoneCancellationToken) => {
        const data = item.data;
        if (data?.type === 'service') {
            const service = context.services[data.serviceId];
            if (!service.resolveCodeAction)
                return item;
            Object.assign(item, data.original);
            item = await service.resolveCodeAction(item, token);
            item = service.transformCodeAction?.(item)
                ?? (item.edit
                    ? {
                        ...item,
                        edit: (0, rename_1.embeddedEditToSourceEdit)(item.edit, context.documents, 'codeAction', { [data.uri]: data.version }),
                    }
                    : item);
        }
        if (data?.type === 'rule') {
            const fixes = context.ruleFixes?.[data.documentUri]?.[data.ruleId]?.[data.ruleFixIndex];
            const fix = fixes?.[1][data.index];
            if (fix) {
                let edit = await fix.getWorkspaceEdit?.(fixes[0]) ?? undefined;
                if (!edit) {
                    const edits = await fix.getEdits?.(fixes[0]);
                    if (edits) {
                        edit = {
                            documentChanges: [{
                                    textDocument: {
                                        uri: data.documentUri,
                                        version: null
                                    },
                                    edits,
                                }],
                        };
                    }
                }
                if (edit) {
                    item.edit = (0, rename_1.embeddedEditToSourceEdit)(edit, context.documents, data.isFormat ? 'format' : 'codeAction', { [data.uri]: data.version });
                }
            }
        }
        return item;
    };
}
exports.register = register;
//# sourceMappingURL=codeActionResolve.js.map