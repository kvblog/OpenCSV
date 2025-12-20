import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async analyzeCsv(fileName: string, headers: string[], sampleRows: Record<string, string>[]): Promise<string> {
    const model = 'gemini-2.5-flash';
    
    // Convert sample rows to a readable string format
    const sampleText = sampleRows.map(row => JSON.stringify(row)).join('\n');
    
    const prompt = `
      I am analyzing a CSV file named "${fileName}".
      
      Here are the headers:
      ${headers.join(', ')}

      Here is a sample of the data (first ${sampleRows.length} rows):
      ${sampleText}

      Please provide a concise but insightful analysis of this dataset.
      1. Identify what kind of data this is.
      2. Suggest 3 interesting questions one might ask this data.
      3. Point out any potential data quality issues visible in the sample (missing values, inconsistent formats), if any.
      
      Format the response in clean Markdown.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Gemini Analysis Failed', error);
      throw error;
    }
  }

  async askQuestion(question: string, headers: string[], sampleRows: Record<string, string>[]): Promise<string> {
    const model = 'gemini-2.5-flash';
    const sampleText = sampleRows.map(row => JSON.stringify(row)).join('\n');
    
    const prompt = `
      Context: A CSV dataset with headers: ${headers.join(', ')}.
      Sample Data:
      ${sampleText}

      User Question: "${question}"

      Answer the question based on the provided sample data and the inferred structure of the file. 
      Keep the answer short and direct.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
       console.error('Gemini Chat Failed', error);
       throw error;
    }
  }
}