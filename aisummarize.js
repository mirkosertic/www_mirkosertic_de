import Anthropic from '@anthropic-ai/sdk';

import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function main() {
    const message = await client.messages.create({
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Please summarize the following text in catchy way. The text must not contain the phrases "the autor" or "the writer" or something like that and must not be longer than two sentences. The summary should be in the style of a children\'s book title and will be later used to generate a banner image for the story. The text to summarize is:' }],
        model: 'claude-3-5-haiku-20241022',
    });

    console.log(message.content);
}

main();