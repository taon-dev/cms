//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsContentPermissionEntity } from './taon-cms-content-permission.entity';
import { TaonCmsContentPermissionProvider } from './taon-cms-content-permission.provider';
//#endregion

@TaonSubscriber<TaonCmsContentPermissionSubscriber>({
  className: 'TaonCmsContentPermissionSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsContentPermissionSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsContentPermissionProvider = this.injectProvider(TaonCmsContentPermissionProvider);
  listenTo(): typeof TaonCmsContentPermissionEntity {
    return TaonCmsContentPermissionEntity;
  }
}