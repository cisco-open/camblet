"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLanguageService = void 0;
const language_core_1 = require("@volar/language-core");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const documents_1 = require("./documents");
const autoInsert = require("./languageFeatures/autoInsert");
const callHierarchy = require("./languageFeatures/callHierarchy");
const codeActionResolve = require("./languageFeatures/codeActionResolve");
const codeActions = require("./languageFeatures/codeActions");
const codeLens = require("./languageFeatures/codeLens");
const codeLensResolve = require("./languageFeatures/codeLensResolve");
const completions = require("./languageFeatures/complete");
const completionResolve = require("./languageFeatures/completeResolve");
const definition = require("./languageFeatures/definition");
const documentHighlight = require("./languageFeatures/documentHighlights");
const documentLink = require("./languageFeatures/documentLinks");
const documentLinkResolve = require("./languageFeatures/documentLinkResolve");
const semanticTokens = require("./languageFeatures/documentSemanticTokens");
const fileReferences = require("./languageFeatures/fileReferences");
const fileRename = require("./languageFeatures/fileRename");
const hover = require("./languageFeatures/hover");
const inlayHints = require("./languageFeatures/inlayHints");
const inlayHintResolve = require("./languageFeatures/inlayHintResolve");
const references = require("./languageFeatures/references");
const rename = require("./languageFeatures/rename");
const renamePrepare = require("./languageFeatures/renamePrepare");
const signatureHelp = require("./languageFeatures/signatureHelp");
const diagnostics = require("./languageFeatures/validation");
const workspaceSymbol = require("./languageFeatures/workspaceSymbols");
const colorPresentations = require("./documentFeatures/colorPresentations");
const documentColors = require("./documentFeatures/documentColors");
const documentSymbols = require("./documentFeatures/documentSymbols");
const foldingRanges = require("./documentFeatures/foldingRanges");
const format = require("./documentFeatures/format");
const linkedEditingRanges = require("./documentFeatures/linkedEditingRanges");
const selectionRanges = require("./documentFeatures/selectionRanges");
const common_1 = require("./utils/common");
function createLanguageService(modules, env, config, languageHost) {
    if (languageHost.workspacePath.indexOf('\\') >= 0 || languageHost.rootPath.indexOf('\\') >= 0) {
        throw new Error('Volar: Current directory must be posix style.');
    }
    if (languageHost.getScriptFileNames().some(fileName => fileName.indexOf('\\') >= 0)) {
        throw new Error('Volar: Script file names must be posix style.');
    }
    const languageContext = (0, language_core_1.createLanguageContext)(languageHost, Object.values(config.languages ?? {}).filter(common_1.notEmpty));
    const context = createLanguageServicePluginContext(modules, env, config, languageHost, languageContext);
    return createLanguageServiceBase(context);
}
exports.createLanguageService = createLanguageService;
function createLanguageServicePluginContext(modules, env, config, host, languageContext) {
    const textDocumentMapper = (0, documents_1.createDocumentsAndSourceMaps)(env, host, languageContext.virtualFiles);
    const documents = new WeakMap();
    const documentVersions = new Map();
    const context = {
        ...languageContext,
        env,
        inject: (key, ...args) => {
            for (const service of Object.values(context.services)) {
                const provide = service.provide?.[key];
                if (provide) {
                    return provide(...args);
                }
            }
            throw `No service provide ${key}`;
        },
        rules: config.rules ?? {},
        services: {},
        documents: textDocumentMapper,
        commands: {
            rename: {
                create(uri, position) {
                    const source = toSourceLocation(uri, position, data => typeof data.rename === 'object' ? !!data.rename.normalize : !!data.rename);
                    if (!source) {
                        return;
                    }
                    return {
                        title: '',
                        command: 'editor.action.rename',
                        arguments: [
                            source.uri,
                            source.position,
                        ],
                    };
                },
                is(command) {
                    return command.command === 'editor.action.rename';
                },
            },
            showReferences: {
                create(uri, position, locations) {
                    const source = toSourceLocation(uri, position);
                    if (!source) {
                        return;
                    }
                    const sourceReferences = [];
                    for (const reference of locations) {
                        if (context.documents.isVirtualFileUri(reference.uri)) {
                            for (const [_, map] of context.documents.getMapsByVirtualFileUri(reference.uri)) {
                                const range = map.toSourceRange(reference.range);
                                if (range) {
                                    sourceReferences.push({ uri: map.sourceFileDocument.uri, range });
                                }
                            }
                        }
                        else {
                            sourceReferences.push(reference);
                        }
                    }
                    return {
                        title: locations.length === 1 ? '1 reference' : `${locations.length} references`,
                        command: 'editor.action.showReferences',
                        arguments: [
                            source.uri,
                            source.position,
                            sourceReferences,
                        ],
                    };
                },
                is(command) {
                    return command.command === 'editor.action.showReferences';
                },
            },
            setSelection: {
                create(position) {
                    return {
                        title: '',
                        command: 'setSelection',
                        arguments: [{
                                selection: {
                                    selectionStartLineNumber: position.line + 1,
                                    positionLineNumber: position.line + 1,
                                    selectionStartColumn: position.character + 1,
                                    positionColumn: position.character + 1,
                                },
                            }],
                    };
                },
                is(command) {
                    return command.command === 'setSelection';
                }
            },
        },
        getTextDocument,
    };
    for (const serviceId in config.services ?? {}) {
        const service = config.services?.[serviceId];
        if (service) {
            context.services[serviceId] = service(context, modules);
        }
    }
    return context;
    function toSourceLocation(uri, position, filter) {
        if (!textDocumentMapper.isVirtualFileUri(uri)) {
            return { uri, position };
        }
        const map = textDocumentMapper.getVirtualFileByUri(uri);
        if (map) {
            for (const [_, map] of context.documents.getMapsByVirtualFileUri(uri)) {
                const sourcePosition = map.toSourcePosition(position, filter);
                if (sourcePosition) {
                    return {
                        uri: map.sourceFileDocument.uri,
                        position: sourcePosition,
                    };
                }
            }
        }
    }
    function getTextDocument(uri) {
        for (const [_, map] of context.documents.getMapsByVirtualFileUri(uri)) {
            return map.virtualFileDocument;
        }
        const fileName = env.uriToFileName(uri);
        const scriptSnapshot = host.getScriptSnapshot(fileName);
        if (scriptSnapshot) {
            let document = documents.get(scriptSnapshot);
            if (!document) {
                const newVersion = (documentVersions.get(uri.toLowerCase()) ?? 0) + 1;
                documentVersions.set(uri.toLowerCase(), newVersion);
                document = vscode_languageserver_textdocument_1.TextDocument.create(uri, host.getLanguageId?.(fileName) ?? (0, common_1.resolveCommonLanguageId)(uri), newVersion, scriptSnapshot.getText(0, scriptSnapshot.getLength()));
                documents.set(scriptSnapshot, document);
            }
            return document;
        }
    }
}
function createLanguageServiceBase(context) {
    return {
        getTriggerCharacters: () => Object.values(context.services).map(service => service?.triggerCharacters ?? []).flat(),
        getAutoFormatTriggerCharacters: () => Object.values(context.services).map(service => service?.autoFormatTriggerCharacters ?? []).flat(),
        getSignatureHelpTriggerCharacters: () => Object.values(context.services).map(service => service?.signatureHelpTriggerCharacters ?? []).flat(),
        getSignatureHelpRetriggerCharacters: () => Object.values(context.services).map(service => service?.signatureHelpRetriggerCharacters ?? []).flat(),
        format: format.register(context),
        getFoldingRanges: foldingRanges.register(context),
        getSelectionRanges: selectionRanges.register(context),
        findLinkedEditingRanges: linkedEditingRanges.register(context),
        findDocumentSymbols: documentSymbols.register(context),
        findDocumentColors: documentColors.register(context),
        getColorPresentations: colorPresentations.register(context),
        doValidation: diagnostics.register(context),
        findReferences: references.register(context),
        findFileReferences: fileReferences.register(context),
        findDefinition: definition.register(context, 'provideDefinition', data => !!data.definition, data => !!data.definition),
        findTypeDefinition: definition.register(context, 'provideTypeDefinition', data => !!data.definition, data => !!data.definition),
        findImplementations: definition.register(context, 'provideImplementation', data => !!data.references, () => false),
        prepareRename: renamePrepare.register(context),
        doRename: rename.register(context),
        getEditsForFileRename: fileRename.register(context),
        getSemanticTokens: semanticTokens.register(context),
        doHover: hover.register(context),
        doComplete: completions.register(context),
        doCodeActions: codeActions.register(context),
        doCodeActionResolve: codeActionResolve.register(context),
        doCompletionResolve: completionResolve.register(context),
        getSignatureHelp: signatureHelp.register(context),
        doCodeLens: codeLens.register(context),
        doCodeLensResolve: codeLensResolve.register(context),
        findDocumentHighlights: documentHighlight.register(context),
        findDocumentLinks: documentLink.register(context),
        doDocumentLinkResolve: documentLinkResolve.register(context),
        findWorkspaceSymbols: workspaceSymbol.register(context),
        doAutoInsert: autoInsert.register(context),
        getInlayHints: inlayHints.register(context),
        doInlayHintResolve: inlayHintResolve.register(context),
        callHierarchy: callHierarchy.register(context),
        dispose: () => Object.values(context.services).forEach(service => service.dispose?.()),
        context,
    };
}
//# sourceMappingURL=baseLanguageService.js.map