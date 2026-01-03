
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Service disabled for offline autonomy
  constructor() {}

  async analyzeCsv(fileName: string, headers: string[], sampleRows: Record<string, string>[]): Promise<string> {
    return "AI analysis is disabled in offline mode.";
  }

  async askQuestion(question: string, headers: string[], sampleRows: Record<string, string>[]): Promise<string> {
    return "AI chat is disabled in offline mode.";
  }
}
