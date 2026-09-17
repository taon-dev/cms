//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentProvider } from './taon-cms-content.provider';
//#endregion

@TaonSubscriber<TaonCmsContentSubscriber>({
  className: 'TaonCmsContentSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsContentSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsContentProvider = this.injectProvider(TaonCmsContentProvider);
  listenTo(): typeof TaonCmsContentEntity {
    return TaonCmsContentEntity;
  }
}