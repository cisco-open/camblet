"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
function transform(symbol, getOtherLocation) {
    if (!('range' in symbol.location)) {
        return symbol;
    }
    const loc = getOtherLocation(symbol.location);
    if (!loc) {
        return;
    }
    return {
        ...symbol,
        location: loc,
    };
}
exports.transform = transform;
//# sourceMappingURL=workspaceSymbol.js.map