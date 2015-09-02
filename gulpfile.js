/* eslint-env node */

var gulp = require('gulp');
var folders = require('gulp-folders');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');

gulp.task('default', ['modules']);

const MODULES_PATH = 'app/src';
const DIST_PATH = 'app/dist';
gulp.task('modules', folders(MODULES_PATH, function(folder) {
  'use strict';
  return gulp.src([path.join(MODULES_PATH, folder, '_' + folder + '.module.js'), path.join(MODULES_PATH, folder, '/**/*.js')])
    .pipe(sourcemaps.init())
    .pipe(concat('module.' + folder + '.js'))
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIST_PATH));
}));
