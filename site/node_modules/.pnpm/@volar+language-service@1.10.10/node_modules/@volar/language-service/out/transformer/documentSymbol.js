"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const common_1 = require("../utils/common");
function transform(symbol, getOtherRange) {
    const range = getOtherRange(symbol.range);
    if (!range) {
        return;
    }
    const selectionRange = getOtherRange(symbol.selectionRange);
    if (!selectionRange) {
        return;
    }
    return {
        ...symbol,
        range,
        selectionRange,
        children: symbol.children
            ?.map(child => transform(child, getOtherRange))
            .filter(common_1.notEmpty),
    };
}
exports.transform = transform;
//# sourceMappingURL=documentSymbol.js.map