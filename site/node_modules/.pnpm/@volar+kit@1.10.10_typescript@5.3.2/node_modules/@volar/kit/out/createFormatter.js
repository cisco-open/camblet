"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormatter = void 0;
const language_service_1 = require("@volar/language-service");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const vscode_uri_1 = require("vscode-uri");
const utils_1 = require("./utils");
function createFormatter(config, compilerOptions = utils_1.defaultCompilerOptions) {
    const ts = require('typescript');
    let settings = {};
    let dummyScriptUri = 'file:///dummy.txt';
    let fakeScriptFileName = '/dummy.txt';
    let fakeScriptSnapshot = ts.ScriptSnapshot.fromString('');
    let fakeScriptLanguageId;
    const service = (0, language_service_1.createLanguageService)({ typescript: ts }, {
        workspaceUri: vscode_uri_1.URI.file('/'),
        rootUri: vscode_uri_1.URI.file('/'),
        uriToFileName: uri => {
            if (uri.startsWith(dummyScriptUri))
                return uri.replace(dummyScriptUri, fakeScriptFileName);
            return (0, utils_1.uriToFileName)(uri);
        },
        fileNameToUri: fileName => {
            if (fileName.startsWith(fakeScriptFileName))
                return fileName.replace(fakeScriptFileName, dummyScriptUri);
            return (0, utils_1.fileNameToUri)(fileName);
        },
        getConfiguration: section => (0, utils_1.getConfiguration)(settings, section),
        fs: utils_1.fs,
        console,
    }, config, createHost());
    return {
        formatFile,
        formatCode,
        get settings() {
            return settings;
        },
        set settings(newValue) {
            settings = newValue;
        },
    };
    async function formatFile(fileName, options) {
        fileName = (0, utils_1.asPosix)(fileName);
        const uri = (0, utils_1.fileNameToUri)(fileName);
        const document = service.context.getTextDocument(uri);
        if (!document)
            throw `file not found: ${fileName}`;
        const edits = await service.format(uri, options, undefined, undefined);
        if (edits?.length) {
            const newString = vscode_languageserver_textdocument_1.TextDocument.applyEdits(document, edits);
            return newString;
        }
        return document.getText();
    }
    async function formatCode(content, languageId, options) {
        fakeScriptSnapshot = ts.ScriptSnapshot.fromString(content);
        fakeScriptLanguageId = languageId;
        const document = service.context.getTextDocument(dummyScriptUri);
        const edits = await service.format(dummyScriptUri, options, undefined, undefined);
        if (edits?.length) {
            const newString = vscode_languageserver_textdocument_1.TextDocument.applyEdits(document, edits);
            return newString;
        }
        return content;
    }
    function createHost() {
        let projectVersion = 0;
        const host = {
            workspacePath: '/',
            rootPath: '/',
            getCompilationSettings: () => compilerOptions,
            getProjectVersion: () => (projectVersion++).toString(),
            getScriptFileNames: () => fakeScriptSnapshot ? [fakeScriptFileName] : [],
            getScriptSnapshot: (fileName) => {
                if (fileName === fakeScriptFileName) {
                    return fakeScriptSnapshot;
                }
            },
            getLanguageId: fileName => {
                if (fileName === fakeScriptFileName) {
                    return fakeScriptLanguageId;
                }
            },
        };
        return host;
    }
}
exports.createFormatter = createFormatter;
//# sourceMappingURL=createFormatter.js.map