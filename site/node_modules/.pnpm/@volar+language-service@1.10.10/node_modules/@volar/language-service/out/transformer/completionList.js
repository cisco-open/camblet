"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const completionItem_1 = require("./completionItem");
function transform(completionList, getOtherRange, document, onItem) {
    return {
        isIncomplete: completionList.isIncomplete,
        itemDefaults: completionList.itemDefaults ? {
            ...completionList.itemDefaults,
            editRange: completionList.itemDefaults.editRange
                ? 'replace' in completionList.itemDefaults.editRange
                    ? {
                        insert: getOtherRange(completionList.itemDefaults.editRange.insert),
                        replace: getOtherRange(completionList.itemDefaults.editRange.replace),
                    }
                    : getOtherRange(completionList.itemDefaults.editRange)
                : undefined,
        } : undefined,
        items: completionList.items.map(item => {
            const newItem = (0, completionItem_1.transform)(item, getOtherRange, document);
            onItem?.(newItem, item);
            return newItem;
        }),
    };
}
exports.transform = transform;
//# sourceMappingURL=completionList.js.map