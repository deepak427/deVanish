import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

let transcript = await client.transcripts.transcribe({
    audio: "./conversation_recording.wav",
});

const transcribedText = transcript.text;
console.log(transcribedText);