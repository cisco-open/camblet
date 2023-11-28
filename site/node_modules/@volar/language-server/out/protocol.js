"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetVirtualFileRequest = exports.GetVirtualFilesRequest = exports.ReloadProjectNotification = exports.WriteVirtualFilesNotification = exports.LoadedTSFilesMetaRequest = exports.AutoInsertRequest = exports.GetMatchTsConfigRequest = exports.FindFileReferenceRequest = exports.FsStatRequest = exports.FsReadDirectoryRequest = exports.FsReadFileRequest = void 0;
const vscode = require("vscode-languageserver-protocol");
/**
 * Server request client
 */
var FsReadFileRequest;
(function (FsReadFileRequest) {
    FsReadFileRequest.type = new vscode.RequestType('volar/server/fs/readFile');
})(FsReadFileRequest || (exports.FsReadFileRequest = FsReadFileRequest = {}));
var FsReadDirectoryRequest;
(function (FsReadDirectoryRequest) {
    FsReadDirectoryRequest.type = new vscode.RequestType('volar/server/fs/readDirectory');
})(FsReadDirectoryRequest || (exports.FsReadDirectoryRequest = FsReadDirectoryRequest = {}));
var FsStatRequest;
(function (FsStatRequest) {
    FsStatRequest.type = new vscode.RequestType('volar/server/fs/stat');
})(FsStatRequest || (exports.FsStatRequest = FsStatRequest = {}));
/**
 * Client request server
 */
var FindFileReferenceRequest;
(function (FindFileReferenceRequest) {
    FindFileReferenceRequest.type = new vscode.RequestType('volar/client/findFileReference');
})(FindFileReferenceRequest || (exports.FindFileReferenceRequest = FindFileReferenceRequest = {}));
var GetMatchTsConfigRequest;
(function (GetMatchTsConfigRequest) {
    GetMatchTsConfigRequest.type = new vscode.RequestType('volar/client/tsconfig');
})(GetMatchTsConfigRequest || (exports.GetMatchTsConfigRequest = GetMatchTsConfigRequest = {}));
var AutoInsertRequest;
(function (AutoInsertRequest) {
    AutoInsertRequest.type = new vscode.RequestType('volar/client/autoInsert');
})(AutoInsertRequest || (exports.AutoInsertRequest = AutoInsertRequest = {}));
var LoadedTSFilesMetaRequest;
(function (LoadedTSFilesMetaRequest) {
    LoadedTSFilesMetaRequest.type = new vscode.RequestType0('volar/client/loadedTsFiles');
})(LoadedTSFilesMetaRequest || (exports.LoadedTSFilesMetaRequest = LoadedTSFilesMetaRequest = {}));
var WriteVirtualFilesNotification;
(function (WriteVirtualFilesNotification) {
    WriteVirtualFilesNotification.type = new vscode.NotificationType('volar/client/writeVirtualFiles');
})(WriteVirtualFilesNotification || (exports.WriteVirtualFilesNotification = WriteVirtualFilesNotification = {}));
var ReloadProjectNotification;
(function (ReloadProjectNotification) {
    ReloadProjectNotification.type = new vscode.NotificationType('volar/client/reloadProject');
})(ReloadProjectNotification || (exports.ReloadProjectNotification = ReloadProjectNotification = {}));
var GetVirtualFilesRequest;
(function (GetVirtualFilesRequest) {
    GetVirtualFilesRequest.type = new vscode.RequestType('volar/client/virtualFiles');
})(GetVirtualFilesRequest || (exports.GetVirtualFilesRequest = GetVirtualFilesRequest = {}));
var GetVirtualFileRequest;
(function (GetVirtualFileRequest) {
    GetVirtualFileRequest.type = new vscode.RequestType('volar/client/virtualFile');
})(GetVirtualFileRequest || (exports.GetVirtualFileRequest = GetVirtualFileRequest = {}));
//# sourceMappingURL=protocol.js.map