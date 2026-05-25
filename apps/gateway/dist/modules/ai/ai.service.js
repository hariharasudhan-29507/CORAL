import OpenAI from "openai";
import { env } from "../../config/env.js";
const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const fallbackMessage = "AI is not configured yet. Set OPENAI_API_KEY on the gateway to enable Coral AI.";
export async function* createAssistantDraftStream(prompt) {
    if (!client) {
        yield fallbackMessage;
        return;
    }
    const response = await client.chat.completions.create({
        model: env.OPENAI_REALTIME_MODEL,
        messages: [
            {
                role: "system",
                content: "You are Coral's concise in-chat assistant. Be useful, brief, and clear.",
            },
            { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        stream: true,
    });
    for await (const chunk of response) {
        const token = chunk.choices[0]?.delta?.content;
        if (token)
            yield token;
    }
}
