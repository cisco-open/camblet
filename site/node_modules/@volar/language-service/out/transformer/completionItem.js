"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const common_1 = require("../utils/common");
const textEdit_1 = require("./textEdit");
function transform(item, getOtherRange, document) {
    return {
        ...item,
        additionalTextEdits: item.additionalTextEdits
            ?.map(edit => (0, textEdit_1.transform)(edit, getOtherRange, document))
            .filter(common_1.notEmpty),
        textEdit: item.textEdit
            ? (0, textEdit_1.transform)(item.textEdit, getOtherRange, document)
            : undefined,
    };
}
exports.transform = transform;
//# sourceMappingURL=completionItem.js.map