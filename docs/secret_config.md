# Configuration

RippleAPI requires a config file named `.secret_config.js`. The leading dot `.` indicates that it's a hidden a file and it should not be accessible to anyone (other than the RippleAPI server).

## Initial setup

1. Create the configuration file by copying the example configuration file.

        cp .secret_config-example.js .secret_config.js

2. Generate a random string to use as an API key. One way is to use `xxd` (it comes with `vim`), but you can generate a random string in a different manner. Ensure that the string is secure and has high entropy.

        xxd -l 16 -p /dev/urandom

3. Edit the configuration file. You can use `vim` or any text editor.

        vim .secret_config.js

    Replace the following parts of the config file:

    - Set `ACCOUNT_ADDRESS_HERE` to your XRP Ledger address
    - Set `RANDOM_STRING_HERE` with the API key you generated in the previous step
    - Set `ACCOUNT_SECRET_HERE` to your XRP Ledger account secret key

4. Aside from the configuration file, RippleAPI requires https setup. Make an `https` folder and change into it.

        mkdir https
        cd https

5. Create a self-signed certificate for serving HTTPS (in development mode).

        openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

    This command prompts you for some information about the certificate. It doesn't matter what information you provide since you are only using this certificate for local development anyway.

6. Change back to the parent directory.

        cd ..

In production, you may use a proxy for https.

## Details

* `.secret_config.js` must export your RippleAPI server's configuration.
* Multiple XRP Ledger accounts are supported by adding additional objects under `accounts`. You can give each account a different `apiKey`; `apiKey` must be repeated for each account.
* Since the config file is a JavaScript file ending in `.js`, you can use comments and arbitrary JavaScript code, if needed. For example, if you want to use an environment variable, you could use something like:

            "secret": process.env['FUNDING_SECRET']
