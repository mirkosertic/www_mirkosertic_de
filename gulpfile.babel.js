import gulp from 'gulp'
import htmlmin from 'gulp-htmlmin'
import runSequence from 'run-sequence'
import shell from 'gulp-shell'

var imagemin = require('gulp-imagemin');

gulp.task('hugo-build', shell.task(['hugo']));

gulp.task('imagemin', () => {
    return gulp.src('static/media/*')
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.jpegtran({progressive: true}),
        ]), {verbose: true})
        .pipe(gulp.dest('public/media'))
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

gulp.task('build', ['hugo-build',], (callback) => {
    runSequence('minify-html', 'imagemin', callback)
});
