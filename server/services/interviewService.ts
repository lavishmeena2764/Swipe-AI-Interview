import { v4 as uuidv4 } from "uuid";
import { callGemini } from "./utils/geminiClient";
import { Session, Question } from "../models/candidate";

export const interviewService = {
  async generateQuestions(session: Session, n = 6): Promise<Question[]> {
    const desired = 6;
    const prompt = `
You are a strict, senior-level technical hiring assistant. Your primary task is to validate the provided text and then generate interview questions.

**Phase 1: Validation**
First, you MUST determine if the following text is a professional software development resume. A valid resume must contain sections like 'Education', 'Experience', 'Skills', or 'Projects'.

-   If the text is NOT a valid resume (e.g., it is random text, a story, or irrelevant content), you MUST respond with ONLY the following JSON object and nothing else:
    {"error": "Invalid content", "reason": "The provided text does not appear to be a professional resume."}

-   If the text IS a valid resume, proceed to Phase 2.

**Phase 2: Question Generation**
Generate 6 unique interview questions 2 for each difficulty level based on the resume, following these mandatory rules:

1.  **Resume-Only Topics:** Questions must ONLY be based on technologies, projects, and roles explicitly in the resume.
2.  **Conciseness:** Question length MUST match the difficulty (Easy: <15 words, Medium: ~20-25 words, Hard: up to 3 sentences).
3.  **Difficulty Mapping:**
    * **Easy (20s):** Definitional questions ("What is...?").
    * **Medium (60s):** Process-oriented questions ("How would you...?").
    * **Hard (120s):** Situational or optimization questions ("Describe a situation where...").
4.  **Technical Only:** No HR or personality questions.

**Output Format for Success:**
If the resume is valid, your output must be a strict, raw JSON object with a single key "questions". The value should be a JSON array. Do not add any text, explanations, or markdown. The structure must be:
{
  "questions": [
    {
      "id": "<uuid>",
      "text": "<question text>",
      "difficulty": "easy|medium|hard",
      "time_seconds": <20|60|120>,
      "maxScore": 10
    }
  ]
}

**Candidate Text to Analyze:**
-----------
${session.resumeText}
-----------
`;
    const raw = await callGemini(prompt, 0.2, 8192);
    try {
      const idx = raw.indexOf("{");
      const jsonText = idx >= 0 ? raw.slice(idx) : raw;
      const responseObject = JSON.parse(jsonText);
      if (responseObject.error) {
        throw new Error(responseObject.reason || 'Invalid file content.');
      }
      const arr = responseObject.questions as Question[];

      return arr.map((q) => ({
        id: q.id || uuidv4(),
        text: q.text || q,
        difficulty: (q.difficulty as any) || "medium",
        time_seconds: q.time_seconds || (q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120) || 60,
        maxScore: q.maxScore || 10,
      }));
    } catch (e: any) {
        console.error("AI response error or invalid resume:", e.message);
        
        throw new Error(e.message || "Failed to parse AI response or invalid file provided.");
    }
  },
async summarizeSession(session: Session) {
  const transcript = (session.answers || []).map(ans => 
      `Question: ${ans.questionText}\nAnswer: ${ans.answer}`
  ).join('\n\n');

  const prompt = `
You are an expert and fair technical hiring manager. Evaluate the candidate based on their resume and full interview transcript below.

Scoring Rules:
1. Be **balanced but strict**:
   - Reward clear, correct, and logically reasoned answers.  
   - Deduct marks if answers are vague, memorized textbook-style, or look AI-generated (too generic, no personal touch, no reasoning).  
   - Give partial credit if the candidate shows some understanding, even if the answer is incomplete.  
2. Difficulty weighting:  
   - Easy questions: check basic knowledge (low weight).  
   - Medium questions: check applied understanding (moderate weight).  
   - Hard questions: check deeper reasoning and problem-solving (high weight).  
   - Candidates don’t need to get every hard question perfect — show fairness.  
3. Fairness principle:  
   - A genuine mid-level candidate who has actually worked with the mentioned skills should score **in a passable range (60–75+)** if they show real understanding.  
   - Fakers or candidates with only surface-level knowledge should score much lower.  
   - Exceptional candidates (deep knowledge + strong reasoning) can score above 85.  
4. Be concise in summary:  
   - Highlight strengths (good reasoning, clarity, real-world knowledge).  
   - Highlight weaknesses (faking, lack of depth, poor problem-solving).  
   - Mention if answers seemed AI-like or copied.

Your response MUST be a valid JSON object with exactly two keys:
{
  "finalScore": <0-100>,
  "summary": "<1-2 sentence professional summary highlighting strengths, weaknesses, and overall capability>"
}

Resume:
-----------
${session.resumeText}
-----------

Full Interview Transcript:
-----------
${transcript}
-----------

Return a valid JSON only. Do not add any extra text. Do not add any markdown.
`;

  try {
    const raw = await callGemini(prompt, 0.2, 8192);
    const idx = raw.indexOf("{");
    const jsonText = idx >= 0 ? raw.slice(idx) : raw;
    const parsed = JSON.parse(jsonText);

    const finalScore = parsed.finalScore ?? 0;
    const summary = parsed.summary ?? "Could not generate a summary.";
    
    return { finalScore, summary };
  } catch (e) {
    console.error("Failed to summarize session with AI, using fallback.", e);
    return { finalScore: 0, summary: "Evaluation failed. Could not generate a summary or score." };
  }
},
};

export type InterviewService = typeof interviewService;
export { interviewService as default };
