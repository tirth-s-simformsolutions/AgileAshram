import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { DepartmentRepository } from '../department/department.repository';
import { SUCCESS_MSG } from './messages';

const CLASSIFY_PROMPT = `You are NagarVani, a polite and helpful AI complaint classification assistant for civic services.

Given:
1. A list of industries with their IDs, names, and responsibilities.
2. A complaint submitted by a user.
3. The location where the complaint has been raised.
4. The date and time when the complaint was submitted.

Your goal:
- Analyze the attached image to understand the nature and context of the complaint.
- Identify which industry is responsible for resolving the complaint.
- Use the industry description, responsibilities, and image content to determine the best match.
- Consider the complaint location as additional context when determining responsibility.
- Focus on intent and context rather than exact keyword matching.
- Select only one industry.
- If confidence is low and no industry clearly applies, return null for industryId.
- Write a concise 1-2 sentence summary that includes: what the complaint is about (informed by both the text and the image), the location, and the time.

Industries:
{{industries_json}}

Complaint:
{{complaint}}

Location:
{{place}}

Time:
{{time}}

Return ONLY valid JSON with no markdown, no code fences, no explanation:
{"industryId":"<industry_id_or_null>","summary":"<concise_complaint_summary>"}`;

const VALIDATE_PROMPT = `You are NagarVani, a polite and helpful AI assistant for civic complaint validation.

Given:
1. A complaint submitted by a user.
2. The location where the complaint has been raised.

Your goal:
- Determine whether the complaint is legitimate and actionable by a civic or government authority.
- A complaint is legitimate if it describes a real, specific, and plausible civic or public issue (e.g. infrastructure damage, sanitation problems, illegal activity, public safety hazards).
- If the complaint is not legitimate, respond like a helpful human would — gently ask the user to share more about a specific civic issue they are facing, such as a problem with roads, sanitation, water supply, or public safety. Phrase it as a friendly question, e.g. "Could you tell us about a specific civic issue you are experiencing, like a road problem, garbage collection, or water supply issue?"
- Keep the reason conversational, warm, and under 2 sentences.

Complaint:
{{complaint}}

Location:
{{place}}

{{image_section}}

Return ONLY valid JSON with no markdown, no code fences, no explanation, following this exact structure:
- "isLegit": true or false
- "reason": include ONLY when isLegit is false — a warm, conversational message asking the user to describe a specific civic issue. Omit this field entirely when isLegit is true.
- "imageAnalysis": an object with:
  - "isValid": true or false
  - "reason": include ONLY when isValid is false — a polite explanation of which image rule was not met. Omit this field entirely when isValid is true.

Example when everything is valid:
{"isLegit":true,"imageAnalysis":{"isValid":true}}

Example when complaint is invalid and image is invalid:
{"isLegit":false,"reason":"<friendly question>","imageAnalysis":{"isValid":false,"reason":"<polite image feedback>"}}`;

const IMAGE_ANALYSIS_SECTION = `Image (analyze the attached image and check ALL of the following):
- The image must be clear and directly related to the complaint described.
- The subject must involve public property (roads, drains, public parks, government buildings, etc.), not private property.
- The image must show the surrounding area and context — extreme close-up shots that show no surroundings are not acceptable.
If the image fails any of these checks, set imageAnalysis.isValid to false and explain which rule was not met in a polite, helpful tone.`;

@Injectable()
export class AiService {
  private readonly genAI: GoogleGenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly departmentRepository: DepartmentRepository,
  ) {
    this.genAI = new GoogleGenAI({
      apiKey: this.configService.get<string>('ai.googleGenAiApiKey'),
    });
    this.model = this.configService.get<string>('ai.googleGenAiModel');
  }

  async getSuggestedIndustry(complaint: string, place: string, time: string, imageUrl: string) {
    try {
      const [industries, imageResponse] = await Promise.all([
        this.departmentRepository.findAll(),
        fetch(imageUrl),
      ]);

      const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg';
      const imageData = Buffer.from(await imageResponse.arrayBuffer()).toString('base64');

      const industriesJson = JSON.stringify(
        industries.map(industry => ({
          id: industry._id,
          name: industry.name,
          responsibility: industry.responsibility,
          keywords: industry.keywords,
        })),
      );

      const prompt = CLASSIFY_PROMPT.replace('{{industries_json}}', industriesJson)
        .replace('{{complaint}}', complaint)
        .replace('{{place}}', place)
        .replace('{{time}}', time);

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageData } }] }],
      });

      const rawText = response.text.trim();
      const result: { industryId: string | null; summary: string } = JSON.parse(rawText);

      return new ResponseResult({
        message: SUCCESS_MSG.AI.INDUSTRY_SUGGESTED,
        data: result,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async validateComplaint(complaint: string, place: string, imageUrl: string) {
    try {
      const imageResponse = await fetch(imageUrl);
      const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg';
      const imageData = Buffer.from(await imageResponse.arrayBuffer()).toString('base64');

      const prompt = VALIDATE_PROMPT.replace('{{complaint}}', complaint)
        .replace('{{place}}', place)
        .replace('{{image_section}}', IMAGE_ANALYSIS_SECTION);

      const contents = [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageData } }] }];

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents,
      });

      const rawText = response.text.trim();
      const result: {
        isLegit: boolean;
        reason?: string;
        imageAnalysis: { isValid: boolean; reason?: string };
      } = JSON.parse(rawText);

      return new ResponseResult({
        message: SUCCESS_MSG.AI.COMPLAINT_VALIDATED,
        data: result,
      });
    } catch (error) {
      handleError(error);
    }
  }
}
