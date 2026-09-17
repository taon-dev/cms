//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionProvider } from './taon-cms-content-revision.provider';
//#endregion

@TaonSubscriber<TaonCmsContentRevisionSubscriber>({
  className: 'TaonCmsContentRevisionSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsContentRevisionSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsContentRevisionProvider = this.injectProvider(TaonCmsContentRevisionProvider);
  listenTo(): typeof TaonCmsContentRevisionEntity {
    return TaonCmsContentRevisionEntity;
  }
}