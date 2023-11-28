"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticModel = exports.ServerMode = void 0;
var ServerMode;
(function (ServerMode) {
    ServerMode[ServerMode["Semantic"] = 0] = "Semantic";
    ServerMode[ServerMode["PartialSemantic"] = 1] = "PartialSemantic";
    ServerMode[ServerMode["Syntactic"] = 2] = "Syntactic";
})(ServerMode || (exports.ServerMode = ServerMode = {}));
var DiagnosticModel;
(function (DiagnosticModel) {
    DiagnosticModel[DiagnosticModel["None"] = 0] = "None";
    DiagnosticModel[DiagnosticModel["Push"] = 1] = "Push";
    DiagnosticModel[DiagnosticModel["Pull"] = 2] = "Pull";
})(DiagnosticModel || (exports.DiagnosticModel = DiagnosticModel = {}));
//# sourceMappingURL=types.js.map