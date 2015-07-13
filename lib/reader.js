'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _vinylFs = require('vinyl-fs');

var _vinylFs2 = _interopRequireDefault(_vinylFs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var sep = _path2['default'].sep;
var parser = new _parser2['default']();

var reader = (function () {
  function reader(options) {
    _classCallCheck(this, reader);

    this.globalOptions = {
      directory: _path2['default'].normalize('content'),
      postsPerPage: 10,
      slugSplit: /^[0-9]*-/,
      extensionSplit: /\.md$/,
      ignoreFiles: /^\./,
      fileName: 'post.md'
    };

    parser.options(options.parser);
    _lodash2['default'].extend(this.globalOptions, options);
  }

  _createClass(reader, [{
    key: 'options',
    value: function options(_options) {
      if (_options) {
        parser.options(_options.parser);
        delete _options.parser;
        _lodash2['default'].extend(this.globalOptions, _options);
        return this;
      } else {
        var parserOptions = parser.options();
        var clonedOpts = _lodash2['default'].clone(this.globalOptions);
        clonedOpts.parser = parserOptions;
        return clonedOpts;
      }
    }
  }, {
    key: 'getParserInstance',
    value: function getParserInstance() {
      return parser;
    }
  }, {
    key: 'getSubtree',

    // returns a subtree of files
    // uses glob-like pattern to find it
    // uses urlPath something/else/path
    value: function getSubtree(urlPath, shallow) {
      var self = this;

      shallow = shallow || false;
      var slugPath = urlPath.split('/').join('/*-') + '/' + self.globalOptions.fileName;
      var tree = {};

      _vinylFs2['default'].src(slugPath).pipe(_through22['default'].obj(function () {}));
    }
  }, {
    key: 'getFile',

    //slugPath = ['content', 'first-post'] <- devoid of ids
    value: function getFile(slugPath) {
      var self = this;
      var foundPath = this.findFile(_lodash2['default'].clone(slugPath));
      var data;
      if (foundPath === false) {
        return { error: 'Not found' };
      } else {
        try {
          var filePath = _path2['default'].normalize(foundPath.join('/') + '/' + self.globalOptions.fileName);
          var file = _fs2['default'].readFileSync(filePath).toString();
          data = parser.parseFile(file);
          data.path = foundPath;
          data.slug = slugPath;

          return data;
        } catch (err) {
          console.log(err);
          return { error: 'Not found' };
        }
      }
    }
  }, {
    key: 'findFile',

    //slugPath = ['first-post'], existingPath = ['content', '1-posts'] <- different type
    value: function findFile(slugPath, existingPath) {
      var self = this;
      var fullPath = [];
      var currentSlug = slugPath.shift();
      var found = false;

      if (!existingPath) {
        existingPath = [];
      }

      if (_lodash2['default'].isEmpty(existingPath)) {
        fullPath.push(this.globalOptions.directory);
        existingPath.push(this.globalOptions.directory);
      } else {
        _lodash2['default'].merge(fullPath, existingPath);
      }

      var files = _fs2['default'].readdirSync(_path2['default'].normalize(fullPath.join('/')));

      files.forEach(function (file) {
        if (!file.match(self.globalOptions.ignoreFiles) && found === false && currentSlug === self.parseSlug(file).slug) {
          fullPath.push(file);
          found = true;
        } else if (_lodash2['default'].isEmpty(currentSlug) && file === self.globalOptions.fileName) {
          if (existingPath.join('') === self.globalOptions.directory) {
            found = true;
          }
        }
      });

      if (found === true) {
        if (!_lodash2['default'].isEmpty(slugPath)) {
          var nextPath = this.findFile(slugPath, fullPath);

          if (nextPath !== false) {
            return nextPath;
          }
        }

        return fullPath;
      } else {
        return false;
      }
    }
  }, {
    key: 'getFeed',

    //parentPath = 1-posts <- string without globalOptions.directory
    value: function getFeed(parentPath, limit, offset, callback) {
      var self = this;
      var fullPath = _path2['default'].normalize(self.globalOptions.directory + '/' + parentPath);
      var children = self.findFeedItems(fullPath, limit, offset);
      var parallelExecute = {};

      children.forEach(function (child) {
        parallelExecute[child] = function (callback) {
          var filePath = _path2['default'].normalize(fullPath + '/' + child + '/' + self.globalOptions.fileName);
          _fs2['default'].readFile(filePath, function (err, data) {
            if (err) {
              callback(err, null);
            } else {
              var d = parser.parseFile(data.toString());
              d.path = filePath;
              d.slug = self.slugify(filePath);
              callback(null, d);
            }
          });
        };
      });

      _async2['default'].parallel(parallelExecute, function (err, result) {
        var filtered = [];
        _lodash2['default'].each(result, function (child) {
          if (!_lodash2['default'].isNull(child)) {
            filtered.push(child);
          }
        });

        callback(filtered);
      });
    }
  }, {
    key: 'findFeedItems',

    //parentFile = content/1-posts <- string
    value: function findFeedItems(parentFile, limit, offset) {
      var self = this;
      var files = _lodash2['default'].filter(_fs2['default'].readdirSync(parentFile), function (file) {
        return _lodash2['default'].isEmpty(file.split('.')[1]);
      });
      limit = limit && limit !== 0 ? limit : files.length;
      offset = offset ? offset : 0;

      files.sort(function (a, b) {
        return self.fileSort(a, b);
      });

      return files.slice(offset, limit + offset);
    }
  }, {
    key: 'slugify',
    value: function slugify(filePath) {
      var self = this;
      var slug = [];

      var segments = filePath.split('/');
      segments.forEach(function (segment) {
        if (_lodash2['default'].contains(self.globalOptions.directory.split('/'), segment) || segment === self.globalOptions.fileName || _lodash2['default'].isEmpty(segment)) {} else {
          var slugged = self.parseSlug(segment);
          slug.push(slugged.slug);
        }
      });

      return slug;
    }
  }, {
    key: 'parseSlug',
    value: function parseSlug(fileName) {
      var file = fileName;
      var data = {};

      var slugInfo = file.split(this.globalOptions.slugSplit);
      if (slugInfo.length === 2) {
        data.id = parseInt(file.match(this.globalOptions.slugSplit)[0].slice(0, -1));
        data.slug = slugInfo[1].replace(this.globalOptions.extensionSplit, '');
        return data;
      }

      return false;
    }
  }, {
    key: 'normalizePath',

    //note: to avoid constantly switching from array and string notation, this thing will normalize it. Definitely needs some work but should help work some stuff out
    value: function normalizePath(norm) {
      var normalized = {};

      if (typeof norm === 'object') {
        normalized.obj = norm;
        normalized.str = norm.join('/');
      } else {
        normalized.obj = norm.split('/');
        normalized.str = norm;
      }

      return normalized;
    }
  }, {
    key: 'fileSort',
    value: function fileSort(a, b) {
      var a1 = parseInt(a);
      var b1 = parseInt(b);

      return a1 > b1;
    }
  }]);

  return reader;
})();

exports['default'] = reader;
module.exports = exports['default'];

// process files through a parser
// create a tree with the full object and vars
/* Path: some/path
 * Sample tree: {
 *  path: /1-some/post.md,
 *  slug: /some,
 *  title: 'Somewhere!',
 *  children: [
 *    {
 *      path: /1-some/4-path/post.md,
 *      slug: /some/path,
 *      children: [ {} ]
 *    }
 *  ]
 *
 * }
 */