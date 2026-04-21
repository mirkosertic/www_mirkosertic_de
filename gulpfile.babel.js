import gulp from 'gulp'
import { minify as minifyHtml } from '@minify-html/node'
import shell from 'gulp-shell'
import sharp from 'sharp'
import { optimize as svgoOptimize } from 'svgo'
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { Transform } from 'stream'

async function optimizeDir(srcDir, destDir) {
    mkdirSync(destDir, { recursive: true })
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = join(srcDir, entry.name)
        const destPath = join(destDir, entry.name)
        if (entry.isDirectory()) {
            await optimizeDir(srcPath, destPath)
            continue
        }
        const ext = extname(entry.name).toLowerCase()
        const buf = readFileSync(srcPath)
        let out = buf
        if (ext === '.png') {
            try { out = await sharp(buf).png({ compressionLevel: 6 }).toBuffer() } catch(e) {}
        } else if (ext === '.jpg' || ext === '.jpeg') {
            try { out = await sharp(buf).jpeg({ progressive: true }).toBuffer() } catch(e) {}
        } else if (ext === '.svg') {
            try {
                const result = svgoOptimize(buf.toString(), {
                    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false } } }]
                })
                out = Buffer.from(result.data)
            } catch(e) {}
        }
        writeFileSync(destPath, out)
    }
}

gulp.task('hugo-build', shell.task(['hugo']));

gulp.task('imagemin', () => optimizeDir('static/media', 'public/media'));

gulp.task('imagemin-assets', () => optimizeDir('themes/boot/static/assets', 'themes/boot/static/assets'));

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
