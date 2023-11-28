"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFileInDir = void 0;
const path = require("path-browserify");
function isFileInDir(fileName, dir) {
    const relative = path.relative(dir, fileName);
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
exports.isFileInDir = isFileInDir;
//# sourceMappingURL=isFileInDir.js.map