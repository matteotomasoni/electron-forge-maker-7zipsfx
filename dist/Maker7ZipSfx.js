"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _makerBase = _interopRequireDefault(require("@electron-forge/maker-base"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _util = require("util");

var _SevenBin = _interopRequireDefault(require('7zip-bin'));

const _Seven = _interopRequireDefault(require('node-7z'));

var _rcedit = _interopRequireDefault(require('rcedit'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function create7ZipSfx(archivePath, sources, sfxImagePath, compressionLevel = 5) {
  return new Promise(function(resolve, reject) {
    let stream = _Seven.default.add(archivePath, sources, {
      $bin: _SevenBin.default.path7za,
      recursive: true,
      sfx: sfxImagePath,
      deleteFilesAfter: false,
      method: ['x=' + compressionLevel],
    })
    stream.on('end', () => resolve())
    stream.on('error', (err) => reject(err))
  });
}


class Maker7ZipSfx extends _makerBase.default {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "name", '7zipsfx');

    _defineProperty(this, "defaultPlatforms", ['win32']);
  }

  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
    targetPlatform
  }) {

    const originalSfxPath = _path.default.resolve(__dirname, '7zS2.sfx');
    const sfxTempPath = _path.default.resolve(makeDir, 'sfx.tmp');
    const exeName = `${appName}-${packageJSON.version}-Portable.exe`
    const outputExePath = _path.default.resolve(makeDir, exeName);
    const author = typeof packageJSON.author == 'object' ? packageJSON.author.name : packageJSON.author

    //https://docs.microsoft.com/it-it/windows/win32/menurc/versioninfo-resource?redirectedfrom=MSDN
    const rceditConfig = _objectSpread({
      'version-string': {
        'ProductName': appName,
        'FileDescription': packageJSON.description || appName,
        'CompanyName': author,
        'LegalCopyright': `Copyright © ${(new Date()).getFullYear()} ${author}`,
        'OriginalFilename': exeName,
        'InternalName': exeName,
      },
      'file-version': packageJSON.version,
      'product-version': packageJSON.version,
    }, this.config.resources, {
      // 'requested-execution-level': 'asInvoker',
      'application-manifest': _path.default.resolve(__dirname, 'Manifest.xml'),
    });

    await this.ensureFile(outputExePath);

    _fs.default.copyFileSync(originalSfxPath, sfxTempPath);

    await _rcedit.default(sfxTempPath, rceditConfig);

    await create7ZipSfx(outputExePath, dir + _path.default.sep + '*', sfxTempPath, this.config.compressionLevel);

    return [outputExePath];
  }


}

exports.default = Maker7ZipSfx;
