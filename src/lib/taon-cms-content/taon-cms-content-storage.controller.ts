//#region imports
import {
  TaonSessionProvider,
  TaonSessionRepository,
} from '@taon-dev/session/src';
import {
  ExpressRequest,
  ExpressResponse,
  TaonBaseStorageController,
  TaonController,
  TaonStorageObject,
  TaonUploadedFile,
  ClassHelpers,
  apiPrefix,
  Models,
} from 'taon/src';
import { UtilsJwt } from 'tnp-core/src';

import { TaonAuthContextRepository } from '../decorators/taon-cms-authorization';

import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { contentError } from './taon-cms-content.validation';
//#endregion

@TaonController<TaonCmsContentStorageController>({
  className: 'TaonCmsContentStorageController',
  // allowedMethods: ['download', 'uploadFormDataToServer'],
})
export class TaonCmsContentStorageController extends TaonBaseStorageController<
  {},
  TaonCmsContentStorageController
> {
  private readonly taonSessionRepository = this.injectCustomRepo(
    TaonSessionRepository,
  );

  private readonly taonAuthContextRepository = this.injectCustomRepo(
    TaonAuthContextRepository,
  );

  private readonly taonCmsContentRepository = this.injectCustomRepo(
    TaonCmsContentRepository,
  );

  private readonly taonSessionProvider =
    this.injectProvider(TaonSessionProvider);

  protected async beforeEachRequest({
    req,
    res,
    methodConfig,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentStorageController>): Promise<void> {
    //#region @backendFunc
    if (methodConfig.methodName !== 'uploadFormDataToServer') {
      return;
    }
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    const context = await this.taonAuthContextRepository.getContext(
      req.userId,
      req.sessionId,
    );
    if (!context?.hasAccess?.toManagePosts) {
      contentError(t.gettext("You can't manage posts"), 403);
    }
    //#endregion
  }

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
    file.originalFileName = file.fileName;
    file.fileName = `${crypto.randomUUID()}__${file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const request = req;
    if (!request) {
      contentError('Upload request context is required.', 500);
    }
    const objects = await super.handleUploadFiles(
      files,
      queryParams,
      request,
      res,
    );
    return Promise.all(
      objects.map(async object => {
        const token = await this.createStorageDownloadToken({
          key: object.key,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
        return {
          ...object,
          downloadUrl: this.buildStorageDownloadUrl({
            req: request,
            key: object.key,
            private: true,
            token,
            download: false,
          }),
        };
      }),
    );
    //#endregion
  }

  afterFileUploadHook(): void {}

  async isMediaObjectAvailable(key: string): Promise<boolean> {
    //#region @backendFunc
    return this.storageObjectExists(key);
    //#endregion
  }

  buildStorageDownloadUrl(options: {
    req: ExpressRequest;
    key: string;
    private: boolean;
    token?: string;
    download?: boolean;
  }): string {
    //#region @backendFunc
    const isLocalhost =
      this.ctx.frontendHostUri.origin.includes('://localhost:');

    const urlFromMehtod = this.getThisControllerMethodFullUrl('download');
    // console.log({ urlFromMehtod });

    const url = new URL(urlFromMehtod);

    url.search = '';
    url.searchParams.set('key', options.key);
    if (options.token) {
      url.searchParams.set('token', options.token);
    }
    if (options.download) {
      url.searchParams.set('download', 'true');
    }
    return (
      `${isLocalhost ? this.ctx.uri.origin : this.ctx.frontendHostUri.origin}` +
      `${url.pathname}${url.search}`
    );
    //#endregion
  }

  async createStorageDownloadToken(options: {
    key: string;
    expiresAt: number;
  }): Promise<string> {
    //#region @backendFunc
    const expiresInSeconds = Math.floor(
      (options.expiresAt - Date.now()) / 1000,
    );
    if (expiresInSeconds <= 0) {
      contentError('Storage download token expiration must be in the future.');
    }
    return UtilsJwt.sign(
      {
        storageController: ClassHelpers.getName(this),
        key: options.key,
        expiresAt: options.expiresAt,
      },
      this.taonSessionProvider.cookies.ACCESS_TOKEN_SECRET,
      { expiresIn: expiresInSeconds },
    );
    //#endregion
  }

  protected async verifyStorageDownloadToken(options: {
    key: string;
    token: string;
  }): Promise<boolean> {
    //#region @backendFunc
    try {
      const payload = await UtilsJwt.verify(
        options.token,
        this.taonSessionProvider.cookies.ACCESS_TOKEN_SECRET,
      );
      return (
        payload.storageController === ClassHelpers.getName(this) &&
        payload.key === options.key &&
        typeof payload.expiresAt === 'number' &&
        payload.expiresAt > Date.now()
      );
    } catch {
      return false;
    }
    //#endregion
  }

  protected async isPublicStorageKey(key: string): Promise<boolean> {
    //#region @backendFunc
    return this.taonCmsContentRepository.isPublicMediaKey(key);
    //#endregion
  }
}
