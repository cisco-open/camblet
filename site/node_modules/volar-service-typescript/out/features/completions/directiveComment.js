"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(); // TODO: not working
const directives = [
    {
        value: '@ts-check',
        description: localize('ts-check', "Enables semantic checking in a JavaScript file. Must be at the top of a file.")
    }, {
        value: '@ts-nocheck',
        description: localize('ts-nocheck', "Disables semantic checking in a JavaScript file. Must be at the top of a file.")
    }, {
        value: '@ts-ignore',
        description: localize('ts-ignore', "Suppresses @ts-check errors on the next line of a file.")
    }, {
        value: '@ts-expect-error',
        description: localize('ts-expect-error', "Suppresses @ts-check errors on the next line of a file, expecting at least one to exist.")
    }
];
function register(ctx) {
    return (uri, position) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const prefix = document.getText({
            start: { line: position.line, character: 0 },
            end: position,
        });
        const match = prefix.match(/^\s*\/\/+\s?(@[a-zA-Z\-]*)?$/);
        if (match) {
            return directives.map(directive => {
                const item = { label: directive.value };
                item.insertTextFormat = 2;
                item.detail = directive.description;
                const range = {
                    start: {
                        line: position.line,
                        character: Math.max(0, position.character - (match[1] ? match[1].length : 0)),
                    },
                    end: position,
                };
                item.textEdit = {
                    range,
                    newText: directive.value,
                };
                return item;
            });
        }
        return [];
    };
}
exports.register = register;
//# sourceMappingURL=directiveComment.js.map