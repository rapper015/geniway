import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert the audio file to a format that OpenAI can process
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    // Create a File object from the blob
    const audioFileForOpenAI = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    // Transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForOpenAI,
      model: 'whisper-1',
      language: 'en', // You can make this dynamic based on user preference
      response_format: 'text'
    });

    return NextResponse.json({
      transcript: transcription,
      success: true
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
