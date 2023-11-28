"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetCancellationToken = void 0;
const vscode = require("vscode-languageserver");
function createGetCancellationToken(_cancellationPipeName) {
    if (_cancellationPipeName === undefined) {
        return (original) => {
            return original ?? vscode.CancellationToken.None;
        };
    }
    const cancellationPipeName = _cancellationPipeName;
    const fs = require('fs');
    return getCancellationToken;
    function getCancellationToken(original) {
        const mtime = getMtime();
        let currentMtime = mtime;
        let updateAt = Date.now();
        const token = {
            get isCancellationRequested() {
                if (original?.isCancellationRequested) {
                    return true;
                }
                // debounce 20ms
                if (currentMtime === mtime && Date.now() - updateAt >= 20) {
                    currentMtime = getMtime();
                    updateAt = Date.now();
                }
                return currentMtime !== mtime;
            },
            onCancellationRequested: vscode.Event.None,
        };
        return token;
    }
    function getMtime() {
        try {
            const stat = fs.statSync(cancellationPipeName, { throwIfNoEntry: false });
            return stat?.mtime.valueOf() ?? -1;
        }
        catch {
            return -1;
        }
    }
}
exports.createGetCancellationToken = createGetCancellationToken;
//# sourceMappingURL=cancellationPipe.js.map