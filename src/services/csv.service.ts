import { Injectable } from '@angular/core';

export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  parse(csvText: string): CsvData {
    const lines = this.parseCSVLines(csvText);
    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const headers = lines[0].map(h => h.trim());
    const dataRows = lines.slice(1);
    
    const rows = dataRows.map(line => {
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        // Handle potential mismatch in column counts safely
        rowData[header] = line[index] !== undefined ? line[index].trim() : '';
      });
      return rowData;
    });

    return {
      headers,
      rows,
      totalRows: rows.length
    };
  }

  // Robust CSV parser handling quotes and commas inside quotes
  private parseCSVLines(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let currentVal = '';
    let insideQuote = false;

    // Normalize newlines
    const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const nextChar = chars[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          // Escaped quote
          currentVal += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuote = !insideQuote;
        }
      } else if (char === ';' && !insideQuote) {
        // End of field
        row.push(currentVal);
        currentVal = '';
      } else if (char === '\n' && !insideQuote) {
        // End of row
        row.push(currentVal);
        result.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    
    // Push the last field/row if exists
    if (currentVal || row.length > 0) {
      row.push(currentVal);
      result.push(row);
    }

    return result;
  }
}