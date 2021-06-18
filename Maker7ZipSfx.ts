import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';
import fs from 'fs';
import rcedit from 'rcedit';
// @ts-ignore
import Seven from 'node-7z';
import sevenBin from '7zip-bin';
import * as signtool from 'signtool';

export type Maker7ZipSfxConfig = {
  resources:any,
  compressionLevel:number,
  signOptions:signtool.SignOptions|false,
};


function create7ZipSfx(archivePath:string, sources:string, sfxImagePath:string, compressionLevel:number = 5) {
  return new Promise(function(resolve, reject) {
    let stream = Seven.add(archivePath, sources, {
      $bin: sevenBin.path7za,
      recursive: true,
      sfx: sfxImagePath,
      deleteFilesAfter: false,
      method: ['x=' + compressionLevel],
    })
    stream.on('end', () => resolve(true))
    stream.on('error', (err:any) => reject(err))
  });
}
  

export default class Maker7ZipSfx extends MakerBase<Maker7ZipSfxConfig> {
  name = '7zipsfx';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
    targetPlatform,
  }: MakerOptions) {

    const originalSfxPath = path.resolve(__dirname, '7zS2.sfx');
    const sfxTempPath = path.resolve(makeDir, 'sfx.tmp');
    const exeName = `${appName}-${packageJSON.version}-Portable.exe`
    const outputExePath = path.resolve(makeDir, exeName);
    const author = typeof packageJSON.author == 'object' ? packageJSON.author.name : packageJSON.author

    //https://docs.microsoft.com/it-it/windows/win32/menurc/versioninfo-resource?redirectedfrom=MSDN
    const rceditConfig = {
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
      ... this.config.resources,
      // 'requested-execution-level': 'asInvoker',
      'application-manifest': path.resolve(__dirname, 'Manifest.xml'),
    };

    await this.ensureFile(outputExePath);

    fs.copyFileSync(originalSfxPath, sfxTempPath);

    await rcedit(sfxTempPath, rceditConfig);

    await create7ZipSfx(outputExePath, dir + path.sep + '*', sfxTempPath, this.config.compressionLevel);

    if(this.config.hasOwnProperty('signOptions') && this.config.signOptions !== false) {
      await signtool.sign(outputExePath, this.config.signOptions)
    }

    return [outputExePath];
  }
}