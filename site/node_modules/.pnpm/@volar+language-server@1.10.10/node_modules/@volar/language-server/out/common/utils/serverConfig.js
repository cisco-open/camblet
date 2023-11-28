"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
function loadConfig(console, dir, configFile) {
    let configPath;
    try {
        configPath = require.resolve(configFile ?? './volar.config.js', { paths: [dir] });
    }
    catch { }
    try {
        if (configPath) {
            const config = require(configPath);
            delete require.cache[configPath];
            return config;
        }
    }
    catch (err) {
        console.warn(String(err));
    }
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=serverConfig.js.map