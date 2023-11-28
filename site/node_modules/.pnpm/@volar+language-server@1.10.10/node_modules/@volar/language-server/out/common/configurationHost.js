"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfigurationHost = void 0;
const vscode = require("vscode-languageserver");
function createConfigurationHost(params, connection) {
    const callbacks = new Set();
    const cache = new Map();
    connection.onDidChangeConfiguration(async () => {
        cache.clear();
        for (const cb of callbacks) {
            cb();
        }
    });
    return {
        ready() {
            if (params.capabilities.workspace?.didChangeConfiguration?.dynamicRegistration) {
                connection.client.register(vscode.DidChangeConfigurationNotification.type);
            }
        },
        async getConfiguration(section, scopeUri) {
            if (!scopeUri && params.capabilities.workspace?.didChangeConfiguration) {
                if (!cache.has(section)) {
                    cache.set(section, await getConfigurationWorker(section, scopeUri));
                }
                return cache.get(section);
            }
            return await getConfigurationWorker(section, scopeUri);
        },
        onDidChangeConfiguration(cb) {
            callbacks.add(cb);
            return {
                dispose() {
                    callbacks.delete(cb);
                },
            };
        },
    };
    async function getConfigurationWorker(section, scopeUri) {
        return (await connection.workspace.getConfiguration({ scopeUri, section })) ?? undefined /* replace null to undefined */;
    }
}
exports.createConfigurationHost = createConfigurationHost;
//# sourceMappingURL=configurationHost.js.map