"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const common_1 = require("../utils/common");
const locationLike_1 = require("./locationLike");
function transform(locations, getOtherRange) {
    return locations
        .map(location => (0, locationLike_1.transform)(location, getOtherRange))
        .filter(common_1.notEmpty);
}
exports.transform = transform;
//# sourceMappingURL=locationsLike.js.map