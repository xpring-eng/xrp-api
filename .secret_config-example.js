/* Note: Run `yarn setup` to automatically generate an initial .secret_config.js file for testing and development. */
module.exports = {
    "server": "{{SERVER_ADDRESS_HERE}}",
    "accounts": {
        "{{ACCOUNT_ADDRESS_HERE}}": {
            "apiKey": "{{RANDOM_STRING_HERE}}",
            "secret": "{{ACCOUNT_SECRET_HERE}}"
        }
    }
}
