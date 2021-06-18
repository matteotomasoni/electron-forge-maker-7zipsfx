"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const maker_base_1 = __importDefault(require("@electron-forge/maker-base"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const rcedit_1 = __importDefault(require("rcedit"));
// @ts-ignore
const node_7z_1 = __importDefault(require("node-7z"));
const _7zip_bin_1 = __importDefault(require("7zip-bin"));
const signtool = __importStar(require("signtool"));
function create7ZipSfx(archivePath, sources, sfxImagePath, compressionLevel = 5) {
    return new Promise(function (resolve, reject) {
        let stream = node_7z_1.default.add(archivePath, sources, {
            $bin: _7zip_bin_1.default.path7za,
            recursive: true,
            sfx: sfxImagePath,
            deleteFilesAfter: false,
            method: ['x=' + compressionLevel],
        });
        stream.on('end', () => resolve(true));
        stream.on('error', (err) => reject(err));
    });
}
class Maker7ZipSfx extends maker_base_1.default {
    constructor() {
        super(...arguments);
        this.name = '7zipsfx';
        this.defaultPlatforms = ['win32'];
    }
    isSupportedOnCurrentPlatform() {
        return true;
    }
    make({ dir, makeDir, appName, packageJSON, targetArch, targetPlatform, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalSfxPath = path_1.default.resolve(__dirname, '7zS2.sfx');
            const sfxTempPath = path_1.default.resolve(makeDir, 'sfx.tmp');
            const exeName = `${appName}-${packageJSON.version}-Portable.exe`;
            const outputExePath = path_1.default.resolve(makeDir, exeName);
            const author = typeof packageJSON.author == 'object' ? packageJSON.author.name : packageJSON.author;
            //https://docs.microsoft.com/it-it/windows/win32/menurc/versioninfo-resource?redirectedfrom=MSDN
            const rceditConfig = Object.assign(Object.assign({ 'version-string': {
                    'ProductName': appName,
                    'FileDescription': packageJSON.description || appName,
                    'CompanyName': author,
                    'LegalCopyright': `Copyright © ${(new Date()).getFullYear()} ${author}`,
                    'OriginalFilename': exeName,
                    'InternalName': exeName,
                }, 'file-version': packageJSON.version, 'product-version': packageJSON.version }, this.config.resources), { 
                // 'requested-execution-level': 'asInvoker',
                'application-manifest': path_1.default.resolve(__dirname, 'Manifest.xml') });
            yield this.ensureFile(outputExePath);
            fs_1.default.copyFileSync(originalSfxPath, sfxTempPath);
            yield rcedit_1.default(sfxTempPath, rceditConfig);
            yield create7ZipSfx(outputExePath, dir + path_1.default.sep + '*', sfxTempPath, this.config.compressionLevel);
            if (this.config.hasOwnProperty('signOptions') && this.config.signOptions !== false) {
                yield signtool.sign(outputExePath, this.config.signOptions);
            }
            return [outputExePath];
        });
    }
}
exports.default = Maker7ZipSfx;
//# sourceMappingURL=Maker7ZipSfx.js.map