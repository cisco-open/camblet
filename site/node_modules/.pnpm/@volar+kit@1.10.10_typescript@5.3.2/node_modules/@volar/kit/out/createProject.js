"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = exports.createInferredProject = void 0;
const path = require("typesafe-path/posix");
const utils_1 = require("./utils");
function createInferredProject(rootPath, getScriptFileNames, compilerOptions = utils_1.defaultCompilerOptions) {
    return createProjectBase(rootPath, () => ({
        options: compilerOptions,
        fileNames: getScriptFileNames().map(utils_1.asPosix),
    }));
}
exports.createInferredProject = createInferredProject;
function createProject(sourceTsconfigPath, extraFileExtensions = [], existingOptions) {
    const ts = require('typescript');
    const tsconfigPath = (0, utils_1.asPosix)(sourceTsconfigPath);
    return createProjectBase(path.dirname(tsconfigPath), () => {
        const parsed = ts.parseJsonSourceFileConfigFileContent(ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile), ts.sys, path.dirname(tsconfigPath), existingOptions, tsconfigPath, undefined, extraFileExtensions);
        parsed.fileNames = parsed.fileNames.map(utils_1.asPosix);
        return parsed;
    });
}
exports.createProject = createProject;
function createProjectBase(rootPath, createParsedCommandLine) {
    const ts = require('typescript');
    const languageHost = {
        workspacePath: rootPath,
        rootPath: rootPath,
        getCompilationSettings: () => {
            return parsedCommandLine.options;
        },
        getProjectVersion: () => {
            checkRootFilesUpdate();
            return projectVersion.toString();
        },
        getScriptFileNames: () => {
            checkRootFilesUpdate();
            return parsedCommandLine.fileNames;
        },
        getScriptSnapshot: (fileName) => {
            if (!scriptSnapshotsCache.has(fileName)) {
                const fileText = ts.sys.readFile(fileName, 'utf8');
                if (fileText !== undefined) {
                    scriptSnapshotsCache.set(fileName, ts.ScriptSnapshot.fromString(fileText));
                }
                else {
                    scriptSnapshotsCache.set(fileName, undefined);
                }
            }
            return scriptSnapshotsCache.get(fileName);
        },
    };
    let scriptSnapshotsCache = new Map();
    let parsedCommandLine = createParsedCommandLine();
    let projectVersion = 0;
    let shouldCheckRootFiles = false;
    return {
        languageHost,
        fileUpdated(fileName) {
            fileName = (0, utils_1.asPosix)(fileName);
            if (scriptSnapshotsCache.has(fileName)) {
                projectVersion++;
                scriptSnapshotsCache.delete(fileName);
            }
        },
        fileDeleted(fileName) {
            fileName = (0, utils_1.asPosix)(fileName);
            if (scriptSnapshotsCache.has(fileName)) {
                projectVersion++;
                scriptSnapshotsCache.delete(fileName);
                parsedCommandLine.fileNames = parsedCommandLine.fileNames.filter(name => name !== fileName);
            }
        },
        fileCreated(fileName) {
            fileName = (0, utils_1.asPosix)(fileName);
            shouldCheckRootFiles = true;
        },
        reload() {
            scriptSnapshotsCache.clear();
            projectVersion++;
            parsedCommandLine = createParsedCommandLine();
        },
    };
    function checkRootFilesUpdate() {
        if (!shouldCheckRootFiles)
            return;
        shouldCheckRootFiles = false;
        const newParsedCommandLine = createParsedCommandLine();
        if (newParsedCommandLine.fileNames.length !== parsedCommandLine.fileNames.length) {
            parsedCommandLine.fileNames = newParsedCommandLine.fileNames;
            projectVersion++;
        }
    }
}
//# sourceMappingURL=createProject.js.map