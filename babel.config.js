"use strict";

module.exports = function(api) {
  // Cache the returned value forever and don't call this function again.
  api.cache(true);

  const config = {
    "presets": [
      // required to transform `import` to something node understands
      "@babel/preset-env",
      "@babel/typescript"
    ],
    "plugins": [
      "@babel/proposal-class-properties",
      "@babel/proposal-object-rest-spread"
    ]
  };

  return config;
};
