import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import PDFParser from "pdf2json";
import { callGemini } from "./utils/geminiClient";

export async function extractTextFromFile(filePath: string, mimeType?: string, originalName?: string) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", errData => {
        reject(new Error("Error parsing PDF."));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      });

      pdfParser.loadPDF(filePath);
    });
  } else if (ext === ".docx" || mimeType?.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } else {
    return fs.promises.readFile(filePath, "utf-8");
  }
}

export async function extractFieldsWithGemini(resumeText: string) {
  const prompt = `
You are a highly accurate information extractor.

Your task: From the resume text below, extract ONLY the candidate’s **name, email, and phone number**.

**Strict Rules:**

1.  Always return a **single JSON object** with exactly these three keys: { "name": "", "email": "", "phone": "" }.
2.  If a field is missing, return an empty string "" for that key.
3.  **Name Formatting:** The "name" must be in **Title Case**. Capitalize the first letter of each name part and make all other letters lowercase (e.g., "john smith" or "JANE DOE" should both become "John Smith"). Do not include titles (Mr., Ms., Dr.).
4.  **Email:** Extract only valid email addresses.
5.  **Phone:** Extract the most relevant contact number (digits, spaces, +, (), or - allowed).
6.  Output must be strictly raw JSON. No explanations, no extra text, no markdown.

**RESUME:**
-----------
${resumeText}
-----------
`;

  const raw = await callGemini(prompt, 0.0, 8192);

  try {
    const idx = raw.indexOf("{");
    const jsonText = idx >= 0 ? raw.slice(idx) : raw;
    const parsed = JSON.parse(jsonText);
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
    };
  } catch {
    const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = resumeText.match(/(\+?\d{7,15})/);
    const nameLine = resumeText.split("\n").find((l) => l.trim().length > 3) || "";
    return {
      name: nameLine.trim(),
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
    };
  }
}

