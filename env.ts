import type { EnvOptions } from 'tnp/src';

const env: Partial<EnvOptions> = {
  website: { domain: 'cms.example.domain.com', title: 'Cms', useDomain: true },
  loading: {
    preAngularBootstrap: {
      background: '#fdebed',
      loader: { name: 'lds-default' },
    },
  },
  config: {
    superUsers: () =>
      `$$$TAON_ENCRYPTED_START$$$v1:600000:QYYXA4uI+TLCHMn9EfkVLw==:hU5IdeTPY5XVmjDQ:Rm2+029f549YGWLjirFI8P/ioiZj+4PLUu0Nws8pgmQ=$$$TAON_ENCRYPTED_END$$$`,
    googleSecret: () =>
      `$$$TAON_ENCRYPTED_START$$$v1:600000:yp7FC5OKJvsxCOpQVy25mg==:hJTwPV7WUFHnIBl3:nlaJKk42dFMX5kOi04m7sfhjVMtoMQPUml90Xgm7weZWfGRaDD7+P6JhKhi9rP1Gdv1N$$$TAON_ENCRYPTED_END$$$`,
    googleClientId:
      '289576612173-2mh31b67pmq2qdes5jedno9tr1m542es.apps.googleusercontent.com',
  },
};
export default env;
