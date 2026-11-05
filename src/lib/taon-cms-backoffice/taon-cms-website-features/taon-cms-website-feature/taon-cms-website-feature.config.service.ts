//#region imports
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import { TaonCmsWebsiteFeatureProvider } from './taon-cms-website-feature.provider';
//#endregion

@Injectable()
export class TaonCmsWebsiteFeatureConfigService extends TaonBaseAngularService {
  private taonCmsWebsiteFeatureProvider = this.injectProvider(TaonCmsWebsiteFeatureProvider);

  get isEnableOption() {
    return this.taonCmsWebsiteFeatureProvider.enabledTaonCmsWebsiteFeatureOption;
  }

  clone(): Partial<TaonCmsWebsiteFeatureProvider> {
    const cloned = this.taonCmsWebsiteFeatureProvider.clone();
    return cloned;
  }
}