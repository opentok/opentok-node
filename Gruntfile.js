module.exports = function (grunt) {
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
        specNameMatcher: 'spec'
      },
      all: ['spec/']
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('default', ['mochaTest', 'jasmine_node']);
};
