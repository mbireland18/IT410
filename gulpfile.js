var gulp = require('gulp');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');

const pngquant = require('imagemin-pngquant');
const changed = require('gulp-changed');

/*gulp.task('default', function() {
    console.log('Ran default task.');
});*/

//SASS to CSS
gulp.task('sass', function () {
    return gulp.src('./src/sass/**/*.scss')
        .pipe(changed('dist'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

//autoprefixer
gulp.task('autoprefixer', function () {
    return gulp.src('./src/app.css')
        .pipe(changed('dist'))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('dist'));
});

//minify CSS
gulp.task('minifycss', function () {
    return gulp.src('./src/min.css')
        .pipe(changed('dist'))
        .pipe(csso())
        .pipe(gulp.dest('dist'));
});

//minify HTML
gulp.task('minifyhtml', function() {
    return gulp.src('./src/*.html')
        .pipe(changed('dist'))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'))
});

//minify image
gulp.task('minifyimage', function () {
    return gulp.src('./src/images/*')
        .pipe(changed('dist'))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/images'));
});

//minify JS
gulp.task('minifyjs', function() {
    return gulp.src(['./src/*.js','./src/**/*.js'])
        .pipe(changed('dist'))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist'));
});

//unminify
gulp.task('unminify', ['compress'], function () {
    return gulp.src('./src/*.html')
        .pipe(changed('dist'))
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['sass', 'autoprefixer', 'minifycss', 'minifyhtml', 'minifyimage', 'minifyjs', 'unminify']);