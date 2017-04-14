var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var cp = require('child_process');
var ts = require('gulp-typescript');

// run nodemon on server file changes
gulp.task('nodemon', function (cb) {
  var started = false;

  return nodemon({
    script: 'out/www.js',
    watch: ['out/*.js']
  }).on('start', function () {
    if (!started) {
      cb();
      started = true;
    }
  }).on('restart', function onRestart() {
    setTimeout(function reload() {
      browserSync.reload({
        stream: false
      });
    }, 500); // browserSync reload delay
  });
});

// watch for any TypeScript or LESS file changes
// if a file change is detected, run the TypeScript or LESS compile gulp tasks
gulp.task('watch', function () {
  gulp.watch('src/typescript/**/*.ts', ['build.ts']);
});

gulp.task('build.ts', function () {
  var tsProject = ts.createProject('src/typescript/tsconfig.json');
  var tsResult = gulp.src('src/**/*.ts')
    .pipe(tsProject());
    return tsResult.js.pipe(gulp.dest('src/javascript/'));
});

gulp.task('buildAll', ['build', 'less']);
gulp.task('default', ['browser-sync']);