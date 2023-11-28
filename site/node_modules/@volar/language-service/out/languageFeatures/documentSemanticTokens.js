"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const SemanticTokensBuilder_1 = require("../utils/SemanticTokensBuilder");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (uri, range, legend, token = cancellation_1.NoneCancellationToken, reportProgress) => {
        const document = context.getTextDocument(uri);
        if (!document)
            return;
        const offsetRange = range ? [
            document.offsetAt(range.start),
            document.offsetAt(range.end),
        ] : [
            0,
            document.getText().length,
        ];
        const tokens = await (0, featureWorkers_1.languageFeatureWorker)(context, uri, offsetRange, function* (offsetRange, map) {
            let range;
            for (const mapping of map.map.mappings) {
                if (mapping.data.semanticTokens
                    && mapping.sourceRange[1] > offsetRange[0]
                    && mapping.sourceRange[0] < offsetRange[1]) {
                    if (!range) {
                        range = [...mapping.generatedRange];
                    }
                    else {
                        range[0] = Math.min(range[0], mapping.generatedRange[0]);
                        range[1] = Math.max(range[1], mapping.generatedRange[1]);
                    }
                }
            }
            if (range) {
                yield range;
            }
        }, (service, document, offsetRange) => {
            if (token?.isCancellationRequested)
                return;
            return service.provideDocumentSemanticTokens?.(document, {
                start: document.positionAt(offsetRange[0]),
                end: document.positionAt(offsetRange[1]),
            }, legend, token);
        }, (tokens, map) => tokens.map(_token => {
            if (!map)
                return _token;
            const range = map.toSourceRange({
                start: { line: _token[0], character: _token[1] },
                end: { line: _token[0], character: _token[1] + _token[2] },
            }, data => !!data.semanticTokens);
            if (range) {
                return [range.start.line, range.start.character, range.end.character - range.start.character, _token[3], _token[4]];
            }
        }).filter(common_1.notEmpty), tokens => tokens.flat(), tokens => reportProgress?.(buildTokens(tokens)));
        if (tokens) {
            return buildTokens(tokens);
        }
    };
}
exports.register = register;
function buildTokens(tokens) {
    const builder = new SemanticTokensBuilder_1.SemanticTokensBuilder();
    const sortedTokens = tokens.sort((a, b) => a[0] - b[0] === 0 ? a[1] - b[1] : a[0] - b[0]);
    for (const token of sortedTokens) {
        builder.push(...token);
    }
    return builder.build();
}
//# sourceMappingURL=documentSemanticTokens.js.map