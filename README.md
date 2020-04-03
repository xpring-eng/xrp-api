# XRP API Server

An API server that provides a REST-like interface to the XRP Ledger.


## [➡️ XRP API Reference Documentation](https://xrpl.org/xrp-api.html)

See the full reference documentation on the XRP Ledger Dev Portal.

## Building with TypeScript, JavaScript, or Node.js?

Instead of XRP API, you can use [ripple-lib](https://github.com/ripple/ripple-lib) for a native integration experience and access to more advanced XRP Ledger features.

### Requirements

- [Node v10 or higher](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/)
- An XRP Ledger account with XRP

    For development, you can use the XRP Testnet and get some test XRP from the [XRP Testnet Faucet](https://xrpl.org/xrp-testnet-faucet.html). The setup script will do this for you automatically.

### Initial setup

1. Clone this repository (or download and extract a copy).

        git clone git@github.com:xpring-eng/xrp-api.git

    Change directory into the project.

        cd xrp-api

2. Install dependencies using Yarn.

        yarn install

3. Set up your configuration file for the first time.

        yarn run setup

### Development

To start the server in development mode:

    yarn dev

This starts the server with `nodemon` so that it will be automatically restarted when you save changes to the code.

The default port is 3000. To use a custom port, use `yarn dev <port>`. Example:

    yarn dev 3001

### Production

If you would like to use xrp-api in production with real funds, please contact us! We will assist with your secure deployment.

Considerations:

- SSL/TLS must be used for all requests. An SSL/TLS termination proxy is recommended.
- Restrictions should be made on signing, such as on the types of transactions, amount/velocity, and whitelisting of destinations. This feature is coming in the future.
- If an error occurs, the server will exit to protect security & data integrity. We recommend using [PM2](https://www.npmjs.com/package/pm2), [nodemon](https://www.npmjs.com/package/nodemon), or [forever](https://www.npmjs.com/package/forever) to restart the server if it crashes in production.

### Tutorial

In this simple tutorial, we will get our account's XRP balance, send a payment, and check the status of our payment.

1. Get our account's XRP balance.

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address:

        curl -X GET \
          http://localhost:3000/v1/accounts/{ACCOUNT_ADDRESS_HERE}/info

2. Send a payment

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address (2 locations), `{API_KEY_HERE}` with your API key, and `{DESTINATION_ADDRESS_HERE}` with a destination address. If you are using the Testnet, you can use the address `rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe` as a destination.

        curl -X POST \
           http://localhost:3000/v1/payments \
           -H 'Authorization: Bearer {API_KEY_HERE}' \
           -H 'Content-Type: application/json' \
           -d '{
             "payment": {
                 "source_address": "{ACCOUNT_ADDRESS_HERE}",
                 "source_amount": {
                     "value": "20",
                     "currency": "XRP"
                 },
                 "destination_address": "{DESTINATION_ADDRESS_HERE}",
                 "destination_amount": {
                     "value": "20",
                     "currency": "XRP"
                 }
             },
             "submit": true
         }'


    The response shows the transaction's identifying hash in the `hash` field of the `tx_json` object. Take note of this value for the next step.

3. Check the status of the payment.

    In the following example, replace `{TRANSACTION_ID}` with the transaction's identifying hash from the previous step:

        curl -X GET \
          http://localhost:3000/v1/transactions/{TRANSACTION_ID}

### Docker Container

You can also run the service in a docker container using the Dockerfile in this repo.

1. Be sure you have done the secret_config step from the Initial Setup section.
2. Build the container.

    ```docker build . -t <some_tag>```
3. Run the container.

   ```docker run -it -p 3000:3000 -v <path_to_secret_config>/.secret_config.js:/xrp-api/.secret_config.js <some_tag>```

4. You should now be able to run the steps in the tutorial.
