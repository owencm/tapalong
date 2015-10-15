module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['tapalong/tapalong_app/client/tmp/'],
    babel: {
      options: {
        sourceMap: true
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'tapalong/tapalong_app/client/src/',
          src: ['*.js'],
          dest: 'tapalong/tapalong_app/client/tmp/'
        }]
      }
    },
    browserify: {
      dist: {
        files: {
          'tapalong/tapalong_app/static/main.js': ['tapalong/tapalong_app/client/tmp/main.js']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'babel', 'browserify']);

};
