const serviceSettings = {
  discoveryUrl: process.env.WEB_DISCOVERY_URL || 'https://login-stg.pwc.com/openam/oauth2/.well-known/openid-configuration',
};

export default Object.assign(
  {},
  { serviceSettings }
);