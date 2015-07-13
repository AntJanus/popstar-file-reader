import _ from 'lodash';
import fs from 'vinyl-fs';
import nodeFs from 'fs';
import through from 'through2';
import Parser from './parser';

import path from 'path';

const sep = path.sep;
const parser = new Parser();

class reader {

  constructor(options) {
    this.globalOptions = {
      directory: path.normalize('content'),
      postsPerPage: 10,
      slugSplit: /^[0-9]*-/,
      extensionSplit: /\.md$/,
      ignoreFiles: /^\./,
      fileName: 'post.md'
    };

    parser.options(options.parser);
    _.extend(this.globalOptions, options);
  }

  options(options) {
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
  };

  getParserInstance() {
    return parser;
  }

  // returns a subtree of files
  // uses glob-like pattern to find it
  // uses urlPath something/else/path
  getSubtree(urlPath, shallow) {
    var self = this;

    shallow = shallow || false;
    var slugPath = urlPath.split('/').join('/*-') + '/' + self.globalOptions.fileName;
    var tree = {};

    fs.src(slugPath)
      .pipe(through.obj(function() {
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

      }));
  }

  //slugPath = ['content', 'first-post'] <- devoid of ids
  getFile(slugPath) {
    var self = this;
    var foundPath = this.findFile(_.clone(slugPath));
    var data;
    if (foundPath === false) {
      return { error: 'Not found'};
    } else {
      try {
        var filePath = path.normalize(foundPath.join('/') + '/' + self.globalOptions.fileName);
        var file = nodeFs.readFileSync(filePath).toString();
        data = parser.parseFile(file);
        data.path = foundPath;
        data.slug = slugPath;

        return data;
      } catch (err) {
        console.log(err);
        return { error: 'Not found'};
      }
    }
  }

  //slugPath = ['first-post'], existingPath = ['content', '1-posts'] <- different type
  findFile(slugPath, existingPath) {
    var self = this;
    var fullPath = [];
    var currentSlug = slugPath.shift();
    var found = false;

    if(!existingPath) {
      existingPath = [];
    }

    if(_.isEmpty(existingPath)) {
      fullPath.push(this.globalOptions.directory);
      existingPath.push(this.globalOptions.directory);
    } else {
      _.merge(fullPath, existingPath);
    }

    var files = nodeFs.readdirSync(path.normalize(fullPath.join('/')));

    files.forEach(function(file) {
      if(!file.match(self.globalOptions.ignoreFiles) && found === false && currentSlug === self.parseSlug(file).slug) {
        fullPath.push(file);
        found = true;
      } else if (_.isEmpty(currentSlug) && file === self.globalOptions.fileName) {
        if (existingPath.join('') === self.globalOptions.directory) {
          found = true;
        }
      }
    });

    if(found === true) {
      if(!_.isEmpty(slugPath)) {
        var nextPath = this.findFile(slugPath, fullPath);

        if(nextPath !== false) {
          return nextPath;
        }
      }

      return fullPath;
    } else {
      return false;
    }
  }

  //parentPath = 1-posts <- string without globalOptions.directory
  getFeed(parentPath, limit, offset, callback) {
    var self            = this;
    var fullPath        = path.normalize(self.globalOptions.directory + '/' + parentPath);
    var children        = self.findFeedItems(fullPath, limit, offset);
    var parallelExecute = {};

    children.forEach(function(child) {
      parallelExecute[child] = function(callback) {
        var filePath = path.normalize(fullPath + '/' + child + '/' + self.globalOptions.fileName);
        nodeFs.readFile(filePath, function (err, data) {
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

   async.parallel(parallelExecute, function(err, result) {
     var filtered = [];
     _.each(result, function(child) {
      if(!_.isNull(child)) {
        filtered.push(child);
      }
     });

     callback(filtered);
   });
  }

  //parentFile = content/1-posts <- string
  findFeedItems(parentFile, limit, offset) {
    var self  = this;
    var files = _.filter(nodeFs.readdirSync(parentFile), function(file) {
      return _.isEmpty(file.split('.')[1]);
    });
    limit  = limit && limit !== 0 ? limit : files.length;
    offset = offset ? offset : 0;

    files.sort(function(a, b) {
      return self.fileSort(a, b);
    });

    return files.slice(offset, limit + offset);
  }

  slugify(filePath) {
    var self = this;
    var slug = [];

    var segments = filePath.split('/');
    segments.forEach(function(segment) {
      if (_.contains(self.globalOptions.directory.split('/'), segment) || segment === self.globalOptions.fileName || _.isEmpty(segment)) {

      } else {
        var slugged = self.parseSlug(segment);
        slug.push(slugged.slug);
      }
    });

    return slug;
  }

  parseSlug(fileName) {
    var file = fileName;
    var data = {};

    var slugInfo = file.split(this.globalOptions.slugSplit);
    if(slugInfo.length === 2) {
      data.id = parseInt(file.match(this.globalOptions.slugSplit)[0].slice(0,-1));
      data.slug = slugInfo[1].replace(this.globalOptions.extensionSplit,'');
      return data;
    }

    return false;
  }

  //note: to avoid constantly switching from array and string notation, this thing will normalize it. Definitely needs some work but should help work some stuff out
  normalizePath(norm) {
    var normalized = {};

    if(typeof norm === 'object') {
      normalized.obj = norm;
      normalized.str = norm.join('/');
    } else {
      normalized.obj = norm.split('/');
      normalized.str = norm;
    }

    return normalized;
  }

  fileSort(a, b) {
    var a1 = parseInt(a);
    var b1 = parseInt(b);

    return a1 > b1;
  }

}

export default reader;
