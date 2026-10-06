//#region imports
import {
  ExpressRequest,
  ExpressResponse,
  TaonBaseStorageController,
  TaonController,
  TaonStorageObject,
  TaonUploadedFile,
} from 'taon/src';

import { contentError } from './taon-cms-content.validation';
//#endregion

@TaonController<TaonCmsContentStorageController>({
  className: 'TaonCmsContentStorageController',
  allowedMethods: ['exists', 'download', 'getMetadata', 'uploadFormDataToServer'],
})
export class TaonCmsContentStorageController extends TaonBaseStorageController {
  protected async handleUploadFiles(
    files: TaonUploadedFile[],
    queryParams?: {},
    req?: ExpressRequest,
    res?: ExpressResponse,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    if (files.length !== 1) {
      contentError('Exactly one media file must be uploaded.');
    }
    const file = files[0];
    // Unique keys prevent uploads from overwriting another post or revision.
    file.fileName = `${crypto.randomUUID()}__${file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    return super.handleUploadFiles(files, queryParams, req, res);
    //#endregion
  }

  afterFileUploadHook(): void {}

  buildStorageDownloadUrl(): string {
    throw new Error('Use the download endpoint for CMS media.');
  }

  async createStorageDownloadToken(): Promise<string> {
    throw new Error('CMS media download tokens are not enabled.');
  }
}
