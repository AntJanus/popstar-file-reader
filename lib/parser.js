"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

require("core-js/shim");

var _ = _interopRequire(require("lodash"));

var parser = function parser(options) {
  this.globalOptions = {
    split: /-{3,}(\r\n|\r|\n)/g,
    varSplit: /^(\w+)(\[\])?:/,
    arraySplit: /\[\]/
  };

  this.options = function (options) {
    if (options) {
      _.extend(this.globalOptions, options);
      return this;
    } else {
      return this.globalOptions;
    }
  };

  if (options) {
    _.extend(this.globalOptions, options);
    return this;
  }

  return this;
};

parser.prototype = {

  parseFile: function parseFile(fileString) {
    var parts = fileString.split(this.globalOptions.split);
    var data = {};
    var self = this;
    _.each(parts, function (part) {
      var parsed = self.parseVariable(part);
      if (parsed !== false) {
        if (parsed.array == true) {
          if (!_.isArray(data[parsed.name])) {
            data[parsed.name] = [];
          }
          data[parsed.name].push(parsed.content);
        } else {
          data[parsed.name] = parsed.content;
        }
      }
    });

    return data;
  },

  parseVariable: function parseVariable(varString) {
    var parsedString = {};
    var name = varString.match(this.globalOptions.varSplit);
    if (_.isEmpty(name)) {
      return false;
    } else {

      parsedString.array = this.arrayCheck(name[0]);
      parsedString.name = name[0].slice(0, parsedString.array ? -3 : -1).trim();
      parsedString.content = varString.replace(this.globalOptions.varSplit, "").trim();

      return parsedString;
    }
  },

  arrayCheck: function arrayCheck(varString) {
    if (!_.isEmpty(varString.match(this.globalOptions.arraySplit))) {
      return true;
    }

    return false;
  } };

module.exports = parser;