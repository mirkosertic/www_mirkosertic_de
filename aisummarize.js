import Anthropic from '@anthropic-ai/sdk';
import { sleep } from '@anthropic-ai/sdk/core';
import { loadFilesWithExtension, parseAsciidocFrontMatter } from './aicommon.js';

import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

function convertToMessage(frontMatter, content) {
    const prompt = `<instructions>
Please summarize the following text stored in the content tags taken from a blog in a catchy way. The content is formatted as AsciiDoc, 
so please handle headlines and code formattings accordingly. 
The summary must not contain the phrases "the autor" or "the writer" or something like that and must not be longer than three sentences. 
The summary should be in the witty, but not too technical style. 
Please format the answer as a machine readable json containing the attributes "title" and "summary". 
The title attribute of the response should contain an alternative title, based on the title tag of the content and the content itself.
Please also try to generate keywords for the content and return them as the "keywords" attribute so they can be used as HTML meta data. 

Try to find the problem or motivation the content is about, and try to express this in the style of a childrens book title.
Return this book title as the "booktitle" attribute of the response.

Finally please try to generate an abstract for the content and return it as the "abstract" attribute of the response.
</instructions>
    
<content>
    <title>${frontMatter.title}</title>
    <body>
        ${content}
    </body>    
</content>`;

    const messageObj = {
        system: 'You are a technical writer with strong computer science background and try to optimize Blog content in terms of quality, readability, joy and search engine optimization.',
        max_tokens: 1024,
        messages: [
            { role: 'user', content: prompt }
        ],
        model: 'claude-3-5-sonnet-latest'
    };
    return messageObj;
}

async function handleSingleFile(entry) {
    const filename = entry.path;

    const {frontMatter, content} = parseAsciidocFrontMatter(entry.content);
    const message = convertToMessage(frontMatter, content);

    const response = await client.messages.create(message);

    const aicontent = response.content;
    for (var i = 0; i < aicontent.length; i++) {
        const elem = aicontent[i];
        if ('text' === elem.type) {
            const js = JSON.parse(elem.text);
            if (js.title) {
                frontMatter["ai_title"] = js.title;
            }
            if (js.summary) {
                frontMatter["ai_summary"] = js.summary;
            }
            if (js.summary) {
                frontMatter["ai_abstract"] = js.abstract;
            }
            if (js.booktitle) {
                frontMatter["ai_booktitle"] = js.booktitle;
            }
        }
    }

    fs.writeFileSync(filename + '.aifrontmatter.json', JSON.stringify(frontMatter, null, 2));
    console.info('Finished file ' + filename);
}

async function main() {
    const files = loadFilesWithExtension('./content/post/', '.adoc');

    console.info('Found ' + files.length + ' files');
    for (var i = 0; i < files.length; i++) {
        handleSingleFile(files[i]);
        if (i % 5 == 0) {
            console.log('Sleeping due to rate limit!');
            await sleep(30000);
        }
    }
    console.log('Finished!');
}

main();