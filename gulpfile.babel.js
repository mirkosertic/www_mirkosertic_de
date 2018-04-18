import gulp from 'gulp'
import htmlmin from 'gulp-htmlmin'
import runSequence from 'run-sequence'
import shell from 'gulp-shell'

var ftp = require('vinyl-ftp');
var gutil = require('gulp-util');
var minimist = require('minimist');
var args = minimist(process.argv.slice(2));

gulp.task('hugo-build', shell.task(['hugo']))

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

gulp.task('build', ['hugo-build'], (callback) => {
    runSequence('minify-html', callback)
});

gulp.task('deploy', function() {
    var remotePath = '/www/';
    var conn = ftp.create({
        host: 'w0077e1b.kasserver.com',
        user: args.user,
        password: args.password,
        log: gutil.log
    });
    gulp.src(['**/*.*'], {cwd: 'public', buffer: false})
        .pipe(conn.newer(remotePath))
        .pipe(conn.dest(remotePath));
});