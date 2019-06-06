// Make sure to use eslint --ext .js,.ts since by default eslint will only search for .js files.

module.exports = {
  parser: '@typescript-eslint/parser',
  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/parser/README.md
  parserOptions: {
    project: './tsconfig.json'
  },

  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],

  rules: {
    // note you must disable the base rule as it can report incorrect errors
    "indent": "off",
    "@typescript-eslint/indent": ["error", 2],

    // https://github.com/typescript-eslint/typescript-eslint/issues/434
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],

    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],

    // note you must disable the base rule as it can report incorrect errors
    // "semi": "off",
    // "@typescript-eslint/semi": ["error"]
  }
}
