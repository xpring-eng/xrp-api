## Logging

Some logging is disabled by default. During development, you can enable certain categories with the `NODE_DEBUG` environment variable. The available categories are:

* `paths` - log request paths and response validation errors
* `ripple-api` - log debug messages in the RippleAPI layer

Example:

    NODE_DEBUG=paths yarn dev

You can specify multiple categories separated by `,`:

    NODE_DEBUG=paths,ripple-api yarn dev
