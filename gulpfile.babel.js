import gulp from 'gulp'
import { minify as minifyHtml } from '@minify-html/node'
import shell from 'gulp-shell'
import { Transform } from 'stream'
import sharp from 'sharp'
import { optimize as svgoOptimize } from 'svgo'
import { extname } from 'path'

function optimizeImages() {
    return new Transform({
        objectMode: true,
        transform(file, enc, callback) {
            if (file.isNull()) {
                return callback(null, file);
            }

            const ext = extname(file.path).toLowerCase();

            if (ext === '.png') {
                sharp(file.contents)
                    .png({ compressionLevel: 9 })
                    .toBuffer()
                    .then(buf => { file.contents = buf; callback(null, file); })
                    .catch(() => callback(null, file));
            } else if (ext === '.jpg' || ext === '.jpeg') {
                sharp(file.contents)
                    .jpeg({ progressive: true })
                    .toBuffer()
                    .then(buf => { file.contents = buf; callback(null, file); })
                    .catch(() => callback(null, file));
            } else if (ext === '.svg') {
                const result = svgoOptimize(file.contents.toString(), {
                    plugins: [{
                        name: 'preset-default',
                        params: { overrides: { cleanupIds: false } }
                    }]
                });
                file.contents = Buffer.from(result.data);
                callback(null, file);
            } else {
                callback(null, file);
            }
        }
    });
}

gulp.task('hugo-build', shell.task(['hugo']));

gulp.task('imagemin', () => {
    return gulp.src('static/media/**/*', { nodir: true })
        .pipe(optimizeImages())
        .pipe(gulp.dest('public/media'))
});

gulp.task('imagemin-assets', () => {
    return gulp.src('themes/boot/static/assets/**/*', { nodir: true })
        .pipe(optimizeImages())
        .pipe(gulp.dest('themes/boot/static/assets'))
});

gulp.task('minify-html', () => {
    const cfg = { keep_comments: true, minify_css: false, minify_js: false };
    return gulp.src('public/**/*.html')
        .pipe(new Transform({
            objectMode: true,
            transform(file, enc, callback) {
                if (file.isNull()) return callback(null, file);
                file.contents = minifyHtml(file.contents, cfg);
                callback(null, file);
            }
        }))
        .pipe(gulp.dest('./public'))
});

gulp.task('build', gulp.series(['hugo-build', 'minify-html', 'imagemin']));
