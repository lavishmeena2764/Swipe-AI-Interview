import { v4 as uuidv4 } from "uuid";
import { callGemini } from "./utils/geminiClient";
import { Session, Question } from "../models/candidate";

export const interviewService = {
  async generateQuestions(session: Session, n = 6): Promise<Question[]> {
    const desired = 6;
    const prompt = `
You are a senior-level expert technical interviewer for a Full Stack (React/Node) role.

Your job is to generate ${desired} **unique and non-repetitive** interview questions strictly from the candidate’s resume below.

**Mandatory Rules:**

1.  **Resume-Only Topics:** Questions must ONLY be based on technologies, projects, and roles explicitly in the resume. No generic topics.
2.  **Conciseness is Key:** Question length MUST match the difficulty:
    * **Easy (20s):** Keep the question under 15 words. It should be a direct, single-sentence query.
    * **Medium (60s):** Can be 1-2 short sentences, around 20-25 words.
    * **Hard (120s):** Can be more descriptive, up to 3 sentences, to provide necessary context.
3.  **Difficulty-to-Complexity Mapping:**
    * **Easy (20s):** Focus on definitions and "What is...?" or "What is the purpose of...?" questions. Example: "What is a key difference between MongoDB and MySQL?"
    * **Medium (60s):** Focus on "How would you...?" or "Explain the role of..." questions that require explaining a process or a specific use case. Example: "How would you handle state management in a complex React application like your 'Medify.AI' project?"
    * **Hard (120s):** Focus on "Describe a situation where..." or "How would you optimize/debug..." questions that require reasoning about trade-offs, architecture, or performance. Example: "In your 'EasyExit' project, describe a potential performance bottleneck with MongoDB and how you might optimize the queries to resolve it."
4.  **No Repeats:** Questions MUST be different in every API call. Be creative.
5.  **Technical Only:** Avoid vague, HR-style, or personality questions.

**Output Format:**
Your output must be a strict, raw JSON array. Do not add any text, explanations, or markdown formatting like \`\`\`json. Each item in the array must have this exact structure:
{
  "id": "<uuid>",
  "text": "<question text>",
  "difficulty": "easy|medium|hard",
  "time_seconds": <20|60|120>,
  "maxScore": 10
}

**Candidate Resume:**
-----------
${session.resumeText}
-----------
`;
    const raw = await callGemini(prompt, 0.2, 8192);
    try {
      const idx = raw.indexOf("[");
      const jsonText = idx >= 0 ? raw.slice(idx) : raw;
      const arr = JSON.parse(jsonText) as Question[];
      return arr.map((q) => ({
        id: q.id || uuidv4(),
        text: q.text || q,
        difficulty: (q.difficulty as any) || "medium",
        time_seconds: q.time_seconds || (q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120) || 60,
        maxScore: q.maxScore || 10,
      }));
    } catch (e) {
      const topics = ["project architecture", "React hooks", "Node performance", "design tradeoffs", "database schema", "testing"];
      const q: Question[] = [];
      const diffs = ["easy", "easy", "medium", "medium", "hard", "hard"];
      for (let i = 0; i < desired; i++) {
        const d = diffs[i] || "medium";
        q.push({
          id: uuidv4(),
          text: `Explain ${topics[i % topics.length]} in your project and how you implemented it.`,
          difficulty: d,
          time_seconds: d === "easy" ? 20 : d === "medium" ? 60 : 120,
          maxScore: 10,
        });
      }
      return q;
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
