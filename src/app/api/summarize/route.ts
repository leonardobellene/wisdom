import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const summaryPrompt: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        "You are Buddha. Summarize the following conversation as if it were your memory. Be brief and mindful. Focus on key themes, emotional cues, and important context. Never break character.",
    },
    ...messages,
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: summaryPrompt,
    temperature: 0.5,
  });

  return NextResponse.json({
    summary: completion.choices[0].message?.content,
  });
}
