"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCall = exports.ruleWorker = exports.languageFeatureWorker = exports.documentFeatureWorker = void 0;
const definePlugin_1 = require("./definePlugin");
const types_1 = require("../types");
async function documentFeatureWorker(context, uri, isValidSourceMap, worker, transform, combineResult) {
    return languageFeatureWorker(context, uri, undefined, (_, map, file) => {
        if (isValidSourceMap(file, map)) {
            return [undefined];
        }
        return [];
    }, worker, transform, combineResult);
}
exports.documentFeatureWorker = documentFeatureWorker;
async function languageFeatureWorker(context, uri, arg, transformArg, worker, transform, combineResult, reportProgress) {
    const document = context.getTextDocument(uri);
    const virtualFile = context.documents.getSourceByUri(uri)?.root;
    let results = [];
    if (virtualFile) {
        await (0, definePlugin_1.visitEmbedded)(context.documents, virtualFile, async (file, map) => {
            for (const mappedArg of transformArg(arg, map, file)) {
                for (const [serviceId, service] of Object.entries(context.services)) {
                    const embeddedResult = await safeCall(() => worker(service, map.virtualFileDocument, mappedArg, map, file), 'service ' + serviceId + ' crashed on ' + map.virtualFileDocument.uri);
                    if (!embeddedResult)
                        continue;
                    const result = transform(embeddedResult, map);
                    if (!result)
                        continue;
                    results.push(result);
                    if (!combineResult)
                        return false;
                    const isEmptyArray = Array.isArray(result) && result.length === 0;
                    if (reportProgress && !isEmptyArray) {
                        reportProgress(combineResult(results));
                    }
                }
            }
            return true;
        });
    }
    else if (document) {
        for (const [serviceId, service] of Object.entries(context.services)) {
            const embeddedResult = await safeCall(() => worker(service, document, arg, undefined, undefined), 'service ' + serviceId + ' crashed on ' + uri);
            if (!embeddedResult)
                continue;
            const result = transform(embeddedResult, undefined);
            if (!result)
                continue;
            results.push(result);
            if (!combineResult)
                break;
            const isEmptyArray = Array.isArray(result) && result.length === 0;
            if (reportProgress && !isEmptyArray) {
                reportProgress(combineResult(results));
            }
        }
    }
    if (combineResult && results.length > 0) {
        return combineResult(results);
    }
    else if (results.length > 0) {
        return results[0];
    }
}
exports.languageFeatureWorker = languageFeatureWorker;
async function ruleWorker(context, ruleType, uri, isValidSourceMap, worker, transform, combineResult, reportProgress) {
    const document = context.getTextDocument(uri);
    const virtualFile = context.documents.getSourceByUri(uri)?.root;
    const ruleCtx = {
        env: context.env,
        inject: context.inject,
        report: () => { },
    };
    let results = [];
    if (virtualFile) {
        await (0, definePlugin_1.visitEmbedded)(context.documents, virtualFile, async (file, map) => {
            if (!isValidSourceMap(file)) {
                return true;
            }
            for (const ruleId in context.rules) {
                const rule = context.rules[ruleId];
                if ((rule.type ?? types_1.RuleType.Syntax) !== ruleType) {
                    continue;
                }
                const embeddedResult = await safeCall(() => worker(ruleId, rule, map.virtualFileDocument, ruleCtx), 'rule ' + ruleId + ' crashed on ' + map.virtualFileDocument.uri);
                if (!embeddedResult)
                    continue;
                const result = transform(embeddedResult, map);
                if (!result)
                    continue;
                results.push(result);
                if (!combineResult)
                    return false;
                const isEmptyArray = Array.isArray(result) && result.length === 0;
                if (reportProgress && !isEmptyArray) {
                    reportProgress(combineResult(results));
                }
            }
            return true;
        });
    }
    else if (document) {
        for (const ruleId in context.rules) {
            const rule = context.rules[ruleId];
            if ((rule.type ?? types_1.RuleType.Syntax) !== ruleType) {
                continue;
            }
            const embeddedResult = await safeCall(() => worker(ruleId, rule, document, ruleCtx), 'rule ' + ruleId + ' crashed on ' + document.uri);
            if (!embeddedResult)
                continue;
            const result = transform(embeddedResult, undefined);
            if (!result)
                continue;
            results.push(result);
            if (!combineResult)
                break;
            const isEmptyArray = Array.isArray(result) && result.length === 0;
            if (reportProgress && !isEmptyArray) {
                reportProgress(combineResult(results));
            }
        }
    }
    if (combineResult && results.length > 0) {
        return combineResult(results);
    }
    else if (results.length > 0) {
        return results[0];
    }
}
exports.ruleWorker = ruleWorker;
async function safeCall(cb, errorMsg) {
    try {
        return await cb();
    }
    catch (err) {
        console.warn(errorMsg, err);
    }
}
exports.safeCall = safeCall;
//# sourceMappingURL=featureWorkers.js.map