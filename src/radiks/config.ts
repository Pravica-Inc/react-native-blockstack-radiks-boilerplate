import { Platform } from 'react-native';

interface Config {
  apiServer: string;
  userSession: any;
}

// Change your domain URL
const domainUrl = 'https://example.com';
export const defaultconfig = {
  appDomain: domainUrl,
  manifestURI: `${domainUrl}/manifest.json`,
  redirectUrl:
    Platform.OS === 'ios' ? `${domainUrl}/redirect.html` : 'redirect.html',
  scopes: ['store_write', 'publish_data'],
  coreNode: 'https://core.blockstack.org',
  authenticatorURL: 'https://browser.blockstack.org/auth',
  apiServer: domainUrl,
};

let config: Config = {
  ...defaultconfig,
  userSession: { config: {} },
};

export const configure = (newConfig: Config) => {
  config = {
    ...config,
    ...newConfig,
  };
};

/**
 * some info
 */
export const getConfig = (): Config => config;
