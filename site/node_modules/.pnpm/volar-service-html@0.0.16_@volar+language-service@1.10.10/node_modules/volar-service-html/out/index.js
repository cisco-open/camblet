"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.getHtmlDocument = void 0;
const html = require("vscode-html-languageservice");
const vscode_uri_1 = require("vscode-uri");
const parserLs = html.getLanguageService();
const htmlDocuments = new WeakMap();
function getHtmlDocument(document) {
    const cache = htmlDocuments.get(document);
    if (cache) {
        const [cacheVersion, cacheDoc] = cache;
        if (cacheVersion === document.version) {
            return cacheDoc;
        }
    }
    const doc = parserLs.parseHTMLDocument(document);
    htmlDocuments.set(document, [document.version, doc]);
    return doc;
}
exports.getHtmlDocument = getHtmlDocument;
// https://github.com/microsoft/vscode/blob/09850876e652688fb142e2e19fd00fd38c0bc4ba/extensions/html-language-features/server/src/htmlServer.ts#L183
const triggerCharacters = ['.', ':', '<', '"', '=', '/'];
function create({ languageId = 'html', useDefaultDataProvider = true, useCustomDataProviders = true, } = {}) {
    return (context) => {
        if (!context) {
            return { triggerCharacters };
        }
        let shouldUpdateCustomData = true;
        let customData = [];
        let extraData = [];
        const fileSystemProvider = {
            stat: async (uri) => await context.env.fs?.stat(uri) ?? {
                type: html.FileType.Unknown,
                ctime: 0,
                mtime: 0,
                size: 0,
            },
            readDirectory: async (uri) => context.env.fs?.readDirectory(uri) ?? [],
        };
        const documentContext = {
            resolveReference(ref, base) {
                if (ref.match(/^\w[\w\d+.-]*:/)) {
                    // starts with a schema
                    return ref;
                }
                if (ref[0] === '/') { // resolve absolute path against the current workspace folder
                    return base + ref;
                }
                const baseUri = vscode_uri_1.URI.parse(base);
                const baseUriDir = baseUri.path.endsWith('/') ? baseUri : vscode_uri_1.Utils.dirname(baseUri);
                return vscode_uri_1.Utils.resolvePath(baseUriDir, ref).toString(true);
            },
        };
        const htmlLs = html.getLanguageService({
            fileSystemProvider,
            clientCapabilities: context.env.clientCapabilities,
        });
        context.env.onDidChangeConfiguration?.(() => {
            shouldUpdateCustomData = true;
        });
        return {
            provide: {
                'html/htmlDocument': (document) => {
                    if (document.languageId === languageId) {
                        return getHtmlDocument(document);
                    }
                },
                'html/languageService': () => htmlLs,
                'html/documentContext': () => documentContext,
                'html/updateCustomData': updateExtraCustomData,
            },
            triggerCharacters,
            async provideCompletionItems(document, position) {
                return worker(document, async (htmlDocument) => {
                    const configs = await context.env.getConfiguration?.('html.completion');
                    return htmlLs.doComplete2(document, position, htmlDocument, documentContext, configs);
                });
            },
            provideRenameRange(document, position) {
                return worker(document, (htmlDocument) => {
                    const offset = document.offsetAt(position);
                    return htmlLs
                        .findDocumentHighlights(document, position, htmlDocument)
                        ?.find(h => offset >= document.offsetAt(h.range.start) && offset <= document.offsetAt(h.range.end))
                        ?.range;
                });
            },
            provideRenameEdits(document, position, newName) {
                return worker(document, (htmlDocument) => {
                    return htmlLs.doRename(document, position, newName, htmlDocument);
                });
            },
            async provideHover(document, position) {
                return worker(document, async (htmlDocument) => {
                    const hoverSettings = await context.env.getConfiguration?.('html.hover');
                    return htmlLs.doHover(document, position, htmlDocument, hoverSettings);
                });
            },
            provideDocumentHighlights(document, position) {
                return worker(document, (htmlDocument) => {
                    return htmlLs.findDocumentHighlights(document, position, htmlDocument);
                });
            },
            provideDocumentLinks(document) {
                return worker(document, () => {
                    return htmlLs.findDocumentLinks(document, documentContext);
                });
            },
            provideDocumentSymbols(document) {
                return worker(document, (htmlDocument) => {
                    return htmlLs.findDocumentSymbols2(document, htmlDocument);
                });
            },
            provideFoldingRanges(document) {
                return worker(document, () => {
                    return htmlLs.getFoldingRanges(document);
                });
            },
            provideSelectionRanges(document, positions) {
                return worker(document, () => {
                    return htmlLs.getSelectionRanges(document, positions);
                });
            },
            async provideDocumentFormattingEdits(document, formatRange, options) {
                return worker(document, async () => {
                    const options_2 = await context.env.getConfiguration?.('html.format');
                    if (options_2?.enable === false) {
                        return;
                    }
                    { // https://github.com/microsoft/vscode/blob/dce493cb6e36346ef2714e82c42ce14fc461b15c/extensions/html-language-features/server/src/modes/formatting.ts#L13-L23
                        const endPos = formatRange.end;
                        let endOffset = document.offsetAt(endPos);
                        const content = document.getText();
                        if (endPos.character === 0 && endPos.line > 0 && endOffset !== content.length) {
                            // if selection ends after a new line, exclude that new line
                            const prevLineStart = document.offsetAt({ line: endPos.line - 1, character: 0 });
                            while (isEOL(content, endOffset - 1) && endOffset > prevLineStart) {
                                endOffset--;
                            }
                            formatRange = {
                                start: formatRange.start,
                                end: document.positionAt(endOffset),
                            };
                        }
                    }
                    return htmlLs.format(document, formatRange, {
                        ...options_2,
                        ...options,
                    });
                });
            },
            provideFormattingIndentSensitiveLines(document) {
                return worker(document, (htmlDocument) => {
                    const lines = [];
                    /**
                     * comments
                     */
                    const scanner = htmlLs.createScanner(document.getText());
                    let token = scanner.scan();
                    let startCommentTagLine;
                    while (token !== html.TokenType.EOS) {
                        if (token === html.TokenType.StartCommentTag) {
                            startCommentTagLine = document.positionAt(scanner.getTokenOffset()).line;
                        }
                        else if (token === html.TokenType.EndCommentTag) {
                            const line = document.positionAt(scanner.getTokenOffset()).line;
                            for (let i = startCommentTagLine + 1; i <= line; i++) {
                                lines.push(i);
                            }
                            startCommentTagLine = undefined;
                        }
                        else if (token === html.TokenType.AttributeValue) {
                            const startLine = document.positionAt(scanner.getTokenOffset()).line;
                            for (let i = 1; i < scanner.getTokenText().split('\n').length; i++) {
                                lines.push(startLine + i);
                            }
                        }
                        token = scanner.scan();
                    }
                    /**
                     * tags
                     */
                    // https://github.com/beautify-web/js-beautify/blob/686f8c1b265990908ece86ce39291733c75c997c/js/src/html/options.js#L81
                    const indentSensitiveTags = new Set(['pre', 'textarea']);
                    htmlDocument.roots.forEach(function visit(node) {
                        if (node.tag !== undefined
                            && node.startTagEnd !== undefined
                            && node.endTagStart !== undefined
                            && indentSensitiveTags.has(node.tag)) {
                            for (let i = document.positionAt(node.startTagEnd).line + 1; i <= document.positionAt(node.endTagStart).line; i++) {
                                lines.push(i);
                            }
                        }
                        else {
                            node.children.forEach(visit);
                        }
                    });
                    return lines;
                });
            },
            provideLinkedEditingRanges(document, position) {
                return worker(document, (htmlDocument) => {
                    const ranges = htmlLs.findLinkedEditingRanges(document, position, htmlDocument);
                    if (!ranges)
                        return;
                    return { ranges };
                });
            },
            async provideAutoInsertionEdit(document, position, insertContext) {
                return worker(document, async (htmlDocument) => {
                    const lastCharacter = insertContext.lastChange.text[insertContext.lastChange.text.length - 1];
                    if (insertContext.lastChange.rangeLength === 0 && lastCharacter === '=') {
                        const enabled = (await context.env.getConfiguration?.('html.autoCreateQuotes')) ?? true;
                        if (enabled) {
                            const text = htmlLs.doQuoteComplete(document, position, htmlDocument, await context.env.getConfiguration?.('html.completion'));
                            if (text) {
                                return text;
                            }
                        }
                    }
                    if (insertContext.lastChange.rangeLength === 0 && (lastCharacter === '>' || lastCharacter === '/')) {
                        const enabled = (await context.env.getConfiguration?.('html.autoClosingTags')) ?? true;
                        if (enabled) {
                            const text = htmlLs.doTagComplete(document, position, htmlDocument);
                            if (text) {
                                return text;
                            }
                        }
                    }
                });
            },
        };
        async function initCustomData() {
            if (shouldUpdateCustomData && useCustomDataProviders) {
                shouldUpdateCustomData = false;
                customData = await getCustomData();
                htmlLs.setDataProviders(useDefaultDataProvider, [...customData, ...extraData]);
            }
        }
        function updateExtraCustomData(data) {
            extraData = data;
            htmlLs.setDataProviders(useDefaultDataProvider, [...customData, ...extraData]);
        }
        async function getCustomData() {
            const customData = await context?.env.getConfiguration?.('html.customData') ?? [];
            const newData = [];
            for (const customDataPath of customData) {
                try {
                    const pathModuleName = 'path'; // avoid bundle
                    const { posix: path } = require(pathModuleName);
                    const jsonPath = path.resolve(customDataPath);
                    newData.push(html.newHTMLDataProvider(customDataPath, require(jsonPath)));
                }
                catch (error) {
                    console.error(error);
                }
            }
            return newData;
        }
        async function worker(document, callback) {
            if (document.languageId !== languageId)
                return;
            const htmlDocument = getHtmlDocument(document);
            if (!htmlDocument)
                return;
            await initCustomData();
            return callback(htmlDocument);
        }
    };
}
exports.create = create;
exports.default = create;
function isEOL(content, offset) {
    return isNewlineCharacter(content.charCodeAt(offset));
}
const CR = '\r'.charCodeAt(0);
const NL = '\n'.charCodeAt(0);
function isNewlineCharacter(charCode) {
    return charCode === CR || charCode === NL;
}
//# sourceMappingURL=index.js.map