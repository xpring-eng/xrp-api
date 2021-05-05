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

## Updating Docs

The [API Reference](https://xpring-eng.github.io/xrp-api/) is based on the [`api-doc.yml` file](../api-doc.yml) and hosted using GitHub Pages. To update it, you need to have [Dactyl](https://github.com/ripple/dactyl/) installed (`pip install dactyl`). Then complete the following steps:

1. Merge changes from the master branch into the `gh-pages` branch.

        # From the repo base directory:
        git checkout master
        git pull
        git switch gh-pages
        git merge master

2. Build the API docs using the OpenAPI spec:

        dactyl_build --openapi api-doc.yml -o .

3. Commit the updated HTML files:

        git add ./*.html
        git commit -m "[gh-pages] Update docs"
        git push

4. Wait a couple minutes for changes to propagate.
