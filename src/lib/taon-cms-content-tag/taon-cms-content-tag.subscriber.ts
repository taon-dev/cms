//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
import { TaonCmsContentTagProvider } from './taon-cms-content-tag.provider';
//#endregion

@TaonSubscriber<TaonCmsContentTagSubscriber>({
  className: 'TaonCmsContentTagSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsContentTagSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsContentTagProvider = this.injectProvider(TaonCmsContentTagProvider);
  listenTo(): typeof TaonCmsContentTagEntity {
    return TaonCmsContentTagEntity;
  }
}