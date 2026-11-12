//#region imports
import { Injectable } from '@angular/core';
import { TaonBaseAngularService } from 'taon/src';

import { TaonCmsWebsiteFeatureController } from './taon-cms-website-feature.controller';
import type { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature.models';
import { map, Observable, startWith } from 'rxjs';
//#endregion

@Injectable()
export class TaonCmsWebsiteFeatureApiService extends TaonBaseAngularService {
  private readonly taonCmsWebsiteFeatureController = this.inject(
    TaonCmsWebsiteFeatureController,
  );

  /**
   * Reads a context-scoped flag without admin access or creating records.
   * Missing records/values, including deleted flags, default to true.
   * Read failures reject and never enable a flag.
   */
  async isEnabled(key: string): Promise<boolean> {
    const response = await this.taonCmsWebsiteFeatureController
      .isEnabled(key)
      .request();
    if (
      response.statusCode >= 400 ||
      (response.body.text !== 'true' && response.body.text !== 'false')
    ) {
      throw new Error(
        response.responseText || 'The website feature could not be read.',
      );
    }
    return response.body.text === 'true';
  }

  isEnabled$(key: string): Observable<boolean> {
    return this.taonCmsWebsiteFeatureController.isEnabled(key)
      .request!().observable.pipe(map(c => c.body.booleanValue));
  }

  async listFeatures(): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    const response = await this.taonCmsWebsiteFeatureController
      .listFeatures()
      .request();
    return this.readFeatures(response);
  }

  async addFeature(
    name: string,
  ): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    const response = await this.taonCmsWebsiteFeatureController
      .addFeature(name)
      .request();
    return this.readFeatures(response);
  }

  async setEnabled(
    key: string,
    enabled: boolean,
  ): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    const response = await this.taonCmsWebsiteFeatureController
      .setEnabled(key, enabled)
      .request();
    return this.readFeatures(response);
  }

  async deleteFeature(
    key: string,
  ): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    const response = await this.taonCmsWebsiteFeatureController
      .deleteFeature(key)
      .request();
    return this.readFeatures(response);
  }

  private readFeatures(response: {
    statusCode: number;
    responseText: string;
    body: { json: TaonCmsWebsiteFeatureModels.Feature[] };
  }): TaonCmsWebsiteFeatureModels.Feature[] {
    if (response.statusCode >= 400 || !Array.isArray(response.body?.json)) {
      throw new Error(
        response.responseText ||
          'Website features could not be saved or loaded.',
      );
    }
    return response.body.json;
  }
}
