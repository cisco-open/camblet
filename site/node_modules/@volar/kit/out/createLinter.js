"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinter = void 0;
const language_service_1 = require("@volar/language-service");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const utils_1 = require("./utils");
const vscode_uri_1 = require("vscode-uri");
function createLinter(config, host) {
    let settings = {};
    const ts = require('typescript');
    const service = (0, language_service_1.createLanguageService)({ typescript: ts }, {
        uriToFileName: utils_1.uriToFileName,
        fileNameToUri: utils_1.fileNameToUri,
        workspaceUri: vscode_uri_1.URI.parse((0, utils_1.fileNameToUri)(host.workspacePath)),
        rootUri: vscode_uri_1.URI.parse((0, utils_1.fileNameToUri)(host.rootPath)),
        getConfiguration: section => (0, utils_1.getConfiguration)(settings, section),
        fs: utils_1.fs,
        console,
    }, config, host);
    return {
        check,
        fixErrors,
        printErrors,
        logErrors,
        get settings() {
            return settings;
        },
        set settings(newValue) {
            settings = newValue;
        },
    };
    function check(fileName) {
        fileName = (0, utils_1.asPosix)(fileName);
        const uri = (0, utils_1.fileNameToUri)(fileName);
        return service.doValidation(uri, 'all');
    }
    async function fixErrors(fileName, diagnostics, only, writeFile) {
        fileName = (0, utils_1.asPosix)(fileName);
        const uri = (0, utils_1.fileNameToUri)(fileName);
        const document = service.context.getTextDocument(uri);
        if (document) {
            const range = { start: document.positionAt(0), end: document.positionAt(document.getText().length) };
            const codeActions = await service.doCodeActions(uri, range, { diagnostics, only, triggerKind: 1 });
            if (codeActions) {
                for (let i = 0; i < codeActions.length; i++) {
                    codeActions[i] = await service.doCodeActionResolve(codeActions[i]);
                }
                const edits = codeActions.map(codeAction => codeAction.edit).filter((edit) => !!edit);
                if (edits.length) {
                    const rootEdit = edits[0];
                    (0, language_service_1.mergeWorkspaceEdits)(rootEdit, ...edits.slice(1));
                    for (const uri in rootEdit.changes ?? {}) {
                        const edits = rootEdit.changes[uri];
                        if (edits.length) {
                            const editDocument = service.context.getTextDocument(uri);
                            if (editDocument) {
                                const newString = vscode_languageserver_textdocument_1.TextDocument.applyEdits(editDocument, edits);
                                await writeFile((0, utils_1.uriToFileName)(uri), newString);
                            }
                        }
                    }
                    for (const change of rootEdit.documentChanges ?? []) {
                        if ('textDocument' in change) {
                            const editDocument = service.context.getTextDocument(change.textDocument.uri);
                            if (editDocument) {
                                const newString = vscode_languageserver_textdocument_1.TextDocument.applyEdits(editDocument, change.edits);
                                await writeFile((0, utils_1.uriToFileName)(change.textDocument.uri), newString);
                            }
                        }
                        // TODO: CreateFile | RenameFile | DeleteFile
                    }
                }
            }
        }
    }
    function printErrors(fileName, diagnostics, rootPath = process.cwd()) {
        let text = formatErrors(fileName, diagnostics, rootPath);
        for (const diagnostic of diagnostics) {
            text = text.replace(`TS${diagnostic.code}`, (diagnostic.source ?? '') + (diagnostic.code ? `(${diagnostic.code})` : ''));
        }
        return text;
    }
    /**
     * @deprecated please use `printErrors()` instead of
     */
    function logErrors(fileName, diagnostics, rootPath = process.cwd()) {
        console.log(printErrors(fileName, diagnostics, rootPath));
    }
    function formatErrors(fileName, diagnostics, rootPath) {
        fileName = (0, utils_1.asPosix)(fileName);
        const uri = (0, utils_1.fileNameToUri)(fileName);
        const document = service.context.getTextDocument(uri);
        const errors = diagnostics.map(diagnostic => ({
            category: diagnostic.severity === 1 ? ts.DiagnosticCategory.Error : ts.DiagnosticCategory.Warning,
            code: diagnostic.code,
            file: ts.createSourceFile(fileName, document.getText(), ts.ScriptTarget.JSON),
            start: document.offsetAt(diagnostic.range.start),
            length: document.offsetAt(diagnostic.range.end) - document.offsetAt(diagnostic.range.start),
            messageText: diagnostic.message,
        }));
        const text = ts.formatDiagnosticsWithColorAndContext(errors, {
            getCurrentDirectory: () => rootPath,
            getCanonicalFileName: (fileName) => ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
            getNewLine: () => ts.sys.newLine,
        });
        return text;
    }
}
exports.createLinter = createLinter;
//# sourceMappingURL=createLinter.js.map