module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*test.js']
      }
    },
    jasmine_node: {
      options: {
        extensions: 'js',
        specNameMatcher: 'spec',
      },
      all: ['spec/']
    },
    jsdoc : {
        dist : {
            src: ['lib/*.js'],
            options: {
                destination: 'docs'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['mochaTest', 'jasmine_node']);

};
