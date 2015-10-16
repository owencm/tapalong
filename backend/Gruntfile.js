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
          cwd: 'tapalong/tapalong_app/client/src/js/',
          src: ['*.js'],
          dest: 'tapalong/tapalong_app/client/tmp/'
        },{
          expand: true,
          cwd: 'tapalong/tapalong_app/client/src/js/sw/',
          src: ['*.js'],
          dest: 'tapalong/tapalong_app/client/tmp/'
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
          'tapalong/tapalong_app/static/main.js': ['tapalong/tapalong_app/client/tmp/main.js'],
          'tapalong/tapalong_app/static/sw.js': ['tapalong/tapalong_app/client/tmp/sw.js']
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
    },
    copy: {
      main: {
        files: [
          // includes files within path and its sub-directories
          {expand: true, cwd: 'tapalong/tapalong_app/client/src/', src: ['*.html'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'tapalong/tapalong_app/client/src/css/', src: ['*.css'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'tapalong/tapalong_app/client/src/images/', src: ['**'], dest: 'tapalong/tapalong_app/static/images/'},
        ],
      },
    },
    watch: {
      scripts: {
        files: ['tapalong/tapalong_app/client/src/**/*.js'],
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
