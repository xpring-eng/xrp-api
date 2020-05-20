## Running unit tests

By default, unit tests will use your config file (`.secret_config.js`), so you will need to set up your server first (`yarn run setup`). After your config file is ready, run the unit tests:

    yarn test

Alternatively, you can run tests with the example config:

    IN_CI_ENVIRONMENT=1 yarn test

CI (continuous integration) runs the tests and creates code coverage data like so:

    IN_CI_ENVIRONMENT=1 yarn run coverage

## Logging

Some logging is disabled by default. During development, you can enable certain categories with the `NODE_DEBUG` environment variable. The available categories are:

* `paths` - log request paths and response validation errors
* `ripple-api` - log debug messages in the RippleAPI layer

Example:

    NODE_DEBUG=paths yarn dev

You can specify multiple categories separated by `,`:

    NODE_DEBUG=paths,ripple-api yarn dev
