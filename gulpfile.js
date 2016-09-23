const gulp = require('gulp');
const babel = require('gulp-babel');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const path = require('path');
const swPrecache = require('sw-precache');
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');

const srcDir = 'web/src';
const builtDir = 'web/build';

const enablePrecache = false;

gulp.task('generate-precache-service-worker', function(callback) {
  const staticFileGlobs = enablePrecache ? [builtDir + '/**/*.{js,html,css,png,jpg,gif}'] : [];
  swPrecache.write(path.join(builtDir, 'service-worker.js'), {
    staticFileGlobs: staticFileGlobs,
    stripPrefix: builtDir,
    importScripts: ['my-service-worker.js']
  }, callback);
});

gulp.task('copy-static-resources', function () {
  return gulp.src([path.join(srcDir, '**/*'),
                   '!' + path.join(srcDir, '**/*.js')])
         .pipe(gulp.dest(builtDir));
});

gulp.task('build-sw', function () {
  return browserify({entries: path.join(srcDir, 'js/sw/service-worker.js')})
        .transform(babelify, { presets: ['es2015'] })
        .bundle()
        .pipe(source('my-service-worker.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(builtDir));
})

gulp.task('build-client-js', function () {
  return browserify({entries: path.join(srcDir, 'js/main.js')})
        .transform(babelify, { presets: ['react','es2015'] })
        .bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(builtDir));
});

gulp.task('build-client', function () {
  return runSequence( 'copy-static-resources',
                      'build-sw',
                      'build-client-js',
                      'generate-precache-service-worker');
});

// gulp.task('build-server', function () {
//   return gulp.src([path.join(serverSrcDir, '**/*')])
//          .pipe(gulp.destBuiltDir));
//   // return gulp.src([path.join(serverSrcDir, '*')])
//   //       .pipe(babel({ presets: ['es2015'] }))
//   //       .pipe(gulp.dest(serverBuiltDir));
// });

gulp.task('default', function () {
  return runSequence('build-client');
});

gulp.task('watch', function () {
  gulp.run('default');
  // gulp.watch(path.join(serverSrcDir, '**/*'), ['build-server']);
  gulp.watch(path.join(srcDir, '**/*'), ['build-client']);
});
