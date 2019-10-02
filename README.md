# XRP-API Server

An API server that provides a REST-like interface to the XRP Ledger.

### Requirements

- [Node v10 or higher](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/)
- An XRP Ledger account with XRP
    For development, you can use the XRP Test Net and get some test XRP from the [XRP Test Net Faucet](https://developers.ripple.com/xrp-test-net-faucet.html).

### Initial setup

1. Clone this repository (or download and extract a copy).

        git clone git@github.com:ripple/xrp-api.git

2. Install dependencies using Yarn.

        yarn

3. Copy the example configuration file to `.secret_config.js`.

        cp .secret_config-example.js .secret_config.js

4. Generate a random string to use as an API key.

        xxd -l 16 -p /dev/urandom

    If you do not have `xxd` (it comes with [vim](https://www.vim.org/)), you can choose a random string any way you like.

5. Edit the configuration file. Instead of `vim`, you can use another text editor if you prefer.

        vim .secret_config.js

    Replace the following parts of the config file:

    - Set `SERVER_ADDRESS_HERE` to a rippled server's websockets address. In development, you may use the XRP Test Net: `wss://s.altnet.rippletest.net:51233`. This server does not use real XRP. Create a test net account with the [XRP Test Net Faucet](https://xrpl.org/xrp-testnet-faucet.html).
    - Set `ACCOUNT_ADDRESS_HERE` to your XRP Ledger address.
    - Set `RANDOM_STRING_HERE` with the API key you generated in the previous step.
    - Set `ACCOUNT_SECRET_HERE` to your XRP Ledger account secret key.

### Development

To start the server in development mode:

    yarn dev

This starts the server with `nodemon` so that it will be automatically restarted when you save changes to the code.

### Production

As this server is still in active development, we do not recommend using it in production at this time.

Considerations:
- SSL/TLS must be used for all requests. An SSL/TLS termination proxy is recommended.
- Restrictions should be made on signing, such as on the types of transactions, amount/velocity, and whitelisting of destinations. This feature is coming in the future.

### Tutorial

In this simple tutorial, we will get our account's XRP balance, send a payment, and check the status of our payment.

1. Get our account's XRP balance.

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address:

        curl -X GET \
          http://localhost:3000/v1/accounts/{ACCOUNT_ADDRESS_HERE}/info

2. Send a payment.

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address (2 locations), `{API_KEY_HERE}` with your API key, and `{DESTINATION_ADDRESS_HERE}` with a destination address. This example sends 20 XRP:

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
