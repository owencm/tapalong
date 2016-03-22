var isDevMode = false;

module.exports = function(grunt) {
  // TODO: Disable source maps and enable uglify when pushing to production

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['tmp/'],
    babel: {
      options: {
        sourceMap: isDevMode
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/client/js/',
          src: ['*.js'],
          dest: 'tmp/'
        }, {
          expand: true,
          cwd: 'src/client/js/sw/',
          src: ['*.js'],
          dest: 'tmp/'
        }, {
          expand: true,
          cwd: 'src/client/js/components/',
          src: ['*.js'],
          dest: 'tmp/components'
        }]
      }
    },
    browserify: {
      options: {
        browserifyOptions: {
          debug: isDevMode
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
          {expand: true, cwd: 'src/client/', src: ['*.html', '*.json'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'src/client/css/', src: ['*.css'], dest: 'tapalong/tapalong_app/static/'},
          {expand: true, cwd: 'src/client/images/', src: ['**'], dest: 'tapalong/tapalong_app/static/images/'},
        ],
      },
    },
    watch: {
      scripts: {
        files: ['src/client/**'],
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
  var tasks = isDevMode ? ['babel', 'browserify', 'copy', 'clean'] : ['babel', 'browserify', 'uglify', 'copy', 'clean']
  grunt.registerTask('default', tasks);

};
