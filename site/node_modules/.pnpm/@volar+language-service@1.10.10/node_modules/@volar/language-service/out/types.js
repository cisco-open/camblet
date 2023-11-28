"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleType = exports.FileType = void 0;
var FileType;
(function (FileType) {
    FileType[FileType["Unknown"] = 0] = "Unknown";
    FileType[FileType["File"] = 1] = "File";
    FileType[FileType["Directory"] = 2] = "Directory";
    FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
})(FileType || (exports.FileType = FileType = {}));
var RuleType;
(function (RuleType) {
    RuleType[RuleType["Format"] = 0] = "Format";
    RuleType[RuleType["Syntax"] = 1] = "Syntax";
    RuleType[RuleType["Semantic"] = 2] = "Semantic";
})(RuleType || (exports.RuleType = RuleType = {}));
;
//# sourceMappingURL=types.js.map