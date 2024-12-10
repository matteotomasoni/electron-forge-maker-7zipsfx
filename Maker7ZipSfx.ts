import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';
import fs from 'fs';
import rcedit from 'rcedit';
// @ts-ignore
import Seven from 'node-7z';
import sevenBin from '7zip-bin';
import * as signtool from 'signtool';
import { readdirpPromise, ReaddirpOptions } from 'readdirp';

type Maker7ZipSfxConfig = {
  resources:any,
  compressionLevel:number,
  signOptions:signtool.SignOptions|undefined,
  signIncludedExecutables:boolean,
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
  }: MakerOptions): Promise<string[]> {

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

    // Sign all the included executables
    if(typeof this.config.signOptions !== 'undefined' && this.config.signIncludedExecutables === true) {
      const readdirpOptions:Partial<ReaddirpOptions> = {
        fileFilter: (_path) => _path.basename.endsWith(".exe") || _path.basename.endsWith(".dll"),
        depth: 10,
      }
      const files = await readdirpPromise(dir, readdirpOptions)
      for await (const item of files) {
        // If the verify fails, we sign the file
        try{
          await signtool.verify(item, {defaultAuthPolicy:true})
        }
        catch(err) {
          await signtool.sign(item, this.config.signOptions)
        }
      }
    }

    await rcedit(sfxTempPath, rceditConfig);

    await create7ZipSfx(outputExePath, dir + path.sep + '*', sfxTempPath, this.config.compressionLevel);

    // Sign the output executable
    if(typeof this.config.signOptions !== 'undefined') {
      await signtool.sign(outputExePath, this.config.signOptions)
    }

    return [outputExePath];
  }
}

export { Maker7ZipSfx, Maker7ZipSfxConfig };