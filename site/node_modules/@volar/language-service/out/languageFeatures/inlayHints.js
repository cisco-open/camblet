"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const transformer = require("../transformer");
const common_1 = require("../utils/common");
const featureWorkers_1 = require("../utils/featureWorkers");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (uri, range, token = cancellation_1.NoneCancellationToken) => {
        const document = context.getTextDocument(uri);
        if (!document)
            return;
        const offsetRange = {
            start: document.offsetAt(range.start),
            end: document.offsetAt(range.end),
        };
        return (0, featureWorkers_1.languageFeatureWorker)(context, uri, range, (_arg, map, file) => {
            /**
             * copy from ./codeActions.ts
             */
            if (!file.capabilities.inlayHint)
                return [];
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
                        start: map.virtualFileDocument.positionAt(minStart),
                        end: map.virtualFileDocument.positionAt(maxEnd),
                    }];
            }
            return [];
        }, async (service, document, arg) => {
            if (token.isCancellationRequested)
                return;
            const hints = await service.provideInlayHints?.(document, arg, token);
            hints?.forEach(link => {
                link.data = {
                    uri,
                    original: {
                        data: link.data,
                    },
                    serviceId: Object.keys(context.services).find(key => context.services[key] === service),
                };
            });
            return hints;
        }, (inlayHints, map) => inlayHints.map((_inlayHint) => {
            if (!map)
                return _inlayHint;
            const position = map.toSourcePosition(_inlayHint.position, data => !!data.semanticTokens /* todo */);
            const edits = _inlayHint.textEdits
                ?.map(textEdit => transformer.asTextEdit(textEdit, range => map.toSourceRange(range), map.virtualFileDocument))
                .filter(common_1.notEmpty);
            if (position) {
                return {
                    ..._inlayHint,
                    position,
                    textEdits: edits,
                };
            }
        }).filter(common_1.notEmpty), arr => arr.flat());
    };
}
exports.register = register;
//# sourceMappingURL=inlayHints.js.map