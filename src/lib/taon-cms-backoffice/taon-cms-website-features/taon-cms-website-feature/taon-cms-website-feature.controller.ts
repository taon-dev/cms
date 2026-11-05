//#region imports
import {
  TaonAuthContextRepository,
  TaonSessionRepository,
} from '@taon-dev/session/src';
import {
  Body,
  DELETE,
  GET,
  Models,
  POST,
  PUT,
  Query,
  Taon,
  TaonBaseController,
  TaonController,
} from 'taon/src';

import { contentError } from '../../../taon-cms-content/taon-cms-content.validation';
import { TaonCmsWebsiteFeatureKvRepository } from './taon-cms-website-feature.kv.repository';
import type { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature.models';
//#endregion

@TaonController<TaonCmsWebsiteFeatureController>({
  className: 'TaonCmsWebsiteFeatureController',
  allowedMethods: ['isEnabled', 'listFeatures', 'addFeature', 'setEnabled', 'deleteFeature'],
})
export class TaonCmsWebsiteFeatureController extends TaonBaseController {
  private readonly features = this.injectKvRepository(TaonCmsWebsiteFeatureKvRepository);

  private readonly sessions = this.injectCustomRepo(TaonSessionRepository);

  private readonly auth = this.injectCustomRepo(TaonAuthContextRepository);

  protected async beforeEachRequest({
    req,
    res,
    methodConfig,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsWebsiteFeatureController>): Promise<void> {
    //#region @backendFunc
    if (methodConfig.methodName === 'isEnabled') {
      return;
    }
    await this.sessions.throwIfNotAuthenticated({ req, res });
    const context = await this.auth.getContext(req.userId, req.sessionId);
    if (!context?.hasAccess?.toManageCms) {
      contentError(t.gettext("You can't manage website features"), 403);
    }
    //#endregion
  }

  @GET()
  isEnabled(@Query('key') key: string): Taon.Response<boolean> {
    //#region @websqlFunc
    return () => this.features.isEnabled(key);
    //#endregion
  }

  @GET()
  listFeatures(): Taon.Response<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    return () => this.features.listFeatures();
    //#endregion
  }

  @POST()
  addFeature(@Body('name') name: string): Taon.Response<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    return () => this.features.addFeature(name);
    //#endregion
  }

  @PUT()
  setEnabled(
    @Query('key') key: string,
    @Body('enabled') enabled: boolean,
  ): Taon.Response<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    return () => this.features.setEnabled(key, enabled);
    //#endregion
  }

  @DELETE()
  deleteFeature(@Query('key') key: string): Taon.Response<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    return () => this.features.deleteFeature(key);
    //#endregion
  }
}
