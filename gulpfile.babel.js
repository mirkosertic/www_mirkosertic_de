import gulp from 'gulp'
import htmlmin from 'gulp-htmlmin'
import runSequence from 'run-sequence'
import shell from 'gulp-shell'

var FtpDeploy = require('ftp-deploy');
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

    var ftpDeploy = new FtpDeploy();

    var config = {
        username: args.user,
        password: args.password,
        host: 'w0077e1b.kasserver.com',
        port: 21,
        localRoot: __dirname + "/public",
        remoteRoot: "/www/testsite/",
        include: ['**/*'],
        exclude: ['.git', '.idea', 'tmp/*', 'build/*']
    };

    ftpDeploy.on('uploaded', function(data) {
        console.log(data);
    });

    ftpDeploy.deploy(config, function(err) {
        if (err) console.log(err)
        else console.log('finished');
    });
});