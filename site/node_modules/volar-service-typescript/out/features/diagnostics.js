"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmitDeclarations = exports.register = void 0;
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return (uri, options) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(document.uri);
        const program = ctx.typescript.languageService.getProgram();
        const sourceFile = program?.getSourceFile(fileName);
        if (!program || !sourceFile)
            return [];
        const token = {
            isCancellationRequested() {
                return ctx.typescript?.languageServiceHost.getCancellationToken?.().isCancellationRequested() ?? false;
            },
            throwIfCancellationRequested() { },
        };
        let errors = (0, shared_1.safeCall)(() => [
            ...options.semantic ? program.getSemanticDiagnostics(sourceFile, token) : [],
            ...options.syntactic ? program.getSyntacticDiagnostics(sourceFile, token) : [],
            ...options.suggestion ? ctx.typescript.languageService.getSuggestionDiagnostics(fileName) : [],
        ]) ?? [];
        if (options.declaration && getEmitDeclarations(program.getCompilerOptions())) {
            errors = errors.concat(program.getDeclarationDiagnostics(sourceFile, token));
        }
        return translateDiagnostics(document, errors);
        function translateDiagnostics(document, input) {
            return input.map(diag => translateDiagnostic(diag, document)).filter((v) => !!v);
        }
        function translateDiagnostic(diag, document) {
            if (diag.start === undefined)
                return;
            if (diag.length === undefined)
                return;
            const diagnostic = {
                range: {
                    start: document.positionAt(diag.start),
                    end: document.positionAt(diag.start + diag.length),
                },
                severity: translateErrorType(diag.category),
                source: 'ts',
                code: diag.code,
                message: getMessageText(diag),
            };
            if (diag.relatedInformation) {
                diagnostic.relatedInformation = diag.relatedInformation
                    .map(rErr => translateDiagnosticRelated(rErr))
                    .filter((v) => !!v);
            }
            if (diag.reportsUnnecessary) {
                if (diagnostic.tags === undefined)
                    diagnostic.tags = [];
                diagnostic.tags.push(1);
            }
            if (diag.reportsDeprecated) {
                if (diagnostic.tags === undefined)
                    diagnostic.tags = [];
                diagnostic.tags.push(2);
            }
            return diagnostic;
        }
        function translateDiagnosticRelated(diag) {
            if (diag.start === undefined)
                return;
            if (diag.length === undefined)
                return;
            let document;
            if (diag.file) {
                document = ctx.getTextDocument(ctx.env.fileNameToUri(diag.file.fileName));
            }
            if (!document)
                return;
            const diagnostic = {
                location: {
                    uri: document.uri,
                    range: {
                        start: document.positionAt(diag.start),
                        end: document.positionAt(diag.start + diag.length),
                    },
                },
                message: getMessageText(diag),
            };
            return diagnostic;
        }
        function translateErrorType(input) {
            switch (input) {
                case ts.DiagnosticCategory.Warning: return 2;
                case ts.DiagnosticCategory.Error: return 1;
                case ts.DiagnosticCategory.Suggestion: return 4;
                case ts.DiagnosticCategory.Message: return 3;
            }
            return 1;
        }
    };
}
exports.register = register;
function getMessageText(diag, level = 0) {
    let messageText = '  '.repeat(level);
    if (typeof diag.messageText === 'string') {
        messageText += diag.messageText;
    }
    else {
        messageText += diag.messageText.messageText;
        if (diag.messageText.next) {
            for (const info of diag.messageText.next) {
                messageText += '\n' + getMessageText(info, level + 1);
            }
        }
    }
    return messageText;
}
function getEmitDeclarations(compilerOptions) {
    return !!(compilerOptions.declaration || compilerOptions.composite);
}
exports.getEmitDeclarations = getEmitDeclarations;
//# sourceMappingURL=diagnostics.js.map