"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const common_1 = require("../utils/common");
const dedupe = require("../utils/dedupe");
const featureWorkers_1 = require("../utils/featureWorkers");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return {
        doPrepare(uri, position, token = cancellation_1.NoneCancellationToken) {
            return (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => !!data.references), async (service, document, position, map) => {
                if (token.isCancellationRequested)
                    return;
                const items = await service.provideCallHierarchyItems?.(document, position, token);
                items?.forEach(item => {
                    item.data = {
                        uri,
                        original: {
                            data: item.data,
                        },
                        serviceId: Object.keys(context.services).find(key => context.services[key] === service),
                        virtualDocumentUri: map?.virtualFileDocument.uri,
                    };
                });
                return items;
            }, (data, sourceMap) => !sourceMap ? data : data
                .map(item => transformCallHierarchyItem(item, [])?.[0])
                .filter(common_1.notEmpty), arr => dedupe.withLocations(arr.flat()));
        },
        async getIncomingCalls(item, token) {
            const data = item.data;
            let incomingItems = [];
            if (data) {
                const service = context.services[data.serviceId];
                if (!service.provideCallHierarchyIncomingCalls)
                    return incomingItems;
                Object.assign(item, data.original);
                if (data.virtualDocumentUri) {
                    if (context.documents.isVirtualFileUri(data.virtualDocumentUri)) {
                        const _calls = await service.provideCallHierarchyIncomingCalls(item, token);
                        for (const _call of _calls) {
                            const calls = transformCallHierarchyItem(_call.from, _call.fromRanges);
                            if (!calls)
                                continue;
                            incomingItems.push({
                                from: calls[0],
                                fromRanges: calls[1],
                            });
                        }
                    }
                }
                else {
                    const _calls = await service.provideCallHierarchyIncomingCalls(item, token);
                    for (const _call of _calls) {
                        const calls = transformCallHierarchyItem(_call.from, _call.fromRanges);
                        if (!calls)
                            continue;
                        incomingItems.push({
                            from: calls[0],
                            fromRanges: calls[1],
                        });
                    }
                }
            }
            return dedupe.withCallHierarchyIncomingCalls(incomingItems);
        },
        async getOutgoingCalls(item, token) {
            const data = item.data;
            let items = [];
            if (data) {
                const service = context.services[data.serviceId];
                if (!service.provideCallHierarchyOutgoingCalls)
                    return items;
                Object.assign(item, data.original);
                if (data.virtualDocumentUri) {
                    if (context.documents.isVirtualFileUri(data.virtualDocumentUri)) {
                        const _calls = await service.provideCallHierarchyOutgoingCalls(item, token);
                        for (const call of _calls) {
                            const calls = transformCallHierarchyItem(call.to, call.fromRanges);
                            if (!calls)
                                continue;
                            items.push({
                                to: calls[0],
                                fromRanges: calls[1],
                            });
                        }
                    }
                }
                else {
                    const _calls = await service.provideCallHierarchyOutgoingCalls(item, token);
                    for (const call of _calls) {
                        const calls = transformCallHierarchyItem(call.to, call.fromRanges);
                        if (!calls)
                            continue;
                        items.push({
                            to: calls[0],
                            fromRanges: calls[1],
                        });
                    }
                }
            }
            return dedupe.withCallHierarchyOutgoingCalls(items);
        },
    };
    function transformCallHierarchyItem(tsItem, tsRanges) {
        if (!context.documents.isVirtualFileUri(tsItem.uri))
            return [tsItem, tsRanges];
        for (const [_, map] of context.documents.getMapsByVirtualFileUri(tsItem.uri)) {
            let range = map.toSourceRange(tsItem.range);
            if (!range) {
                // TODO: <script> range
                range = {
                    start: map.sourceFileDocument.positionAt(0),
                    end: map.sourceFileDocument.positionAt(map.sourceFileDocument.getText().length),
                };
            }
            const selectionRange = map.toSourceRange(tsItem.selectionRange);
            if (!selectionRange)
                continue;
            const vueRanges = tsRanges.map(tsRange => map.toSourceRange(tsRange)).filter(common_1.notEmpty);
            const vueItem = {
                ...tsItem,
                name: tsItem.name === map.virtualFileDocument.uri.substring(map.virtualFileDocument.uri.lastIndexOf('/') + 1)
                    ? map.sourceFileDocument.uri.substring(map.sourceFileDocument.uri.lastIndexOf('/') + 1)
                    : tsItem.name,
                uri: map.sourceFileDocument.uri,
                // TS Bug: `range: range` not works
                range: {
                    start: range.start,
                    end: range.end,
                },
                selectionRange: {
                    start: selectionRange.start,
                    end: selectionRange.end,
                },
            };
            selectionRange.end;
            return [vueItem, vueRanges];
        }
    }
}
exports.register = register;
//# sourceMappingURL=callHierarchy.js.map