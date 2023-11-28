"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKindModifiers = exports.register = void 0;
const semver = require("semver");
const getUserPreferences_1 = require("../../configs/getUserPreferences");
const PConst = require("../../protocol.const");
const modifiers_1 = require("../../utils/modifiers");
const shared_1 = require("../../shared");
function register(ctx) {
    const { ts } = ctx;
    const lt_320 = semver.lt(ts.version, '3.2.0');
    const gte_300 = semver.gte(ts.version, '3.0.0');
    return async (uri, position, options) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const preferences = await (0, getUserPreferences_1.getUserPreferences)(ctx, document);
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const completionContext = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getCompletionsAtPosition(fileName, offset, {
            ...preferences,
            ...options,
        }));
        if (completionContext === undefined)
            return;
        const wordRange = completionContext.optionalReplacementSpan ? {
            start: document.positionAt(completionContext.optionalReplacementSpan.start),
            end: document.positionAt(completionContext.optionalReplacementSpan.start + completionContext.optionalReplacementSpan.length),
        } : undefined;
        let line = document.getText({
            start: { line: position.line, character: 0 },
            end: { line: position.line + 1, character: 0 },
        });
        if (line.endsWith('\n')) {
            line = line.substring(0, line.length - 1);
        }
        const dotAccessorContext = getDotAccessorContext(document);
        const entries = completionContext.entries
            .map(tsEntry => toVScodeItem(tsEntry, document));
        return {
            isIncomplete: !!completionContext.isIncomplete,
            items: entries,
        };
        function toVScodeItem(tsEntry, document) {
            const item = { label: tsEntry.name };
            item.kind = convertKind(tsEntry.kind);
            if (tsEntry.source && tsEntry.hasAction) {
                // De-prioritize auto-imports
                // https://github.com/microsoft/vscode/issues/40311
                item.sortText = '\uffff' + tsEntry.sortText;
            }
            else {
                item.sortText = tsEntry.sortText;
            }
            const { sourceDisplay, isSnippet, labelDetails } = tsEntry;
            if (sourceDisplay) {
                item.labelDetails ??= {};
                item.labelDetails.description = ts.displayPartsToString(sourceDisplay);
            }
            if (labelDetails) {
                item.labelDetails ??= {};
                Object.assign(item.labelDetails, labelDetails);
            }
            item.preselect = tsEntry.isRecommended;
            let range = getRangeFromReplacementSpan(tsEntry, document);
            item.commitCharacters = getCommitCharacters(tsEntry, {
                isNewIdentifierLocation: completionContext.isNewIdentifierLocation,
                isInValidCommitCharacterContext: isInValidCommitCharacterContext(document, position),
                enableCallCompletions: true, // TODO: suggest.completeFunctionCalls
            });
            item.insertText = tsEntry.insertText;
            item.insertTextFormat = isSnippet ? 2 : 1;
            item.filterText = getFilterText(tsEntry, wordRange, line, tsEntry.insertText);
            if (completionContext?.isMemberCompletion && dotAccessorContext && !isSnippet) {
                item.filterText = dotAccessorContext.text + (item.insertText || item.label);
                if (!range) {
                    const replacementRange = wordRange;
                    if (replacementRange) {
                        range = {
                            inserting: dotAccessorContext.range,
                            replacing: rangeUnion(dotAccessorContext.range, replacementRange),
                        };
                    }
                    else {
                        range = dotAccessorContext.range;
                    }
                    item.insertText = item.filterText;
                }
            }
            handleKindModifiers(item, tsEntry);
            if (!range && wordRange) {
                range = {
                    inserting: { start: wordRange.start, end: position },
                    replacing: wordRange,
                };
            }
            if (range) {
                if ('start' in range) {
                    item.textEdit = {
                        range,
                        newText: item.insertText || item.label,
                    };
                }
                else {
                    item.textEdit = {
                        insert: range.inserting,
                        replace: range.replacing,
                        newText: item.insertText || item.label,
                    };
                }
            }
            return {
                ...item,
                data: {
                    uri,
                    fileName,
                    offset,
                    originalItem: {
                        name: tsEntry.name,
                        source: tsEntry.source,
                        data: tsEntry.data,
                        labelDetails: tsEntry.labelDetails,
                    },
                },
            };
        }
        function getDotAccessorContext(document) {
            let dotAccessorContext;
            if (gte_300) {
                if (!completionContext)
                    return;
                const isMemberCompletion = completionContext.isMemberCompletion;
                if (isMemberCompletion) {
                    const dotMatch = line.slice(0, position.character).match(/\??\.\s*$/) || undefined;
                    if (dotMatch) {
                        const range = {
                            start: { line: position.line, character: position.character - dotMatch[0].length },
                            end: position,
                        };
                        const text = document.getText(range);
                        dotAccessorContext = { range, text };
                    }
                }
            }
            return dotAccessorContext;
        }
        // from vscode typescript
        function getRangeFromReplacementSpan(tsEntry, document) {
            if (!tsEntry.replacementSpan) {
                return;
            }
            let replaceRange = {
                start: document.positionAt(tsEntry.replacementSpan.start),
                end: document.positionAt(tsEntry.replacementSpan.start + tsEntry.replacementSpan.length),
            };
            // Make sure we only replace a single line at most
            if (replaceRange.start.line !== replaceRange.end.line) {
                replaceRange = {
                    start: {
                        line: replaceRange.start.line,
                        character: replaceRange.start.character,
                    },
                    end: {
                        line: replaceRange.start.line,
                        character: document.positionAt(document.offsetAt({ line: replaceRange.start.line + 1, character: 0 }) - 1).character,
                    },
                };
            }
            // If TS returns an explicit replacement range, we should use it for both types of completion
            return {
                inserting: replaceRange,
                replacing: replaceRange,
            };
        }
        function getFilterText(tsEntry, wordRange, line, insertText) {
            // Handle private field completions
            if (tsEntry.name.startsWith('#')) {
                const wordStart = wordRange ? line.charAt(wordRange.start.character) : undefined;
                if (insertText) {
                    if (insertText.startsWith('this.#')) {
                        return wordStart === '#' ? insertText : insertText.replace(/^this\.#/, '');
                    }
                    else {
                        return insertText;
                    }
                }
                else {
                    return wordStart === '#' ? undefined : tsEntry.name.replace(/^#/, '');
                }
            }
            // For `this.` completions, generally don't set the filter text since we don't want them to be overly prioritized. #74164
            if (insertText?.startsWith('this.')) {
                return undefined;
            }
            // Handle the case:
            // ```
            // const xyz = { 'ab c': 1 };
            // xyz.ab|
            // ```
            // In which case we want to insert a bracket accessor but should use `.abc` as the filter text instead of
            // the bracketed insert text.
            else if (insertText?.startsWith('[')) {
                return insertText.replace(/^\[['"](.+)[['"]\]$/, '.$1');
            }
            // In all other cases, fallback to using the insertText
            return insertText;
        }
        function convertKind(kind) {
            switch (kind) {
                case PConst.Kind.primitiveType:
                case PConst.Kind.keyword:
                    return 14;
                case PConst.Kind.const:
                case PConst.Kind.let:
                case PConst.Kind.variable:
                case PConst.Kind.localVariable:
                case PConst.Kind.alias:
                case PConst.Kind.parameter:
                    return 6;
                case PConst.Kind.memberVariable:
                case PConst.Kind.memberGetAccessor:
                case PConst.Kind.memberSetAccessor:
                    return 5;
                case PConst.Kind.function:
                case PConst.Kind.localFunction:
                    return 3;
                case PConst.Kind.method:
                case PConst.Kind.constructSignature:
                case PConst.Kind.callSignature:
                case PConst.Kind.indexSignature:
                    return 2;
                case PConst.Kind.enum:
                    return 13;
                case PConst.Kind.enumMember:
                    return 20;
                case PConst.Kind.module:
                case PConst.Kind.externalModuleName:
                    return 9;
                case PConst.Kind.class:
                case PConst.Kind.type:
                    return 7;
                case PConst.Kind.interface:
                    return 8;
                case PConst.Kind.warning:
                    return 1;
                case PConst.Kind.script:
                    return 17;
                case PConst.Kind.directory:
                    return 19;
                case PConst.Kind.string:
                    return 21;
                default:
                    return 10;
            }
        }
        function getCommitCharacters(entry, context) {
            if (entry.kind === PConst.Kind.warning) { // Ambient JS word based suggestion
                return undefined;
            }
            if (context.isNewIdentifierLocation || !context.isInValidCommitCharacterContext) {
                return undefined;
            }
            const commitCharacters = ['.', ',', ';'];
            if (context.enableCallCompletions) {
                commitCharacters.push('(');
            }
            return commitCharacters;
        }
        function isInValidCommitCharacterContext(document, position) {
            if (lt_320) {
                // Workaround for https://github.com/microsoft/TypeScript/issues/27742
                // Only enable dot completions when the previous character is not a dot preceded by whitespace.
                // Prevents incorrectly completing while typing spread operators.
                if (position.character > 1) {
                    const preText = document.getText({
                        start: { line: position.line, character: 0 },
                        end: position,
                    });
                    return preText.match(/(\s|^)\.$/ig) === null;
                }
            }
            return true;
        }
    };
}
exports.register = register;
function handleKindModifiers(item, tsEntry) {
    if (tsEntry.kindModifiers) {
        const kindModifiers = (0, modifiers_1.parseKindModifier)(tsEntry.kindModifiers);
        if (kindModifiers.has(PConst.KindModifiers.optional)) {
            if (!item.insertText) {
                item.insertText = item.label;
            }
            if (!item.filterText) {
                item.filterText = item.label;
            }
            item.label += '?';
        }
        if (kindModifiers.has(PConst.KindModifiers.deprecated)) {
            item.tags = [1];
        }
        if (kindModifiers.has(PConst.KindModifiers.color)) {
            item.kind = 16;
        }
        if (tsEntry.kind === PConst.Kind.script) {
            for (const extModifier of PConst.KindModifiers.fileExtensionKindModifiers) {
                if (kindModifiers.has(extModifier)) {
                    if (tsEntry.name.toLowerCase().endsWith(extModifier)) {
                        item.detail = tsEntry.name;
                    }
                    else {
                        item.detail = tsEntry.name + extModifier;
                    }
                    break;
                }
            }
        }
    }
}
exports.handleKindModifiers = handleKindModifiers;
function rangeUnion(a, b) {
    const start = (a.start.line < b.start.line || (a.start.line === b.start.line && a.start.character < b.start.character)) ? a.start : b.start;
    const end = (a.end.line > b.end.line || (a.end.line === b.end.line && a.end.character > b.end.character)) ? a.end : b.end;
    return { start, end };
}
//# sourceMappingURL=basic.js.map