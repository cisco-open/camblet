"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const transformer = require("../transformer");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (query, token = cancellation_1.NoneCancellationToken) => {
        const symbolsList = [];
        for (const service of Object.values(context.services)) {
            if (token.isCancellationRequested)
                break;
            if (!service.provideWorkspaceSymbols)
                continue;
            const embeddedSymbols = await service.provideWorkspaceSymbols(query, token);
            if (!embeddedSymbols)
                continue;
            const symbols = embeddedSymbols.map(symbol => transformer.asWorkspaceSymbol(symbol, loc => {
                if (context.documents.isVirtualFileUri(loc.uri)) {
                    for (const [_, map] of context.documents.getMapsByVirtualFileUri(loc.uri)) {
                        const range = map.toSourceRange(loc.range);
                        if (range) {
                            return { uri: map.sourceFileDocument.uri, range };
                        }
                    }
                }
                else {
                    return loc;
                }
            })).filter(common_1.notEmpty);
            symbolsList.push(symbols);
        }
        return symbolsList.flat();
    };
}
exports.register = register;
//# sourceMappingURL=workspaceSymbols.js.map