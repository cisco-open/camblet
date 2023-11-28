"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const validation_1 = require("./validation");
const cancellation_1 = require("../utils/cancellation");
function register(context) {
    return async (uri, position, token = cancellation_1.NoneCancellationToken) => {
        let hover = await (0, featureWorkers_1.languageFeatureWorker)(context, uri, position, (position, map) => map.toGeneratedPositions(position, data => !!data.hover), (service, document, position) => {
            if (token.isCancellationRequested)
                return;
            return service.provideHover?.(document, position, token);
        }, (item, map) => {
            if (!map || !item.range)
                return item;
            const range = map.toSourceRange(item.range);
            if (range) {
                item.range = range;
                return item;
            }
        }, (hovers) => ({
            contents: {
                kind: 'markdown',
                value: hovers.map(getHoverTexts).flat().join('\n\n---\n\n'),
            },
            range: hovers.find(hover => hover.range && (0, common_1.isInsideRange)(hover.range, { start: position, end: position }))?.range ?? hovers[0].range,
        }));
        const markups = validation_1.errorMarkups[uri];
        if (markups) {
            for (const errorAndMarkup of markups) {
                if ((0, common_1.isInsideRange)(errorAndMarkup.error.range, { start: position, end: position })) {
                    hover ??= {
                        contents: {
                            kind: 'markdown',
                            value: '',
                        },
                    };
                    hover.range = errorAndMarkup.error.range;
                    if (typeof hover.contents !== 'object' || typeof hover.contents !== 'string') {
                        hover.contents = {
                            kind: 'markdown',
                            value: hover.contents,
                        };
                    }
                    if (hover.contents.value) {
                        hover.contents.value += '\n\n---\n\n';
                    }
                    hover.contents.value += errorAndMarkup.markup.value;
                }
            }
        }
        return hover;
    };
}
exports.register = register;
function getHoverTexts(hover) {
    if (typeof hover.contents === 'string') {
        return [hover.contents];
    }
    if (Array.isArray(hover.contents)) {
        return hover.contents.map(content => {
            if (typeof content === 'string') {
                return content;
            }
            return `\`\`\`${content.language}\n${content.value}\n\`\`\``;
        });
    }
    if ('kind' in hover.contents) {
        return [hover.contents.value];
    }
    return [`\`\`\`${hover.contents.language}\n${hover.contents.value}\n\`\`\``];
}
//# sourceMappingURL=hover.js.map