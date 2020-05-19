interface SecretConfig {
  server: string;
  accounts: {
    [index: string]: {
      apiKey: string;
      secret: string;
    };
  };
}

let memoizedConfig: SecretConfig;

export function getConfig(): SecretConfig {
  if (!memoizedConfig) {
    try {
      if (process.env.IN_CI_ENVIRONMENT) {
        memoizedConfig = require('../.secret_config-example.js');
      } else {
        memoizedConfig = require('../.secret_config.js');
      }
    } catch (err) {
      console.error('Problem loading config file!\nMake sure that you run the "setup" command to generate a valid ".secret_config.js" file in your current working directory.');
      console.error(err);
      process.exit(1);
    }
  }
  return memoizedConfig;
}
