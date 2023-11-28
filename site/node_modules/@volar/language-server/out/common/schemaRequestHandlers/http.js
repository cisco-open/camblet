"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_light_1 = require("request-light");
function handler(uri) {
    const headers = { 'Accept-Encoding': 'gzip, deflate' };
    return (0, request_light_1.xhr)({ url: uri, followRedirects: 5, headers }).then(response => {
        if (response.status !== 200) {
            return;
        }
        return response.responseText;
    }, (error) => {
        return Promise.reject(error.responseText || (0, request_light_1.getErrorStatusDescription)(error.status) || error.toString());
    });
}
exports.default = handler;
//# sourceMappingURL=http.js.map