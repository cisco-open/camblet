"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return (uri, position, signatureHelpContext = {
        triggerKind: 1,
        isRetrigger: false,
    }, token = cancellation_1.NoneCancellationToken) => {
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => !!data.completion), (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            if (signatureHelpContext?.triggerKind === 2
                && signatureHelpContext.triggerCharacter
                && !(signatureHelpContext.isRetrigger
                    ? service.signatureHelpRetriggerCharacters
                    : service.signatureHelpTriggerCharacters)?.includes(signatureHelpContext.triggerCharacter)) {
                return;
            }
            return service.provideSignatureHelp?.(document, position, signatureHelpContext, token);
        }, (data) => data);
    };
}
exports.register = register;
//# sourceMappingURL=signatureHelp.js.map