//#region imports
import { Taon, TaonBaseClass, TaonBaseProvider, TaonProvider } from 'taon/src';
import { _ } from 'tnp-core/src';
//#endregion

export class TaonTaonCmsWebsiteFeatureConfig extends TaonBaseClass {
  declare name: string;
}

@TaonProvider({
  className: 'TaonCmsWebsiteFeatureProvider',
})
export class TaonCmsWebsiteFeatureProvider extends TaonBaseProvider {
  enabledTaonCmsWebsiteFeatureOption: boolean = true;
  config = new TaonTaonCmsWebsiteFeatureConfig();
  clone() {
    return {
      enabledTaonCmsWebsiteFeatureOption: this.enabledTaonCmsWebsiteFeatureOption,
      config: this.config.clone(),
    };
  }
}