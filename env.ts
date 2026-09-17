import type { EnvOptions } from 'tnp/src';

const env: Partial<EnvOptions> = {
  website: { domain: 'cms.example.domain.com', title: 'Cms', useDomain: true },
  loading: {
    preAngularBootstrap: {
      background: '#fdebed',
      loader: { name: 'lds-default' },
    },
  },
};
export default env;
