declare const SecretConfig: {
  server: string,
  accounts: {
    [index: string]: {
      apiKey: string,
      secret: string
    }
  }
}

export = SecretConfig
