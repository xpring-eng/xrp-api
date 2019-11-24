import fs from 'fs';
let memoizedConfig: any = null;

interface SecretConfig {
  server: string,
  accounts: {
    [index: string]: {
      apiKey: string,
      secret: string
    }
  }
}

export function getConfig(): SecretConfig {
  if (!memoizedConfig) {
    try {
      const configStr = fs.readFileSync('.secret_config.json', {encoding: 'utf8'});
      memoizedConfig = JSON.parse(configStr);
    } catch (err) {
      console.error('Problem loading config file!\nMake sure that you run the "setup" command to generate a valid ".secret_config.json" file in your current working directory.');
      console.error(err);
      process.exit(1);
    }
  }
  return memoizedConfig;
}
  