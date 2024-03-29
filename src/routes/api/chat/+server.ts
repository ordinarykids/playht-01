import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
});

export const config = {
    runtime: 'edge'
};

export async function POST({ request, locals }) {
    if (!locals.authenticated) {
        throw error(401);
    }

    const { messages } = await request.json();

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            stream: true,
            messages
        });

        // Transform the response into a readable stream
        const stream = OpenAIStream(response);

        // Return a StreamingTextResponse, which can be consumed by the client
        return new StreamingTextResponse(stream);
    } catch (err) {
        console.error(err);
        throw error(500);
    }

}