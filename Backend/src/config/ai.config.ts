import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  googleGenAiApiKey: process.env.GOOGLE_GENAI_API_KEY,
  googleGenAiModel: process.env.GOOGLE_GENAI_MODEL,
}));
