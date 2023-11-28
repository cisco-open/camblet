"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOrganizeImportsCodeAction = exports.resolveRefactorCodeAction = exports.resolveFixAllCodeAction = exports.register = void 0;
const getFormatCodeSettings_1 = require("../configs/getFormatCodeSettings");
const getUserPreferences_1 = require("../configs/getUserPreferences");
const shared_1 = require("../shared");
const rename_1 = require("./rename");
function register(ctx) {
    return async (codeAction) => {
        const data = codeAction.data;
        const document = ctx.getTextDocument(data.uri);
        const [formatOptions, preferences] = document ? await Promise.all([
            (0, getFormatCodeSettings_1.getFormatCodeSettings)(ctx, document),
            (0, getUserPreferences_1.getUserPreferences)(ctx, document),
        ]) : [{}, {}];
        if (data?.type === 'fixAll') {
            resolveFixAllCodeAction(ctx, codeAction, data, formatOptions, preferences);
        }
        else if (data?.type === 'refactor' && document) {
            resolveRefactorCodeAction(ctx, codeAction, data, document, formatOptions, preferences);
        }
        else if (data?.type === 'organizeImports') {
            resolveOrganizeImportsCodeAction(ctx, codeAction, data, formatOptions, preferences);
        }
        return codeAction;
    };
}
exports.register = register;
function resolveFixAllCodeAction(ctx, codeAction, data, formatOptions, preferences) {
    const fixes = data.fixIds.map(fixId => (0, shared_1.safeCall)(() => ctx.typescript.languageService.getCombinedCodeFix({ type: 'file', fileName: data.fileName }, fixId, formatOptions, preferences)));
    const changes = fixes.map(fix => fix?.changes ?? []).flat();
    codeAction.edit = (0, rename_1.fileTextChangesToWorkspaceEdit)(changes, ctx);
}
exports.resolveFixAllCodeAction = resolveFixAllCodeAction;
function resolveRefactorCodeAction(ctx, codeAction, data, document, formatOptions, preferences) {
    const editInfo = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getEditsForRefactor(data.fileName, formatOptions, data.range, data.refactorName, data.actionName, preferences));
    if (!editInfo) {
        return;
    }
    codeAction.edit = (0, rename_1.fileTextChangesToWorkspaceEdit)(editInfo.edits, ctx);
    if (editInfo.renameLocation !== undefined && editInfo.renameFilename !== undefined) {
        codeAction.command = ctx.commands.rename.create(document.uri, document.positionAt(editInfo.renameLocation));
    }
}
exports.resolveRefactorCodeAction = resolveRefactorCodeAction;
function resolveOrganizeImportsCodeAction(ctx, codeAction, data, formatOptions, preferences) {
    const changes = (0, shared_1.safeCall)(() => ctx.typescript.languageService.organizeImports({ type: 'file', fileName: data.fileName }, formatOptions, preferences));
    codeAction.edit = (0, rename_1.fileTextChangesToWorkspaceEdit)(changes ?? [], ctx);
}
exports.resolveOrganizeImportsCodeAction = resolveOrganizeImportsCodeAction;
//# sourceMappingURL=codeActionResolve.js.map