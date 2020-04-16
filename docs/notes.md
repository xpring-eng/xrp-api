# Notes

* We do not use `@babel/node` (babel-node) because [it is not for production use](https://babeljs.io/docs/en/babel-node). While it can be used in development, it causes differing behavior. For example, `express-openapi`'s `paths` only consider `.js` files, not `.ts` files. There are workarounds, like specifying the routes in the form `{ path: '/foo/{id}', module: require(./handlers/foo') }`. But from a DevOps perspective, it is still risky for development to differ substantially from production.
* If you do use babel-node, then `import '@babel/polyfill';` is not needed, as it is imported automatically. However, you would still need to import it in production.
* Routes (API endpoints) are read from `./dist/api-v3/`.
  * When adding or changing routes, you must run `build`: `babel src --extensions '.ts' --out-dir dist`.
  * When removing routes, you must run `clean`: `rm -r dist` and then `build`.
  * When running tests (`mocha`), in order for recent changes to be reflected, run `clean` and `build`.

## Adding a new endpoint

1. Add in `api-doc.yml`
2. Add in `./src/api-v3/paths/...`
