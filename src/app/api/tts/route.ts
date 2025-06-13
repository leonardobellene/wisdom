import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { text, voice = 'nova' } = await req.json();

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  console.log("response ", response)

  const audioBuffer = await response.arrayBuffer();
  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}
