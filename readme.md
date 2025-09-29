# 🤖 AI-Powered Interview Assistant

A full-stack application that delivers an **AI-driven interview experience**. Candidates upload their resumes and complete timed, adaptive interviews with questions dynamically generated from their background. Interviewers gain access to a powerful dashboard with candidate details, scores, and **AI-generated performance insights**.  

---

## 🌐 Live Demo

**You can access the live deployed application here:**

[**https://lavish-swipe-ai.netlify.app/**](https://lavish-swipe-ai.netlify.app/)

---

## ✨ Features

- **Resume Parsing** — Upload `.pdf` or `.docx` resumes; extract candidate details (Name, Email, Phone).  
- **Dynamic Question Generation** — Technical questions tailored to a candidate’s skills and projects, powered by *Google Gemini*.  
- **Timed Interview Flow** — Structured, chat-based interview with per-question timers:  
  - Easy: *20s*  
  - Medium: *60s*  
  - Hard: *120s*  
- **Auto-Submission** — Responses are automatically submitted when time expires.  
- **Batch Evaluation** — Candidate answers are evaluated in a single request for holistic scoring and AI-generated feedback.  
- **Interviewer Dashboard** — Sort, search, and paginate candidate data for efficient navigation.  
- **Detailed Candidate View** — Floating panel with transcript, AI evaluation summary, and final score.  
- **Session Persistence** — Resume interrupted interviews with a "Welcome Back" modal.  
- **Robust Error Handling** — Clear error messages, retry logic, and server-side logging for reliability.  

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Redux Toolkit, Tailwind CSS, shadcn/ui  
- **Backend:** Node.js, Express.js  
- **AI:** Google Gemini API  
- **State Persistence:** Redux Persist  
- **Database:** Upstash (Redis)  
- **File Storage:** Cloudinary  
- **Deployment:** Netlify  

---

## ⚙️ Implementation Notes

- **Resume Parsing:** Server-side parsing (PDF/DOCX → JSON) before upload to Cloudinary; secure handling of PII.  
- **Question Generation & Evaluation:** Resume context + candidate answers sent to *Google Gemini*. Includes server-side throttling and retries for API stability.  
- **Timers & Auto-Submit:** Frontend timers with local autosave before submission to prevent data loss.  
- **Batch Evaluation:** Final candidate answers sent in one API call for consistent scoring.  
- **State Persistence:** Implemented via redux-persist, enabling interview recovery through a "Welcome Back" flow.  
- **Error Handling:** User-facing retry prompts for transient errors; server-side error logging for debugging and monitoring.  

