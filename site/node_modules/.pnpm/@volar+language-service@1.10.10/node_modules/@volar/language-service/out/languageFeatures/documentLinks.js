"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const featureWorkers_1 = require("../utils/featureWorkers");
const common_1 = require("../utils/common");
const cancellation_1 = require("../utils/cancellation");
const documentLinkResolve_1 = require("./documentLinkResolve");
function register(context) {
    return async (uri, token = cancellation_1.NoneCancellationToken) => {
        const pluginLinks = await (0, featureWorkers_1.documentFeatureWorker)(context, uri, file => !!file.capabilities.documentSymbol, async (service, document) => {
            if (token.isCancellationRequested)
                return;
            const links = await service.provideDocumentLinks?.(document, token);
            for (const link of links ?? []) {
                link.data = {
                    uri,
                    original: {
                        data: link.data,
                    },
                    serviceId: Object.keys(context.services).find(key => context.services[key] === service),
                };
            }
            return links;
        }, (links, map) => links.map(link => {
            if (!map)
                return link;
            const range = map.toSourceRange(link.range);
            if (!range)
                return;
            link = {
                ...link,
                range,
            };
            if (link.target)
                link.target = (0, documentLinkResolve_1.transformDocumentLinkTarget)(link.target, context);
            return link;
        }).filter(common_1.notEmpty), arr => arr.flat()) ?? [];
        const maps = context.documents.getMapsBySourceFileUri(uri);
        const fictitiousLinks = maps ? getFictitiousLinks(context.documents.getDocumentByUri(maps.snapshot, uri), maps.maps) : [];
        return [
            ...pluginLinks,
            ...fictitiousLinks,
        ];
        function getFictitiousLinks(document, maps) {
            const result = [];
            for (const [_, map] of maps) {
                for (const mapped of map.map.mappings) {
                    if (!mapped.data.displayWithLink)
                        continue;
                    if (mapped.sourceRange[0] === mapped.sourceRange[1])
                        continue;
                    result.push({
                        range: {
                            start: document.positionAt(mapped.sourceRange[0]),
                            end: document.positionAt(mapped.sourceRange[1]),
                        },
                        target: uri, // TODO
                    });
                }
            }
            return result;
        }
    };
}
exports.register = register;
//# sourceMappingURL=documentLinks.js.map