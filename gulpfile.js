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

const builtDir = 'build';
const serverBuiltDir = builtDir;
const clientBuiltDir = serverBuiltDir + '/public';
const srcDir = 'src';
const serverSrcDir = srcDir+'/server';
const clientSrcDir = srcDir+'/client';

const enablePrecache = true;

gulp.task('generate-precache-service-worker', function(callback) {
  const staticFileGlobs = enablePrecache ? [clientBuiltDir + '/**/*.{js,html,css,png,jpg,gif}'] : [];
  swPrecache.write(path.join(clientBuiltDir, 'service-worker.js'), {
    staticFileGlobs: staticFileGlobs,
    stripPrefix: clientBuiltDir,
    importScripts: ['my-service-worker.js']
  }, callback);
});

gulp.task('copy-static-resources', function () {
  return gulp.src([path.join(clientSrcDir, '**/*'),
                   '!' + path.join(clientSrcDir, '**/*.js')])
         .pipe(gulp.dest(clientBuiltDir));
});

gulp.task('build-sw', function () {
  return browserify({entries: path.join(clientSrcDir, 'js/sw/service-worker.js')})
        .transform(babelify, { presets: ['es2015'] })
        .bundle()
        .pipe(source('my-service-worker.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(clientBuiltDir));
})

gulp.task('build-client-js', function () {
  return browserify({entries: path.join(clientSrcDir, 'js/main.js')})
        .transform(babelify, { presets: ['react','es2015'] })
        .bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(clientBuiltDir));
});

gulp.task('build-client', function () {
  return runSequence( 'copy-static-resources',
                      'build-sw',
                      'build-client-js',
                      'generate-precache-service-worker');
});

gulp.task('build-server', function () {
  return gulp.src([path.join(serverSrcDir, '*')])
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(gulp.dest(serverBuiltDir));
});

gulp.task('default', function () {
  return runSequence('build-client', 'build-server');
});

gulp.task('watch', function () {
  gulp.run('default');
  gulp.watch(path.join(serverSrcDir, '**/*'), ['build-server']);
  gulp.watch(path.join(clientSrcDir, '**/*'), ['build-client']);
});
