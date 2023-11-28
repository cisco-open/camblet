"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fs = exports.getConfiguration = exports.fileNameToUri = exports.uriToFileName = exports.asPosix = exports.defaultCompilerOptions = void 0;
const vscode_uri_1 = require("vscode-uri");
const language_service_1 = require("@volar/language-service");
const _fs = require("fs");
exports.defaultCompilerOptions = {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    allowNonTsExtensions: true,
    resolveJsonModule: true,
    jsx: 1,
};
function asPosix(path) {
    return path.replace(/\\/g, '/');
}
exports.asPosix = asPosix;
const uriToFileName = (uri) => vscode_uri_1.URI.parse(uri).fsPath.replace(/\\/g, '/');
exports.uriToFileName = uriToFileName;
const fileNameToUri = (fileName) => vscode_uri_1.URI.file(fileName).toString();
exports.fileNameToUri = fileNameToUri;
function getConfiguration(settings, section) {
    if (section in settings) {
        return settings[section];
    }
    let result;
    for (const settingKey in settings) {
        if (settingKey.startsWith(`${section}.`)) {
            const value = settings[settingKey];
            const props = settingKey.substring(section.length + 1).split('.');
            result ??= {};
            let current = result;
            while (props.length > 1) {
                const prop = props.shift();
                if (typeof current[prop] !== 'object') {
                    current[prop] = {};
                }
                current = current[prop];
            }
            current[props.shift()] = value;
        }
    }
    return result;
}
exports.getConfiguration = getConfiguration;
exports.fs = {
    stat(uri) {
        if (uri.startsWith('file://')) {
            try {
                const stats = _fs.statSync((0, exports.uriToFileName)(uri), { throwIfNoEntry: false });
                if (stats) {
                    return {
                        type: stats.isFile() ? language_service_1.FileType.File
                            : stats.isDirectory() ? language_service_1.FileType.Directory
                                : stats.isSymbolicLink() ? language_service_1.FileType.SymbolicLink
                                    : language_service_1.FileType.Unknown,
                        ctime: stats.ctimeMs,
                        mtime: stats.mtimeMs,
                        size: stats.size,
                    };
                }
            }
            catch {
                return undefined;
            }
        }
    },
    readFile(uri, encoding) {
        if (uri.startsWith('file://')) {
            try {
                return _fs.readFileSync((0, exports.uriToFileName)(uri), { encoding: encoding ?? 'utf-8' });
            }
            catch {
                return undefined;
            }
        }
    },
    readDirectory(uri) {
        if (uri.startsWith('file://')) {
            try {
                const dirName = (0, exports.uriToFileName)(uri);
                const files = _fs.readdirSync(dirName, { withFileTypes: true });
                return files.map(file => {
                    return [file.name, file.isFile() ? language_service_1.FileType.File
                            : file.isDirectory() ? language_service_1.FileType.Directory
                                : file.isSymbolicLink() ? language_service_1.FileType.SymbolicLink
                                    : language_service_1.FileType.Unknown];
                });
            }
            catch {
                return [];
            }
        }
        return [];
    },
};
//# sourceMappingURL=utils.js.map