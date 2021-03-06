/*
 * grunt-angular-i18n-finder
 * https://github.com/alicoding/grunt-angular-i18n-finder
 *
 * Copyright (c) 2014 Ali Al Dallal
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var _ = require('lodash');
  var path = require('path');

  grunt.registerMultiTask('angular_i18n_finder', 'Find key name for Angular i18n', function() {
    var options = this.options({filter: 'i18n'});
    var localeJSON = {};
    var files = grunt.file.expand({
            filter: function (filePath) {
              return path.basename(filePath)[0] !== '_';
            }
          }, options.pathToJSON);
    var keys = [];

    var deepKeys = [];
    var serializeDeepKeys = function(root, locales) {
      _.forIn(locales, function(val, key) {
        if(options.format !== "chromeI18n") {
          var parent = (root === null) ? key : root + '.' + key;
          var ignoreGroup = _.contains(options.ignoreKeys, parent + '.*');
          var ignoreSingle = _.contains(options.ignoreKeys, parent);
          if (typeof(locales) === 'object' && ignoreGroup === false) { serializeDeepKeys(parent, val); }
          if (typeof(val) === 'string' && ignoreSingle === false) { deepKeys.push(parent); }
        }
        if(!_.contains(options.ignoreKeys, key)) {
          deepKeys.push(key);
        }
      });
    };

    files.forEach(function(f, i) {
      localeJSON = _.merge(localeJSON, grunt.file.readJSON(f));
      serializeDeepKeys(null, localeJSON);
    });
    localeJSON = deepKeys;

    this.filesSrc.forEach(function (f) {
      if (grunt.file.exists(f)) {
        var content = grunt.file.read(f);
        var matcher = new RegExp("\\{\\{\\s*\\'([^|}]+)\\'\\s*\\|\\s*" + options.filter + "\\s*\\}\\}", 'g');
        var matcher2 = '"\\\'\\s*([^|}]+)\\\'\\s*?\\|\\s*' + options.filter + '\\s*"';

        content.replace(matcher, function(wholeMatch, key) {
          if(key !== undefined) {
            keys.push(key);
          }
        });

        content.replace(new RegExp(matcher2, 'g'), function(wholeMatch, key) {
          if(key !== undefined) {
            keys.push(key);
          }
        });
      }
    });

    var compare = _.difference(localeJSON, keys);

    if (!compare.length) {
      grunt.log.ok("No unused key names found in JSON provided.\n");
    } else {
      grunt.log.warn("Found unused key names in JSON provided.\n",
        "Please consider removing them or add to the ignoreKeys.\n list:", compare);
    }
  });

};
