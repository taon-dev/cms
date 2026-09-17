//#region imports
import { Taon, TaonBaseProvider, TaonProvider } from 'taon/src';
import { _ } from 'tnp-core/src';
import { Injectable } from '@angular/core';
//#endregion

@TaonProvider({
  className: 'TaonCmsCommentProvider',
})
//#region @browser
@Injectable()
//#endregion
export class TaonCmsCommentProvider extends TaonBaseProvider {



}