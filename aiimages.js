import OpenAI from "openai";

import dotenv from 'dotenv';

dotenv.config();

async function main() {

    const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
    });

    const booktitle = "How Little Hugo's Blog Got Super Powers";

    const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Title image for the children book "${booktitle}". 
         Use black / white stick man figures and mimic the XKCD style.
         Focus on specific, visually representable elements.
         Avoid ambiguous language that could be interpreted as including text.
         Make it look like a funny, easy to remember and witty dream sequence.`,
        quality: "standard",
        n: 1,
        size: "1024x1024"
    });

    console.log(image.data[0].url);
}

main();