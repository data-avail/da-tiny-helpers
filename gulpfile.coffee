gulp = require('gulp');
$ = require('gulp-load-plugins')();

gulp.task "build", ->
  gulp.src(["./*.coffee", "!./gulpfile.coffee"])
  .pipe($.coffee(bare : true))
  .pipe(gulp.dest('./dist/'))

