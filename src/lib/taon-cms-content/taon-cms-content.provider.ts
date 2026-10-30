//#region imports
import { Taon, TaonBaseProvider, TaonProvider } from 'taon/src';
import { _ } from 'tnp-core/src';
import { Injectable } from '@angular/core';

//#endregion

@TaonProvider({
  className: 'TaonCmsContentProvider',
})
export class TaonCmsContentProvider extends TaonBaseProvider {
  public siteName: string;

  async _(): Promise<void> {
    if (!this.siteName) {
      throw new Error(`Please provide siteName in TaonCmsContentProvider`);
    }
  }
}
