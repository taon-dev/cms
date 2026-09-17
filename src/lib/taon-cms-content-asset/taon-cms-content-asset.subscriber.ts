//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsContentAssetEntity } from './taon-cms-content-asset.entity';
import { TaonCmsContentAssetProvider } from './taon-cms-content-asset.provider';
//#endregion

@TaonSubscriber<TaonCmsContentAssetSubscriber>({
  className: 'TaonCmsContentAssetSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsContentAssetSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsContentAssetProvider = this.injectProvider(TaonCmsContentAssetProvider);
  listenTo(): typeof TaonCmsContentAssetEntity {
    return TaonCmsContentAssetEntity;
  }
}