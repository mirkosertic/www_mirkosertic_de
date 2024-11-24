import OpenAI from "openai";

import dotenv from 'dotenv';
import Anthropic from "@anthropic-ai/sdk";
import https from 'https'; // or 'https' for https:// URLs
import fs from 'fs';
import path from 'path';

import { loadFilesWithExtension, parseAsciidocFrontMatter } from './aicommon.js';
import {sleep} from "@anthropic-ai/sdk/core";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

const claude = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function handleSingleFile(entry) {
    const filename = entry.path;

    const {frontMatter, content} = parseAsciidocFrontMatter(entry.content);

    if (!frontMatter.booktitle) {
        console.log("Cannot process file " + filename + " due to undefined booktitle");
        return;
    }

    const prompt = `<instructions>
Please create a Dall-E-3 prompt for the request stored in the content tags taken from a blog in a catchy way. 
Try to extract the essence from the content.
The prompt should lead Dall-E do use the XKCD stick figures style, but the final result must not use
text and favor technology or related symbols instead. It should also lead Dall-E to use a plain white
background, as the image will be embedded on a webpage.
The stick figures should be in black/white, all other symbols may be in vibrant colors if this improves
the message, clarity or visual appearance. Avoid worls like "diaper", "innocent looking" and so on that 
might trigger the Dall-E safety system.
Please return the prompt as a JSON document and return the prompt itself as the "prompt" attribute of the response.
</instructions>
    
<content>${frontMatter.booktitle}</content>`;

    const createdallerequest = {
        system: 'You try to create cover images for a technical blog and want to mimic the famous XKCD style. It should be positive, humorous and be a little bit ironic.',
        max_tokens: 1024,
        messages: [
            { role: 'user', content: prompt }
        ],
        model: 'claude-3-5-sonnet-latest'
    };

    console.log("Asking Claude for a Dall-E prompt..")
    const clauderesponse = await claude.messages.create(createdallerequest);

    var dalleprompt = '';
    const aicontent = clauderesponse.content;
    for (var i = 0; i < aicontent.length; i++) {
        const elem = aicontent[i];
        if ('text' === elem.type) {
            const js = JSON.parse(elem.text);
            if (js.prompt) {
                dalleprompt = js.prompt;
            }
        }
    }

    console.log("Got prompt: " + dalleprompt);

    for (var i = 0; i < 6; i++) {

        const imagefilename = "./static/media/welcomeimages/" + path.parse(filename).name + "_" + i + ".png";
        if (!fs.existsSync(imagefilename)) {
            console.log("Try #" + i);
            try {
                const image = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: dalleprompt,
                    quality: "standard",
                    n: 1,
                    size: "1024x1024"
                });

                console.log("Downloading " + image.data[0].url);
                const file = fs.createWriteStream(imagefilename);
                const request = https.get(image.data[0].url, function (response) {
                    response.pipe(file);

                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        console.log("Download Completed");
                    });
                });
            } catch (error) {
                console.log("Got error from Dall-E, ignoring this try : " + error);
            }
        }
    }
}

async function main() {

    const files = loadFilesWithExtension('./content/post/', '.adoc');

    console.info('Found ' + files.length + ' files');
    for (var i = 0; i < files.length; i++) {
        handleSingleFile(files[i]);
        if (i % 5 == 0) {
            console.log('Sleeping due to rate limit!');
            await sleep(70000);
        }
    }
    console.log('Finished!');
}

main();