//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagProvider } from './taon-cms-tag.provider';
//#endregion

@TaonSubscriber<TaonCmsTagSubscriber>({
  className: 'TaonCmsTagSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsTagSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsTagProvider = this.injectProvider(TaonCmsTagProvider);
  listenTo(): typeof TaonCmsTagEntity {
    return TaonCmsTagEntity;
  }
}