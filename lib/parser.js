'use strict';

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj['default'] : obj; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

require('core-js/shim');

var _import = require('lodash');

var _ = _interopRequire(_import);

var parser = (function () {
  function parser(options) {
    _classCallCheck(this, parser);

    this.globalOptions = {
      split: /-{3,}(\r\n|\r|\n)/g,
      varSplit: /^(\w+)(\[\])?:/,
      arraySplit: /\[\]/
    };

    if (options) {
      _.extend(this.globalOptions, options);
    }
  }

  _createClass(parser, [{
    key: 'options',
    value: (function (_options) {
      function options(_x) {
        return _options.apply(this, arguments);
      }

      options.toString = function () {
        return options.toString();
      };

      return options;
    })(function (options) {
      if (options) {
        _.extend(this.globalOptions, options);
        return this;
      } else {
        return this.globalOptions;
      }
    })
  }, {
    key: 'parseFile',
    value: function parseFile(fileString) {
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
    }
  }, {
    key: 'parseVariable',
    value: function parseVariable(varString) {
      var parsedString = {};
      var name = varString.match(this.globalOptions.varSplit);
      if (_.isEmpty(name)) {
        return false;
      } else {

        parsedString.array = this.arrayCheck(name[0]);
        parsedString.name = name[0].slice(0, parsedString.array ? -3 : -1).trim();
        parsedString.content = varString.replace(this.globalOptions.varSplit, '').trim();

        return parsedString;
      }
    }
  }, {
    key: 'arrayCheck',
    value: function arrayCheck(varString) {
      if (!_.isEmpty(varString.match(this.globalOptions.arraySplit))) {
        return true;
      }

      return false;
    }
  }]);

  return parser;
})();

module.exports = parser;