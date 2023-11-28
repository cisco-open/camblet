"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const transformer = require("../transformer");
const common_1 = require("../utils/common");
const dedupe = require("../utils/dedupe");
const featureWorkers_1 = require("../utils/featureWorkers");
const rename_1 = require("./rename");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (uri, range, codeActionContext, token = cancellation_1.NoneCancellationToken) => {
        const sourceDocument = context.getTextDocument(uri);
        if (!sourceDocument)
            return;
        const offsetRange = {
            start: sourceDocument.offsetAt(range.start),
            end: sourceDocument.offsetAt(range.end),
        };
        const transformedCodeActions = new WeakSet();
        const pluginActions = await (0, featureWorkers_1.languageFeatureWorker)(context, uri, { range, codeActionContext }, (_arg, map, file) => {
            if (!file.capabilities.codeAction)
                return [];
            const _codeActionContext = {
                diagnostics: transformer.asLocations(codeActionContext.diagnostics, range => map.toGeneratedRange(range)),
                only: codeActionContext.only,
            };
            let minStart;
            let maxEnd;
            for (const mapping of map.map.mappings) {
                const overlapRange = (0, common_1.getOverlapRange)(offsetRange.start, offsetRange.end, mapping.sourceRange[0], mapping.sourceRange[1]);
                if (overlapRange) {
                    const start = map.map.toGeneratedOffset(overlapRange.start)?.[0];
                    const end = map.map.toGeneratedOffset(overlapRange.end)?.[0];
                    if (start !== undefined && end !== undefined) {
                        minStart = minStart === undefined ? start : Math.min(start, minStart);
                        maxEnd = maxEnd === undefined ? end : Math.max(end, maxEnd);
                    }
                }
            }
            if (minStart !== undefined && maxEnd !== undefined) {
                return [{
                        range: {
                            start: map.virtualFileDocument.positionAt(minStart),
                            end: map.virtualFileDocument.positionAt(maxEnd),
                        },
                        codeActionContext: _codeActionContext,
                    }];
            }
            return [];
        }, async (service, document, { range, codeActionContext }, map) => {
            if (token.isCancellationRequested)
                return;
            const serviceId = Object.keys(context.services).find(key => context.services[key] === service);
            const diagnostics = codeActionContext.diagnostics.filter(diagnostic => {
                const data = diagnostic.data;
                if (data && data.version !== sourceDocument.version) {
                    return false;
                }
                return data?.type === 'service' && data?.serviceOrRuleId === serviceId;
            }).map(diagnostic => {
                const data = diagnostic.data;
                return {
                    ...diagnostic,
                    ...data.original,
                };
            });
            const codeActions = await service.provideCodeActions?.(document, range, {
                ...codeActionContext,
                diagnostics,
            }, token);
            codeActions?.forEach(codeAction => {
                codeAction.data = {
                    uri,
                    version: sourceDocument.version,
                    type: 'service',
                    original: {
                        data: codeAction.data,
                        edit: codeAction.edit,
                    },
                    serviceId: Object.keys(context.services).find(key => context.services[key] === service),
                };
            });
            if (codeActions && map && service.transformCodeAction) {
                for (let i = 0; i < codeActions.length; i++) {
                    const transformed = service.transformCodeAction(codeActions[i]);
                    if (transformed) {
                        codeActions[i] = transformed;
                        transformedCodeActions.add(transformed);
                    }
                }
            }
            return codeActions;
        }, (actions, map) => actions.map(action => {
            if (transformedCodeActions.has(action))
                return action;
            if (!map)
                return action;
            if (action.edit) {
                const edit = (0, rename_1.embeddedEditToSourceEdit)(action.edit, context.documents, 'codeAction');
                if (!edit) {
                    return;
                }
                action.edit = edit;
            }
            return action;
        }).filter(common_1.notEmpty), arr => dedupe.withCodeAction(arr.flat()));
        const ruleActions = [];
        for (const diagnostic of codeActionContext.diagnostics) {
            const data = diagnostic.data;
            if (data && data.version !== sourceDocument.version) {
                // console.warn('[volar/rules-api] diagnostic version mismatch', data.version, sourceDocument.version);
                continue;
            }
            if (data?.type === 'rule') {
                const fixes = context.ruleFixes?.[data.documentUri]?.[data.serviceOrRuleId]?.[data.ruleFixIndex];
                if (fixes) {
                    for (let i = 0; i < fixes[1].length; i++) {
                        const fix = fixes[1][i];
                        const matchKinds = [];
                        if (!codeActionContext.only) {
                            matchKinds.push(undefined);
                        }
                        else {
                            for (const kind of fix.kinds ?? ['quickfix']) {
                                const matchOnly = matchOnlyKind(codeActionContext.only, kind);
                                if (matchOnly) {
                                    matchKinds.push(matchOnly);
                                }
                            }
                        }
                        for (const matchKind of matchKinds) {
                            const action = {
                                title: fix.title ?? `Fix: ${diagnostic.message}`,
                                kind: matchKind,
                                diagnostics: [diagnostic],
                                data: {
                                    uri,
                                    type: 'rule',
                                    version: data.version,
                                    isFormat: data.isFormat,
                                    ruleId: data.serviceOrRuleId,
                                    documentUri: data.documentUri,
                                    ruleFixIndex: data.ruleFixIndex,
                                    index: i,
                                },
                            };
                            ruleActions.push(action);
                        }
                    }
                }
            }
        }
        return [
            ...pluginActions ?? [],
            ...ruleActions,
        ];
    };
}
exports.register = register;
function matchOnlyKind(only, kind) {
    const b = kind.split('.');
    for (const onlyKind of only) {
        const a = onlyKind.split('.');
        if (a.length <= b.length) {
            let matchNum = 0;
            for (let i = 0; i < a.length; i++) {
                if (a[i] == b[i]) {
                    matchNum++;
                }
            }
            if (matchNum === a.length) {
                return onlyKind;
            }
        }
    }
}
//# sourceMappingURL=codeActions.js.map