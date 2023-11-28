"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const semver = require("semver");
const shared_1 = require("./shared");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const _callHierarchy = require("./features/callHierarchy");
const codeActions = require("./features/codeAction");
const codeActionResolve = require("./features/codeActionResolve");
const completions = require("./features/completions/basic");
const directiveCommentCompletions = require("./features/completions/directiveComment");
const jsDocCompletions = require("./features/completions/jsDoc");
const completionResolve = require("./features/completions/resolve");
const definitions = require("./features/definition");
const diagnostics = require("./features/diagnostics");
const documentHighlight = require("./features/documentHighlight");
const documentSymbol = require("./features/documentSymbol");
const fileReferences = require("./features/fileReferences");
const fileRename = require("./features/fileRename");
const foldingRanges = require("./features/foldingRanges");
const formatting = require("./features/formatting");
const hover = require("./features/hover");
const implementation = require("./features/implementation");
const inlayHints = require("./features/inlayHints");
const prepareRename = require("./features/prepareRename");
const references = require("./features/references");
const rename = require("./features/rename");
const selectionRanges = require("./features/selectionRanges");
const semanticTokens = require("./features/semanticTokens");
const signatureHelp = require("./features/signatureHelp");
const typeDefinitions = require("./features/typeDefinition");
const workspaceSymbols = require("./features/workspaceSymbol");
const typescript_1 = require("@volar/typescript");
const tsFaster = require("typescript-auto-import-cache");
__exportStar(require("@volar/typescript"), exports);
;
const jsDocTriggerCharacter = '*';
const directiveCommentTriggerCharacter = '@';
const triggerCharacters = {
    triggerCharacters: [
        ...getBasicTriggerCharacters('4.3.0'),
        jsDocTriggerCharacter,
        directiveCommentTriggerCharacter,
    ],
    signatureHelpTriggerCharacters: ['(', ',', '<'],
    signatureHelpRetriggerCharacters: [')'],
    // https://github.com/microsoft/vscode/blob/ce119308e8fd4cd3f992d42b297588e7abe33a0c/extensions/typescript-language-features/src/languageFeatures/formatting.ts#L99
    autoFormatTriggerCharacters: [';', '}', '\n'],
};
function create() {
    return (contextOrNull, modules) => {
        if (!contextOrNull) {
            return triggerCharacters;
        }
        const context = contextOrNull;
        if (!modules?.typescript) {
            console.warn('[volar-service-typescript] context.typescript not found, volar-service-typescript is disabled. Make sure you have provide tsdk in language client.');
            return {};
        }
        const ts = modules.typescript;
        const sys = (0, typescript_1.createSys)(ts, context.env);
        const languageServiceHost = (0, typescript_1.createLanguageServiceHost)(context, ts, sys);
        const created = tsFaster.createLanguageService(ts, sys, languageServiceHost, proxiedHost => ts.createLanguageService(proxiedHost, (0, typescript_1.getDocumentRegistry)(ts, sys.useCaseSensitiveFileNames, context.host.workspacePath)));
        const { languageService } = created;
        if (created.setPreferences && context.env.getConfiguration) {
            updatePreferences();
            context.env.onDidChangeConfiguration?.(updatePreferences);
            async function updatePreferences() {
                const preferences = await context.env.getConfiguration?.('typescript.preferences');
                if (preferences) {
                    created.setPreferences?.(preferences);
                }
            }
        }
        if (created.projectUpdated) {
            let scriptFileNames = new Set(context.host.getScriptFileNames());
            context.env.onDidChangeWatchedFiles?.((params) => {
                if (params.changes.some(change => change.type !== 2)) {
                    scriptFileNames = new Set(context.host.getScriptFileNames());
                }
                for (const change of params.changes) {
                    if (scriptFileNames.has(context.env.uriToFileName(change.uri))) {
                        created.projectUpdated?.(context.env.uriToFileName(context.env.rootUri.fsPath));
                    }
                }
            });
        }
        const basicTriggerCharacters = getBasicTriggerCharacters(ts.version);
        const documents = new WeakMap();
        const semanticCtx = {
            ...context,
            typescript: {
                languageServiceHost,
                languageService,
            },
            ts,
            getTextDocument(uri) {
                const document = context.getTextDocument(uri);
                if (document) {
                    return document;
                }
                const snapshot = languageServiceHost.getScriptSnapshot(context.env.uriToFileName(uri));
                if (snapshot) {
                    let document = documents.get(snapshot);
                    if (!document) {
                        document = vscode_languageserver_textdocument_1.TextDocument.create(uri, '', 0, snapshot.getText(0, snapshot.getLength()));
                        documents.set(snapshot, document);
                    }
                    return document;
                }
            },
        };
        const findDefinition = definitions.register(semanticCtx);
        const findTypeDefinition = typeDefinitions.register(semanticCtx);
        const findReferences = references.register(semanticCtx);
        const findFileReferences = fileReferences.register(semanticCtx);
        const findImplementations = implementation.register(semanticCtx);
        const doPrepareRename = prepareRename.register(semanticCtx);
        const doRename = rename.register(semanticCtx);
        const getEditsForFileRename = fileRename.register(semanticCtx);
        const getCodeActions = codeActions.register(semanticCtx);
        const doCodeActionResolve = codeActionResolve.register(semanticCtx);
        const getInlayHints = inlayHints.register(semanticCtx);
        const findDocumentHighlights = documentHighlight.register(semanticCtx);
        const findWorkspaceSymbols = workspaceSymbols.register(semanticCtx);
        const doComplete = completions.register(semanticCtx);
        const doCompletionResolve = completionResolve.register(semanticCtx);
        const doDirectiveCommentComplete = directiveCommentCompletions.register(semanticCtx);
        const doJsDocComplete = jsDocCompletions.register(semanticCtx);
        const doHover = hover.register(semanticCtx);
        const getSignatureHelp = signatureHelp.register(semanticCtx);
        const getSelectionRanges = selectionRanges.register(semanticCtx);
        const doValidation = diagnostics.register(semanticCtx);
        const getDocumentSemanticTokens = semanticTokens.register(semanticCtx);
        const callHierarchy = _callHierarchy.register(semanticCtx);
        let syntacticHostCtx = {
            projectVersion: 0,
            document: undefined,
            fileName: '',
            fileVersion: 0,
            snapshot: ts.ScriptSnapshot.fromString(''),
        };
        const syntacticServiceHost = {
            getProjectVersion: () => syntacticHostCtx.projectVersion.toString(),
            getScriptFileNames: () => [syntacticHostCtx.fileName],
            getScriptVersion: fileName => fileName === syntacticHostCtx.fileName ? syntacticHostCtx.fileVersion.toString() : '',
            getScriptSnapshot: fileName => fileName === syntacticHostCtx.fileName ? syntacticHostCtx.snapshot : undefined,
            getCompilationSettings: () => languageServiceHost.getCompilationSettings() ?? {},
            getCurrentDirectory: () => '/',
            getDefaultLibFileName: () => '',
            readFile: () => undefined,
            fileExists: fileName => fileName === syntacticHostCtx.fileName,
        };
        const syntacticCtx = {
            ...semanticCtx,
            typescript: {
                ...semanticCtx.typescript,
                languageServiceHost: syntacticServiceHost,
                languageService: ts.createLanguageService(syntacticServiceHost),
            },
        };
        const findDocumentSymbols = documentSymbol.register(syntacticCtx);
        const doFormatting = formatting.register(syntacticCtx);
        const getFoldingRanges = foldingRanges.register(syntacticCtx);
        return {
            dispose() {
                languageService.dispose();
                sys.dispose();
            },
            provide: {
                'typescript/typescript': () => ts,
                'typescript/sys': () => sys,
                'typescript/sourceFile': document => {
                    if ((0, shared_1.isTsDocument)(document)) {
                        const sourceFile = getSemanticServiceSourceFile(document.uri);
                        if (sourceFile) {
                            return sourceFile;
                        }
                        prepareSyntacticService(document);
                        return syntacticCtx.typescript.languageService.getProgram()?.getSourceFile(syntacticHostCtx.fileName);
                    }
                },
                'typescript/textDocument': semanticCtx.getTextDocument,
                'typescript/languageService': document => {
                    if (!document || getSemanticServiceSourceFile(document.uri)) {
                        return semanticCtx.typescript.languageService;
                    }
                    prepareSyntacticService(document);
                    return syntacticCtx.typescript.languageService;
                },
                'typescript/syntacticLanguageService': () => {
                    return syntacticCtx.typescript.languageService;
                },
                'typescript/languageServiceHost': document => {
                    if (!document || getSemanticServiceSourceFile(document.uri)) {
                        return semanticCtx.typescript.languageServiceHost;
                    }
                    prepareSyntacticService(document);
                    return syntacticCtx.typescript.languageServiceHost;
                },
                'typescript/syntacticLanguageServiceHost': () => {
                    return syntacticCtx.typescript.languageServiceHost;
                },
            },
            ...triggerCharacters,
            triggerCharacters: [
                ...basicTriggerCharacters,
                jsDocTriggerCharacter,
                directiveCommentTriggerCharacter,
            ],
            provideAutoInsertionEdit(document, position, ctx) {
                if ((document.languageId === 'javascriptreact' || document.languageId === 'typescriptreact')
                    && ctx.lastChange.text.endsWith('>')) {
                    const configName = document.languageId === 'javascriptreact' ? 'javascript.autoClosingTags' : 'typescript.autoClosingTags';
                    const config = context.env.getConfiguration?.(configName) ?? true;
                    if (config) {
                        prepareSyntacticService(document);
                        const close = syntacticCtx.typescript.languageService.getJsxClosingTagAtPosition(context.env.uriToFileName(document.uri), document.offsetAt(position));
                        if (close) {
                            return '$0' + close.newText;
                        }
                    }
                }
            },
            provideCompletionItems(document, position, context, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, async () => {
                    let result = {
                        isIncomplete: false,
                        items: [],
                    };
                    if (!context || context.triggerKind !== 2 || (context.triggerCharacter && basicTriggerCharacters.includes(context.triggerCharacter))) {
                        const completeOptions = {
                            triggerCharacter: context?.triggerCharacter,
                            triggerKind: context?.triggerKind,
                        };
                        const basicResult = await doComplete(document.uri, position, completeOptions);
                        if (basicResult) {
                            result = basicResult;
                        }
                    }
                    if (!context || context.triggerKind !== 2 || context.triggerCharacter === jsDocTriggerCharacter) {
                        const jsdocResult = await doJsDocComplete(document.uri, position);
                        if (jsdocResult) {
                            result.items.push(jsdocResult);
                        }
                    }
                    if (!context || context.triggerKind !== 2 || context.triggerCharacter === directiveCommentTriggerCharacter) {
                        const directiveCommentResult = await doDirectiveCommentComplete(document.uri, position);
                        if (directiveCommentResult) {
                            result.items = result.items.concat(directiveCommentResult);
                        }
                    }
                    return result;
                });
            },
            resolveCompletionItem(item, token) {
                return worker(token, () => {
                    return doCompletionResolve(item);
                });
            },
            provideRenameRange(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return doPrepareRename(document.uri, position);
                });
            },
            provideRenameEdits(document, position, newName, token) {
                if (!(0, shared_1.isTsDocument)(document) && !(0, shared_1.isJsonDocument)(document))
                    return;
                return worker(token, () => {
                    return doRename(document.uri, position, newName);
                });
            },
            provideCodeActions(document, range, context, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return getCodeActions(document.uri, range, context);
                });
            },
            resolveCodeAction(codeAction, token) {
                return worker(token, () => {
                    return doCodeActionResolve(codeAction);
                });
            },
            provideInlayHints(document, range, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return getInlayHints(document.uri, range);
                });
            },
            provideCallHierarchyItems(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return callHierarchy.doPrepare(document.uri, position);
                });
            },
            provideCallHierarchyIncomingCalls(item, token) {
                return worker(token, () => {
                    return callHierarchy.getIncomingCalls(item);
                });
            },
            provideCallHierarchyOutgoingCalls(item, token) {
                return worker(token, () => {
                    return callHierarchy.getOutgoingCalls(item);
                });
            },
            provideDefinition(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return findDefinition(document.uri, position);
                });
            },
            provideTypeDefinition(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return findTypeDefinition(document.uri, position);
                });
            },
            provideDiagnostics(document, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return doValidation(document.uri, { syntactic: true, suggestion: true });
                });
            },
            provideSemanticDiagnostics(document, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return doValidation(document.uri, { semantic: true, declaration: true });
                });
            },
            provideHover(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return doHover(document.uri, position);
                });
            },
            provideImplementation(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return findImplementations(document.uri, position);
                });
            },
            provideReferences(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document) && !(0, shared_1.isJsonDocument)(document))
                    return;
                return worker(token, () => {
                    return findReferences(document.uri, position);
                });
            },
            provideFileReferences(document, token) {
                if (!(0, shared_1.isTsDocument)(document) && !(0, shared_1.isJsonDocument)(document))
                    return;
                return worker(token, () => {
                    return findFileReferences(document.uri);
                });
            },
            provideDocumentHighlights(document, position, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return findDocumentHighlights(document.uri, position);
                });
            },
            provideDocumentSymbols(document) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                prepareSyntacticService(document);
                return findDocumentSymbols(document.uri);
            },
            provideDocumentSemanticTokens(document, range, legend, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return getDocumentSemanticTokens(document.uri, range, legend);
                });
            },
            provideWorkspaceSymbols(query, token) {
                return worker(token, () => {
                    return findWorkspaceSymbols(query);
                });
            },
            provideFileRenameEdits(oldUri, newUri, token) {
                return worker(token, () => {
                    return getEditsForFileRename(oldUri, newUri);
                });
            },
            provideFoldingRanges(document) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                prepareSyntacticService(document);
                return getFoldingRanges(document.uri);
            },
            provideSelectionRanges(document, positions, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return getSelectionRanges(document.uri, positions);
                });
            },
            provideSignatureHelp(document, position, context, token) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                return worker(token, () => {
                    return getSignatureHelp(document.uri, position, context);
                });
            },
            async provideDocumentFormattingEdits(document, range, options_2) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                const enable = await context.env.getConfiguration?.((0, shared_1.getConfigTitle)(document) + '.format.enable');
                if (enable === false) {
                    return;
                }
                prepareSyntacticService(document);
                return await doFormatting.onRange(document, range, options_2);
            },
            async provideOnTypeFormattingEdits(document, position, key, options_2) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                const enable = await context.env.getConfiguration?.((0, shared_1.getConfigTitle)(document) + '.format.enable');
                if (enable === false) {
                    return;
                }
                prepareSyntacticService(document);
                return doFormatting.onType(document, options_2, position, key);
            },
            provideFormattingIndentSensitiveLines(document) {
                if (!(0, shared_1.isTsDocument)(document))
                    return;
                prepareSyntacticService(document);
                const sourceFile = syntacticCtx.typescript.languageService.getProgram()?.getSourceFile(context.env.uriToFileName(document.uri));
                if (sourceFile) {
                    const lines = [];
                    sourceFile.forEachChild(function walk(node) {
                        if (node.kind === ts.SyntaxKind.FirstTemplateToken
                            || node.kind === ts.SyntaxKind.LastTemplateToken
                            || node.kind === ts.SyntaxKind.TemplateHead) {
                            const startLine = document.positionAt(node.getStart(sourceFile)).line;
                            const endLine = document.positionAt(node.getEnd()).line;
                            for (let i = startLine + 1; i <= endLine; i++) {
                                lines.push(i);
                            }
                        }
                        node.forEachChild(walk);
                    });
                    return lines;
                }
            },
        };
        async function worker(token, callback) {
            let oldSysVersion = sys.version;
            let result = await callback();
            let newSysVersion = await sys.sync();
            while (newSysVersion !== oldSysVersion && !token.isCancellationRequested) {
                oldSysVersion = newSysVersion;
                result = await callback();
                newSysVersion = await sys.sync();
            }
            return result;
        }
        function getSemanticServiceSourceFile(uri) {
            const sourceFile = semanticCtx.typescript.languageService.getProgram()?.getSourceFile(context.env.uriToFileName(uri));
            if (sourceFile) {
                return sourceFile;
            }
        }
        function prepareSyntacticService(document) {
            if (syntacticHostCtx.document === document && syntacticHostCtx.fileVersion === document.version) {
                return;
            }
            syntacticHostCtx.fileName = context.env.uriToFileName(document.uri);
            syntacticHostCtx.fileVersion = document.version;
            syntacticHostCtx.snapshot = ts.ScriptSnapshot.fromString(document.getText());
            syntacticHostCtx.projectVersion++;
        }
    };
}
exports.create = create;
exports.default = create;
function getBasicTriggerCharacters(tsVersion) {
    const triggerCharacters = ['.', '"', '\'', '`', '/', '<'];
    // https://github.com/microsoft/vscode/blob/8e65ae28d5fb8b3c931135da1a41edb9c80ae46f/extensions/typescript-language-features/src/languageFeatures/completions.ts#L811-L833
    if (semver.lt(tsVersion, '3.1.0') || semver.gte(tsVersion, '3.2.0')) {
        triggerCharacters.push('@');
    }
    if (semver.gte(tsVersion, '3.8.1')) {
        triggerCharacters.push('#');
    }
    if (semver.gte(tsVersion, '4.3.0')) {
        triggerCharacters.push(' ');
    }
    return triggerCharacters;
}
//# sourceMappingURL=index.js.map