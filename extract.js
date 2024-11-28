import {loadFilesWithExtension, parseAsciidocFrontMatter} from "./aicommon.js";

async function main() {

    const files = loadFilesWithExtension('./content/post/', '.adoc');


    console.info('Found ' + files.length + ' files');
    console.info("<postings>");
    for (var i = 0; i < files.length; i++) {
        const entry = files[i];
        const {frontMatter, content} = parseAsciidocFrontMatter(entry.content);

        console.log(`
    <posting>
        <filename>${entry.path}</filename>
        <date>${frontMatter.date}</date>
        <title>${frontMatter.title}</title>
        <abstract>${frontMatter.abstract}</abstract>
    </posting>        
`);
    }
    console.info("</postings>");
    console.log('Finished!');
}

main();
