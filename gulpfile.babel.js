import gulp from 'gulp'
import htmlmin from 'gulp-htmlmin'
import runSequence from 'run-sequence'
import shell from 'gulp-shell'

var imagemin = require('gulp-imagemin');
var uncss = require('gulp-uncss');

gulp.task('hugo-build', shell.task(['hugo']));

gulp.task('imagemin', () => {
    return gulp.src('static/media/*')
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.jpegtran({progressive: true}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]), {verbose: true})
        .pipe(gulp.dest('public/media'))
});

gulp.task('imagemin-assets', () => {
    return gulp.src('themes/boot/static/assets/*')
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.jpegtran({progressive: true}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]), {verbose: true})
        .pipe(gulp.dest('themes/boot/static/assets'))
});

gulp.task('minify-html', () => {
    return gulp.src('public/**/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: false,
            minifyJS: false,
            removeComments: false,
            useShortDoctype: false,
        }))
        .pipe(gulp.dest('./public'))
});

gulp.task('cssmin', function () {
    return gulp.src(['public/css/site.css'])
        .pipe(uncss({
            html: ['public/*.html', 'public/post/**/*.html', 'public/tags/**/*.html', 'public/global/**/*.html', 'public/blog/**/*.html']
        }))
        .pipe(gulp.dest('public/css'));
});

gulp.task('build', gulp.series(['hugo-build', 'minify-html', 'imagemin', 'cssmin'], () => {
}));
