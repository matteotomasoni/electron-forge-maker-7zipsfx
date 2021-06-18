import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import * as signtool from 'signtool';
export declare type Maker7ZipSfxConfig = {
    resources: any;
    compressionLevel: number;
    signOptions: signtool.SignOptions | undefined;
    signIncludedExecutables: boolean;
};
export default class Maker7ZipSfx extends MakerBase<Maker7ZipSfxConfig> {
    name: string;
    defaultPlatforms: ForgePlatform[];
    isSupportedOnCurrentPlatform(): boolean;
    make({ dir, makeDir, appName, packageJSON, targetArch, targetPlatform, }: MakerOptions): Promise<string[]>;
}
