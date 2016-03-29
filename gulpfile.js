var gulp = require('gulp'),
    typescript = require('gulp-typescript'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify');

var sourceDirectory= 'development/';
var targetDirectory = 'production/';

gulp.task('clean', function(){
    gulp.src(targetDirectory+'/*', {read: false})
    .pipe(clean());
})
gulp.task('compile', ['clean'] ,function(){
  gulp.src([sourceDirectory+'nudge.modules.ts',sourceDirectory+'nudge.core.ts',sourceDirectory+'nudge.main.ts'])
    .pipe(concat('intermediate/intermediate.ts'))
    .pipe(gulp.dest(targetDirectory))
    .pipe(typescript({
            noImplicitAny: false,
            module: 'commonjs',
            out: 'out.js',
            target: 'ES5',
            noLib: true
        }))
    //.pipe(uglify())
    .pipe(gulp.dest(targetDirectory));
});

// Default Task
gulp.task('build', ['compile']);
gulp.task('default',['build']);
