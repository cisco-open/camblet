"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
function transform(textEdit, getOtherRange, document) {
    if ('range' in textEdit) {
        let range = getOtherRange(textEdit.range);
        if (range) {
            return {
                ...textEdit,
                range,
            };
        }
        ;
        const cover = tryRecover(getOtherRange, textEdit.range, textEdit.newText, document);
        if (cover) {
            return {
                ...textEdit,
                range: cover.range,
                newText: cover.newText,
            };
        }
    }
    else if ('replace' in textEdit && 'insert' in textEdit) {
        const insert = getOtherRange(textEdit.insert);
        const replace = insert ? getOtherRange(textEdit.replace) : undefined;
        if (insert && replace) {
            return {
                ...textEdit,
                insert,
                replace,
            };
        }
        const recoverInsert = tryRecover(getOtherRange, textEdit.insert, textEdit.newText, document);
        const recoverReplace = recoverInsert ? tryRecover(getOtherRange, textEdit.replace, textEdit.newText, document) : undefined;
        if (recoverInsert && recoverReplace && recoverInsert.newText === recoverReplace.newText) {
            return {
                ...textEdit,
                insert: recoverInsert.range,
                replace: recoverReplace.range,
                newText: recoverInsert.newText,
            };
        }
    }
}
exports.transform = transform;
/**
 * update edit text from ". foo" to " foo"
 * fix https://github.com/johnsoncodehk/volar/issues/2155
 */
function tryRecover(getOtherRange, replaceRange, newText, document) {
    if (replaceRange.start.line === replaceRange.end.line && replaceRange.end.character > replaceRange.start.character) {
        let character = replaceRange.start.character;
        while (newText.length && replaceRange.end.character > character) {
            const newStart = { line: replaceRange.start.line, character: replaceRange.start.character + 1 };
            if (document.getText({ start: replaceRange.start, end: newStart }) === newText[0]) {
                newText = newText.slice(1);
                character++;
                const otherRange = getOtherRange({ start: newStart, end: replaceRange.end });
                if (otherRange) {
                    return {
                        newText,
                        range: otherRange,
                    };
                }
            }
            else {
                break;
            }
        }
    }
}
//# sourceMappingURL=textEdit.js.map