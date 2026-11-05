export namespace TaonCmsWebsiteFeatureModels {
  export interface Feature {
    key: string;
    name: string;
    enabled: boolean;
  }

  export enum TaonCmsWebsiteFeatureState {
    Active = 'active',
    Inactive = 'inactive',
  }
}