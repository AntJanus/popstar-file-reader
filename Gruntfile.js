'use strict';

var request = require('request');

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    develop: {
      server: {
        file: 'server.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: ['lib/**/*.js','test/**/*.js']
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          mask: '**/*.test.js'
        }
      },
      coveralls: {
        src: 'test',
        options: {
          mask: '**/*.test.js',
          coverage: true,
          check: {
            lines: 75,
            statements: 75
          },
          root: './lib',
          reportFormats: ['cobertura', 'lcovonly']
        }
      }
    },
    mochaTest: {
      api: {
        options: {
          clearRequireCache: true
        },
        src: 'test/**/*.test.js'
      }
    }
  });

  grunt.event.on('coverage', function(lcovFileContents, done) {
    done();
  });
  
  grunt.registerTask('test', ['mochaTest', 'mocha_istanbul']);
};
