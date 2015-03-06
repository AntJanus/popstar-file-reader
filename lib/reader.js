"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = _interopRequire(require("lodash"));

var fs = _interopRequire(require("vinyl-fs"));

var through = _interopRequire(require("through2"));

var Parser = _interopRequire(require("./parser"));

var path = _interopRequire(require("path"));

var sep = path.sep;
var parser = new Parser();

var reader = (function () {
  function reader(options) {
    _classCallCheck(this, reader);

    this.globalOptions = {
      directory: path.normalize("content"),
      postsPerPage: 10,
      slugSplit: /^[0-9]*-/,
      extensionSplit: /\.md$/,
      ignoreFiles: /^\./,
      fileName: "post.md"
    };

    parser.options(options.parser);
    _.extend(this.globalOptions, options);
  }

  _prototypeProperties(reader, null, {
    options: {
      value: (function (_options) {
        var _optionsWrapper = function options(_x) {
          return _options.apply(this, arguments);
        };

        _optionsWrapper.toString = function () {
          return _options.toString();
        };

        return _optionsWrapper;
      })(function (options) {
        if (options) {
          parser.options(options.parser);
          delete options.parser;
          _.extend(this.globalOptions, options);
          return this;
        } else {
          var parserOptions = parser.options();
          var clonedOpts = _.clone(this.globalOptions);
          clonedOpts.parser = parserOptions;
          return clonedOpts;
        }
      }),
      writable: true,
      configurable: true
    },
    getSubtree: {

      // returns a subtree of files
      // uses glob-like pattern to find it
      // uses urlPath something/else/path

      value: function getSubtree(urlPath, shallow) {
        var self = this;

        shallow = shallow || false;
        var slugPath = urlPath.split("/").join("/*-") + "/" + self.globalOptions.fileName;
        var tree = {};

        fs.src(slugPath).pipe(through.obj(function () {}));
      },
      writable: true,
      configurable: true
    },
    getFile: {

      //slugPath = ['content', 'first-post'] <- devoid of ids

      value: function getFile(slugPath) {
        var self = this;
        var foundPath = this.findFile(_.clone(slugPath));
        var data;
        if (foundPath === false) {
          return { error: "Not found" };
        } else {
          try {
            var filePath = path.normalize(foundPath.join("/") + "/" + self.globalOptions.filename);
            var file = fs.readFileSync(filePath).toString();
            data = parser.parseFile(file);
            data.path = foundPath;
            data.slug = slugPath;

            return data;
          } catch (err) {
            console.log(err);
            return { error: "Not found" };
          }
        }
      },
      writable: true,
      configurable: true
    },
    findFile: {

      //slugPath = ['first-post'], existingPath = ['content', '1-posts'] <- different type

      value: function findFile(slugPath, existingPath) {
        var self = this;
        var fullPath = [];
        var currentSlug = slugPath.shift();
        var found = false;

        if (!existingPath) {
          existingPath = [];
        }

        if (_.isEmpty(existingPath)) {
          fullPath.push(this.globalOptions.directory);
          existingPath.push(this.globalOptions.directory);
        } else {
          _.merge(fullPath, existingPath);
        }

        var files = fs.readdirSync(path.normalize(fullPath.join("/")));

        files.forEach(function (file) {
          if (!file.match(self.globalOptions.ignoreFiles) && found === false && currentSlug === self.parseSlug(file).slug) {
            fullPath.push(file);
            found = true;
          } else if (_.isEmpty(currentSlug) && file === self.globalOptions.filename) {
            if (existingPath.join("") === self.globalOptions.directory) {
              found = true;
            }
          }
        });

        if (found === true) {
          if (!_.isEmpty(slugPath)) {
            var nextPath = this.findFile(slugPath, fullPath);

            if (nextPath !== false) {
              return nextPath;
            }
          }

          return fullPath;
        } else {
          return false;
        }
      },
      writable: true,
      configurable: true
    },
    getFeed: {

      //parentPath = 1-posts <- string without globalOptions.directory

      value: function getFeed(parentPath, limit, offset, callback) {
        var self = this;
        var fullPath = path.normalize(self.globalOptions.directory + "/" + parentPath);
        var children = self.findFeedItems(fullPath, limit, offset);
        var parallelExecute = {};

        children.forEach(function (child) {
          parallelExecute[child] = function (callback) {
            var filePath = path.normalize(fullPath + "/" + child + "/" + self.globalOptions.filename);
            fs.readFile(filePath, function (err, data) {
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

        async.parallel(parallelExecute, function (err, result) {
          var filtered = [];
          _.each(result, function (child) {
            if (!_.isNull(child)) {
              filtered.push(child);
            }
          });

          callback(filtered);
        });
      },
      writable: true,
      configurable: true
    },
    findFeedItems: {

      //parentFile = content/1-posts <- string

      value: function findFeedItems(parentFile, limit, offset) {
        var self = this;
        var files = _.filter(fs.readdirSync(parentFile), function (file) {
          return _.isEmpty(file.split(".")[1]);
        });
        limit = limit && limit !== 0 ? limit : files.length;
        offset = offset ? offset : 0;

        files.sort(function (a, b) {
          return self.fileSort(a, b);
        });

        return files.slice(offset, limit + offset);
      },
      writable: true,
      configurable: true
    },
    slugify: {
      value: function slugify(filePath) {
        var self = this;
        var slug = [];

        var segments = filePath.split("/");
        segments.forEach(function (segment) {
          if (_.contains(self.globalOptions.directory.split("/"), segment) || segment === self.globalOptions.filename || _.isEmpty(segment)) {} else {
            var slugged = self.parseSlug(segment);
            slug.push(slugged.slug);
          }
        });

        return slug;
      },
      writable: true,
      configurable: true
    },
    parseSlug: {
      value: function parseSlug(fileName) {
        var file = fileName;
        var data = {};

        var slugInfo = file.split(this.globalOptions.slugSplit);
        if (slugInfo.length === 2) {
          data.id = parseInt(file.match(this.globalOptions.slugSplit)[0].slice(0, -1));
          data.slug = slugInfo[1].replace(this.globalOptions.extensionSplit, "");
          return data;
        }

        return false;
      },
      writable: true,
      configurable: true
    },
    normalizePath: {

      //note: to avoid constantly switching from array and string notation, this thing will normalize it. Definitely needs some work but should help work some stuff out

      value: function normalizePath(norm) {
        var normalized = {};

        if (typeof norm === "object") {
          normalized.obj = norm;
          normalized.str = norm.join("/");
        } else {
          normalized.obj = norm.split("/");
          normalized.str = norm;
        }

        return normalized;
      },
      writable: true,
      configurable: true
    },
    fileSort: {
      value: function fileSort(a, b) {
        var a1 = parseInt(a);
        var b1 = parseInt(b);

        return a1 > b1;
      },
      writable: true,
      configurable: true
    }
  });

  return reader;
})();

module.exports = reader;

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