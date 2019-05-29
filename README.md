# XRP Server

An API server that provides a REST-like interface to the XRP Ledger.

### Requirements

- [Node v10 or higher](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/)
- An XRP Ledger account with XRP
    For development, you can use the XRP Test Net and get some test XRP from the [XRP Test Net Faucet](https://developers.ripple.com/xrp-test-net-faucet.html).

The quick setup instructions also assume you have access to the following:

- [OpenSSL](https://www.openssl.org/)
- [vim](https://www.vim.org/) (and the `xxd` executable it includes)
    You can use another text editor if you prefer.

### Initial setup

1. Clone this repository (or download and extract a copy).

        git clone git@github.com:ripple/xrp-server.git

2. Install dependencies using Yarn.

        yarn

3. Copy the example configuration file to `.secret_config.js`.

        cp .secret_config-example.js .secret_config.js

4. Generate a random string to use as an API key.

        xxd -l 16 -p /dev/urandom

    If you do not have `xxd` (it comes with `vim`), you can choose a random string any way you like.

5. Edit the configuration file.

        vim .secret_config.js

    Replace the following parts of the config file:

    - Set `ACCOUNT_ADDRESS_HERE` to your XRP Ledger address
    - Set `RANDOM_STRING_HERE` with the API key you generated in the previous step
    - Set `ACCOUNT_SECRET_HERE` to your XRP Ledger account secret key

### Development

To start the server in development mode:

    yarn dev

### Tutorial

In this simple tutorial, we will get our account's XRP balance, send a payment, and check the status of our payment.

1. Get our account's XRP balance.

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address:

        curl -X GET \
          http://localhost:3000/api/accounts/{ACCOUNT_ADDRESS_HERE}/info

2. Send a payment.

    In the following example, replace `{ACCOUNT_ADDRESS_HERE}` with your Address (2 locations), `{API_KEY_HERE}` with your API key, and `{DESTINATION_ADDRESS_HERE}` with a destination address. This example sends 20 XRP:

        curl -X POST \
          http://localhost:3000/api/accounts/{ACCOUNT_ADDRESS_HERE}/payments \
          -H 'Authorization: Bearer {API_KEY_HERE}' \
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
          http://localhost:3000/api/transactions/{TRANSACTION_ID}

4. Check the payment status using HTTPS.

    The URL in this example is the same except it uses port **3001** and `https:`. Use the `-k` parameter to skip checking the validity of the (self-signed) certificate:

        curl -k -X GET \
          https://localhost:3001/api/transactions/{TRANSACTION_ID}
