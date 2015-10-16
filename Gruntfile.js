// TODO: Disable source maps and enable uglify when pushing to production

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['tmp/'],
    babel: {
      options: {
        sourceMap: true
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'client/js/',
          src: ['*.js'],
          dest: 'tmp/'
        },{
          expand: true,
          cwd: 'client/js/sw/',
          src: ['*.js'],
          dest: 'tmp/'
        }]
      }
    },
    browserify: {
      options: {
        browserifyOptions: {
          debug: true
        }
      },
      dist: {
        files: {
          'tapalong/tapalong_app/static/main.js': ['tmp/main.js'],
          'tapalong/tapalong_app/static/sw.js': ['tmp/sw.js']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'tapalong/tapalong_app/static/main.js',
        dest: 'tapalong/tapalong_app/static/main.js'
      }
    },
    copy: {
      main: {
        files: [
          // includes files within path and its sub-directories
          {expand: true, cwd: 'client/', src: ['*.html'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'client/css/', src: ['*.css'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'client/images/', src: ['**'], dest: 'tapalong/tapalong_app/static/images/'},
        ],
      },
    },
    watch: {
      scripts: {
        files: ['client/*'],
        tasks: ['default'],
        options: {
          spawn: false,
          atBegin: true
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['babel', 'browserify', 'copy', 'clean']);

};
