"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const common_1 = require("../utils/common");
const selectionRange_1 = require("./selectionRange");
function transform(locations, getOtherRange) {
    return locations
        .map(location => (0, selectionRange_1.transform)(location, getOtherRange))
        .filter(common_1.notEmpty);
}
exports.transform = transform;
//# sourceMappingURL=selectionRanges.js.map