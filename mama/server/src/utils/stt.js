import { config } from '../config.js';
import { transcribeAudio } from './gemini.js';

// Provider switch. To add Bhashini: write transcribeWithBhashini(buffer, mime) and add a case below.
export async function transcribe(buffer, mime) {
  switch (config.sttProvider) {
    case 'gemini':
      return transcribeAudio(buffer, mime);
    default:
      throw new Error(`Unknown STT provider: ${config.sttProvider}`);
  }
}
