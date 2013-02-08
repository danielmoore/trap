'use strict';

var defaultConfig = require('./defaultConfig')
  , fs = require('fs')
  , path = require('path')
  , existsSync = fs.existsSync || path.existsSync;

module.exports.defaultConfigFileName = 'trap.config.js';

function computeConfig(config) {
  var result = {};
  Object.keys(defaultConfig).forEach(function (key) {
    result[key] = config.hasOwnProperty(key) ? config[key] : defaultConfig[key];
  });

  Object.keys(config).forEach(function (key) {
    if (!result.hasOwnProperty(key))
      result[key] = config[key];
  });

  return result;
}

module.exports.load = function (configPath) {
  var config = configPath && existsSync(configPath) && require(configPath);

  if (!config) return defaultConfig;

  return Object.freeze(computeConfig(config));
};