"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortTsConfigs = exports.sleep = exports.createWorkspaces = exports.rootTsConfigNames = void 0;
const vscode = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const types_1 = require("../types");
const isFileInDir_1 = require("./utils/isFileInDir");
const path = require("path-browserify");
const project_1 = require("./project");
const inferredCompilerOptions_1 = require("./utils/inferredCompilerOptions");
const uriMap_1 = require("./utils/uriMap");
const language_service_1 = require("@volar/language-service");
exports.rootTsConfigNames = ['tsconfig.json', 'jsconfig.json'];
function createWorkspaces(context, rootUris) {
    const { fileNameToUri, uriToFileName, fs } = context.server.runtimeEnv;
    const configProjects = (0, uriMap_1.createUriMap)(fileNameToUri);
    const inferredProjects = (0, uriMap_1.createUriMap)(fileNameToUri);
    const rootTsConfigs = new Set();
    const searchedDirs = new Set();
    let semanticTokensReq = 0;
    let documentUpdatedReq = 0;
    context.workspaces.documents.onDidChangeContent(({ textDocument }) => {
        updateDiagnostics(textDocument.uri);
    });
    context.workspaces.documents.onDidClose(({ textDocument }) => {
        context.server.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
    });
    context.server.onDidChangeWatchedFiles(({ changes }) => {
        const tsConfigChanges = changes.filter(change => exports.rootTsConfigNames.includes(change.uri.substring(change.uri.lastIndexOf('/') + 1)));
        for (const change of tsConfigChanges) {
            if (change.type === vscode.FileChangeType.Created) {
                rootTsConfigs.add(uriToFileName(change.uri));
            }
            else if ((change.type === vscode.FileChangeType.Changed || change.type === vscode.FileChangeType.Deleted) && configProjects.uriHas(change.uri)) {
                if (change.type === vscode.FileChangeType.Deleted) {
                    rootTsConfigs.delete(uriToFileName(change.uri));
                }
                const project = configProjects.uriGet(change.uri);
                configProjects.uriDelete(change.uri);
                project?.then(project => project.dispose());
            }
        }
        if (tsConfigChanges.length) {
            reloadDiagnostics();
        }
        else {
            updateDiagnosticsAndSemanticTokens();
        }
    });
    context.server.configurationHost?.onDidChangeConfiguration?.(updateDiagnosticsAndSemanticTokens);
    return {
        configProjects,
        inferredProjects,
        getProject: getProjectAndTsConfig,
        reloadProjects: reloadProject,
        add: (rootUri) => {
            if (!rootUris.some(uri => uri.toString() === rootUri.toString())) {
                rootUris.push(rootUri);
            }
        },
        remove: (rootUri) => {
            rootUris = rootUris.filter(uri => uri.toString() !== rootUri.toString());
            for (const uri of configProjects.uriKeys()) {
                const project = configProjects.uriGet(uri);
                project.then(project => {
                    if (project.context.project.workspaceUri.toString() === rootUri.toString()) {
                        configProjects.uriDelete(uri);
                        project.dispose();
                    }
                });
            }
        },
    };
    async function reloadProject() {
        for (const project of [...configProjects.values(), ...inferredProjects.values()]) {
            project.then(project => project.dispose());
        }
        configProjects.clear();
        inferredProjects.clear();
        reloadDiagnostics();
    }
    function reloadDiagnostics() {
        for (const doc of context.workspaces.documents.data.values()) {
            context.server.connection.sendDiagnostics({ uri: doc.uri, diagnostics: [] });
        }
        updateDiagnosticsAndSemanticTokens();
    }
    async function updateDiagnosticsAndSemanticTokens() {
        const req = ++semanticTokensReq;
        await updateDiagnostics();
        const delay = 250;
        await sleep(delay);
        if (req === semanticTokensReq) {
            if (context.workspaces.initParams.capabilities.workspace?.semanticTokens?.refreshSupport) {
                context.server.connection.languages.semanticTokens.refresh();
            }
            if (context.workspaces.initParams.capabilities.workspace?.inlayHint?.refreshSupport) {
                context.server.connection.languages.inlayHint.refresh();
            }
            if ((context.workspaces.initOptions.diagnosticModel ?? types_1.DiagnosticModel.Push) === types_1.DiagnosticModel.Pull) {
                if (context.workspaces.initParams.capabilities.workspace?.diagnostics?.refreshSupport) {
                    context.server.connection.languages.diagnostics.refresh();
                }
            }
        }
    }
    async function updateDiagnostics(docUri) {
        if ((context.workspaces.initOptions.diagnosticModel ?? types_1.DiagnosticModel.Push) !== types_1.DiagnosticModel.Push)
            return;
        const req = ++documentUpdatedReq;
        const delay = 250;
        const cancel = context.server.runtimeEnv.getCancellationToken({
            get isCancellationRequested() {
                return req !== documentUpdatedReq;
            },
            onCancellationRequested: vscode.Event.None,
        });
        const changeDoc = docUri ? context.workspaces.documents.data.uriGet(docUri) : undefined;
        const otherDocs = [...context.workspaces.documents.data.values()].filter(doc => doc !== changeDoc);
        if (changeDoc) {
            await sleep(delay);
            if (cancel.isCancellationRequested) {
                return;
            }
            await sendDocumentDiagnostics(changeDoc.uri, changeDoc.version, cancel);
        }
        for (const doc of otherDocs) {
            await sleep(delay);
            if (cancel.isCancellationRequested) {
                break;
            }
            await sendDocumentDiagnostics(doc.uri, doc.version, cancel);
        }
    }
    async function sendDocumentDiagnostics(uri, version, cancel) {
        const project = (await getProjectAndTsConfig(uri))?.project;
        if (!project)
            return;
        // fix https://github.com/vuejs/language-tools/issues/2627
        if (context.workspaces.initOptions.serverMode === types_1.ServerMode.Syntactic) {
            return;
        }
        // const mode = context.initOptions.serverMode === ServerMode.PartialSemantic ? 'semantic' as const
        // 	: context.initOptions.serverMode === ServerMode.Syntactic ? 'syntactic' as const
        // 		: 'all' as const;
        const languageService = project.getLanguageService();
        const errors = await languageService.doValidation(uri, 'all', cancel, result => {
            context.server.connection.sendDiagnostics({ uri: uri, diagnostics: result, version });
        });
        context.server.connection.sendDiagnostics({ uri: uri, diagnostics: errors, version });
    }
    async function getProjectAndTsConfig(uri) {
        if (context.workspaces.initOptions.serverMode !== types_1.ServerMode.Syntactic) {
            const tsconfig = await findMatchConfigs(vscode_uri_1.URI.parse(uri));
            if (tsconfig) {
                const project = await getProjectByCreate(tsconfig);
                return {
                    tsconfig: tsconfig,
                    project,
                };
            }
        }
        const workspaceUri = getWorkspaceUri(vscode_uri_1.URI.parse(uri));
        if (!inferredProjects.uriHas(workspaceUri.toString())) {
            inferredProjects.uriSet(workspaceUri.toString(), (async () => {
                const inferOptions = await (0, inferredCompilerOptions_1.getInferredCompilerOptions)(context.server.configurationHost);
                return (0, project_1.createProject)({
                    ...context,
                    project: {
                        workspaceUri,
                        rootUri: workspaceUri,
                        tsConfig: inferOptions,
                    },
                });
            })());
        }
        const project = await inferredProjects.uriGet(workspaceUri.toString());
        project.tryAddFile(uriToFileName(uri));
        return {
            tsconfig: undefined,
            project,
        };
    }
    function getWorkspaceUri(uri) {
        const fileName = uriToFileName(uri.toString());
        let _rootUris = [...rootUris]
            .filter(rootUri => (0, isFileInDir_1.isFileInDir)(fileName, uriToFileName(rootUri.toString())))
            .sort((a, b) => sortTsConfigs(fileName, uriToFileName(a.toString()), uriToFileName(b.toString())));
        if (!_rootUris.length) {
            _rootUris = [...rootUris];
        }
        if (!_rootUris.length) {
            _rootUris = [uri.with({ path: '/' })];
        }
        return _rootUris[0];
    }
    async function findMatchConfigs(uri) {
        const filePath = uriToFileName(uri.toString());
        let dir = path.dirname(filePath);
        while (true) {
            if (searchedDirs.has(dir)) {
                break;
            }
            searchedDirs.add(dir);
            for (const tsConfigName of exports.rootTsConfigNames) {
                const tsconfigPath = path.join(dir, tsConfigName);
                if ((await fs.stat?.(fileNameToUri(tsconfigPath)))?.type === language_service_1.FileType.File) {
                    rootTsConfigs.add(tsconfigPath);
                }
            }
            dir = path.dirname(dir);
        }
        await prepareClosestootParsedCommandLine();
        return await findDirectIncludeTsconfig() ?? await findIndirectReferenceTsconfig();
        async function prepareClosestootParsedCommandLine() {
            let matches = [];
            for (const rootTsConfig of rootTsConfigs) {
                if ((0, isFileInDir_1.isFileInDir)(uriToFileName(uri.toString()), path.dirname(rootTsConfig))) {
                    matches.push(rootTsConfig);
                }
            }
            matches = matches.sort((a, b) => sortTsConfigs(uriToFileName(uri.toString()), a, b));
            if (matches.length) {
                await getParsedCommandLine(matches[0]);
            }
        }
        function findIndirectReferenceTsconfig() {
            return findTsconfig(async (tsconfig) => {
                const project = await configProjects.pathGet(tsconfig);
                return project?.askedFiles.uriHas(uri.toString()) ?? false;
            });
        }
        function findDirectIncludeTsconfig() {
            return findTsconfig(async (tsconfig) => {
                const map = (0, uriMap_1.createUriMap)(fileNameToUri);
                const parsedCommandLine = await getParsedCommandLine(tsconfig);
                for (const fileName of parsedCommandLine?.fileNames ?? []) {
                    map.pathSet(fileName, true);
                }
                return map.uriHas(uri.toString());
            });
        }
        async function findTsconfig(match) {
            const checked = new Set();
            for (const rootTsConfig of [...rootTsConfigs].sort((a, b) => sortTsConfigs(uriToFileName(uri.toString()), a, b))) {
                const project = await configProjects.pathGet(rootTsConfig);
                if (project) {
                    let chains = await getReferencesChains(project.getParsedCommandLine(), rootTsConfig, []);
                    if (context.workspaces.initOptions.reverseConfigFilePriority) {
                        chains = chains.reverse();
                    }
                    for (const chain of chains) {
                        for (let i = chain.length - 1; i >= 0; i--) {
                            const tsconfig = chain[i];
                            if (checked.has(tsconfig))
                                continue;
                            checked.add(tsconfig);
                            if (await match(tsconfig)) {
                                return tsconfig;
                            }
                        }
                    }
                }
            }
        }
        async function getReferencesChains(parsedCommandLine, tsConfig, before) {
            if (parsedCommandLine.projectReferences?.length) {
                const newChains = [];
                for (const projectReference of parsedCommandLine.projectReferences) {
                    let tsConfigPath = projectReference.path.replace(/\\/g, '/');
                    // fix https://github.com/johnsoncodehk/volar/issues/712
                    if ((await fs.stat?.(fileNameToUri(tsConfigPath)))?.type === language_service_1.FileType.File) {
                        const newTsConfigPath = path.join(tsConfigPath, 'tsconfig.json');
                        const newJsConfigPath = path.join(tsConfigPath, 'jsconfig.json');
                        if ((await fs.stat?.(fileNameToUri(newTsConfigPath)))?.type === language_service_1.FileType.File) {
                            tsConfigPath = newTsConfigPath;
                        }
                        else if ((await fs.stat?.(fileNameToUri(newJsConfigPath)))?.type === language_service_1.FileType.File) {
                            tsConfigPath = newJsConfigPath;
                        }
                    }
                    const beforeIndex = before.indexOf(tsConfigPath); // cycle
                    if (beforeIndex >= 0) {
                        newChains.push(before.slice(0, Math.max(beforeIndex, 1)));
                    }
                    else {
                        const referenceParsedCommandLine = await getParsedCommandLine(tsConfigPath);
                        if (referenceParsedCommandLine) {
                            for (const chain of await getReferencesChains(referenceParsedCommandLine, tsConfigPath, [...before, tsConfig])) {
                                newChains.push(chain);
                            }
                        }
                    }
                }
                return newChains;
            }
            else {
                return [[...before, tsConfig]];
            }
        }
        async function getParsedCommandLine(tsConfig) {
            const project = await getProjectByCreate(tsConfig);
            return project?.getParsedCommandLine();
        }
    }
    function getProjectByCreate(_tsConfig) {
        const tsConfig = _tsConfig.replace(/\\/g, '/');
        let project = configProjects.pathGet(tsConfig);
        if (!project) {
            const rootUri = vscode_uri_1.URI.parse(fileNameToUri(path.dirname(tsConfig)));
            project = (0, project_1.createProject)({
                ...context,
                project: {
                    workspaceUri: getWorkspaceUri(rootUri),
                    rootUri: rootUri,
                    tsConfig,
                },
            });
            configProjects.pathSet(tsConfig, project);
        }
        return project;
    }
}
exports.createWorkspaces = createWorkspaces;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function sortTsConfigs(file, a, b) {
    const inA = (0, isFileInDir_1.isFileInDir)(file, path.dirname(a));
    const inB = (0, isFileInDir_1.isFileInDir)(file, path.dirname(b));
    if (inA !== inB) {
        const aWeight = inA ? 1 : 0;
        const bWeight = inB ? 1 : 0;
        return bWeight - aWeight;
    }
    const aLength = a.split('/').length;
    const bLength = b.split('/').length;
    if (aLength === bLength) {
        const aWeight = path.basename(a) === 'tsconfig.json' ? 1 : 0;
        const bWeight = path.basename(b) === 'tsconfig.json' ? 1 : 0;
        return bWeight - aWeight;
    }
    return bLength - aLength;
}
exports.sortTsConfigs = sortTsConfigs;
//# sourceMappingURL=workspaces.js.map