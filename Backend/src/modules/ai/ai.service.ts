import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class';
import { DepartmentRepository } from '../department/department.repository';
import { CLASSIFY_PROMPT, DUPLICATE_CHECK_PROMPT, IMAGE_ANALYSIS_SECTION, VALIDATE_PROMPT } from './ai.constants';
import { SUCCESS_MSG } from './messages';

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
          responsibility: industry.responsibilities,
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
      const result: { industryId: string | null; summary: string; severity: 'Low' | 'Medium' | 'High' | 'Critical' } = JSON.parse(rawText);

      return new ResponseResult({
        message: SUCCESS_MSG.AI.INDUSTRY_SUGGESTED,
        data: result,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async checkDuplicate(
    newDescription: string,
    newLocation: string,
    existingComplaints: Array<{
      ticketId: string;
      description: string;
      reportedAddress?: string;
      rawLabel?: string;
      dueDate?: Date;
    }>,
  ) {
    try {
      const existingJson = JSON.stringify(
        existingComplaints.map(c => ({
          ticketId: c.ticketId,
          description: c.rawLabel || c.description,
          location: c.reportedAddress ?? 'unknown',
          dueDate: c.dueDate
            ? c.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
            : null,
        })),
      );

      const prompt = DUPLICATE_CHECK_PROMPT
        .replace('{{new_description}}', newDescription)
        .replace('{{new_location}}', newLocation)
        .replace('{{existing_complaints_json}}', existingJson);

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: prompt }] }],
      });

      const rawText = response.text.trim();
      const result: { isDuplicate: boolean; matchedTicketId?: string; reason?: string } =
        JSON.parse(rawText);

      return new ResponseResult({
        message: SUCCESS_MSG.AI.COMPLAINT_VALIDATED,
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
