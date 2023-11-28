"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMarkdownDocumentation = exports.markdownDocumentation = exports.tagsMarkdownPreview = exports.plainWithLinks = void 0;
function replaceLinks(text) {
    return text
        // Http(s) links
        .replace(/\{@(link|linkplain|linkcode) (https?:\/\/[^ |}]+?)(?:[| ]([^{}\n]+?))?\}/gi, (_, tag, link, text) => {
        switch (tag) {
            case 'linkcode':
                return `[\`${text ? text.trim() : link}\`](${link})`;
            default:
                return `[${text ? text.trim() : link}](${link})`;
        }
    });
}
function processInlineTags(text) {
    return replaceLinks(text);
}
function getTagBodyText(tag, filePathConverter, ctx) {
    if (!tag.text) {
        return undefined;
    }
    // Convert to markdown code block if it is not already one
    function makeCodeblock(text) {
        if (text.match(/^\s*[~`]{3}/g)) {
            return text;
        }
        return '```\n' + text + '\n```';
    }
    const text = convertLinkTags(tag.text, filePathConverter, ctx);
    switch (tag.name) {
        case 'example':
            // check for caption tags, fix for #79704
            const captionTagMatches = text.match(/<caption>(.*?)<\/caption>\s*(\r\n|\n)/);
            if (captionTagMatches && captionTagMatches.index === 0) {
                return captionTagMatches[1] + '\n\n' + makeCodeblock(text.slice(captionTagMatches[0].length));
            }
            else {
                return makeCodeblock(text);
            }
        case 'author':
            // fix obfuscated email address, #80898
            const emailMatch = text.match(/(.+)\s<([-.\w]+@[-.\w]+)>/);
            if (emailMatch === null) {
                return text;
            }
            else {
                return `${emailMatch[1]} ${emailMatch[2]}`;
            }
        case 'default':
            return makeCodeblock(text);
    }
    return processInlineTags(text);
}
function getTagDocumentation(tag, filePathConverter, ctx) {
    switch (tag.name) {
        case 'augments':
        case 'extends':
        case 'param':
        case 'template':
            const body = (convertLinkTags(tag.text, filePathConverter, ctx)).split(/^(\S+)\s*-?\s*/);
            if (body?.length === 3) {
                const param = body[1];
                const doc = body[2];
                const label = `*@${tag.name}* \`${param}\``;
                if (!doc) {
                    return label;
                }
                return label + (doc.match(/\r\n|\n/g) ? '  \n' + processInlineTags(doc) : ` — ${processInlineTags(doc)}`);
            }
    }
    // Generic tag
    const label = `*@${tag.name}*`;
    const text = getTagBodyText(tag, filePathConverter, ctx);
    if (!text) {
        return label;
    }
    return label + (text.match(/\r\n|\n/g) ? '  \n' + text : ` — ${text}`);
}
function plainWithLinks(parts, filePathConverter, ctx) {
    return processInlineTags(convertLinkTags(parts, filePathConverter, ctx));
}
exports.plainWithLinks = plainWithLinks;
/**
 * Convert `@link` inline tags to markdown links
 */
function convertLinkTags(parts, filePathConverter, ctx) {
    if (!parts) {
        return '';
    }
    if (typeof parts === 'string') {
        return parts;
    }
    const out = [];
    let currentLink;
    for (const part of parts) {
        switch (part.kind) {
            case 'link':
                if (currentLink) {
                    const text = currentLink.text ?? currentLink.name;
                    let target = currentLink.target;
                    if (typeof currentLink.target === 'object' && 'fileName' in currentLink.target) {
                        const _target = currentLink.target;
                        const fileDoc = ctx.getTextDocument(ctx.env.uriToFileName(_target.fileName));
                        if (fileDoc) {
                            const start = fileDoc.positionAt(_target.textSpan.start);
                            const end = fileDoc.positionAt(_target.textSpan.start + _target.textSpan.length);
                            target = {
                                file: _target.fileName,
                                start: {
                                    line: start.line + 1,
                                    offset: start.character + 1,
                                },
                                end: {
                                    line: end.line + 1,
                                    offset: end.character + 1,
                                },
                            };
                        }
                        else {
                            target = undefined;
                        }
                    }
                    if (target) {
                        const link = filePathConverter.toResource(target.file) + '#' + `L${target.start.line},${target.start.offset}`;
                        out.push(`[${text}](${link})`);
                    }
                    else {
                        if (text) {
                            out.push(text);
                        }
                    }
                    currentLink = undefined;
                }
                else {
                    currentLink = {};
                }
                break;
            case 'linkName':
                if (currentLink) {
                    currentLink.name = part.text;
                    currentLink.target = part.target;
                }
                break;
            case 'linkText':
                if (currentLink) {
                    currentLink.text = part.text;
                }
                break;
            default:
                out.push(part.text);
                break;
        }
    }
    return processInlineTags(out.join(''));
}
function tagsMarkdownPreview(tags, filePathConverter, ctx) {
    return tags.map(tag => getTagDocumentation(tag, filePathConverter, ctx)).join('  \n\n');
}
exports.tagsMarkdownPreview = tagsMarkdownPreview;
function markdownDocumentation(documentation, tags, filePathConverter, ctx) {
    return addMarkdownDocumentation('', documentation, tags, filePathConverter, ctx);
}
exports.markdownDocumentation = markdownDocumentation;
function addMarkdownDocumentation(out, documentation, tags, converter, ctx) {
    if (documentation) {
        out += plainWithLinks(documentation, converter, ctx);
    }
    if (tags) {
        const tagsPreview = tagsMarkdownPreview(tags, converter, ctx);
        if (tagsPreview) {
            out += '\n\n' + tagsPreview;
        }
    }
    return out;
}
exports.addMarkdownDocumentation = addMarkdownDocumentation;
//# sourceMappingURL=previewer.js.map