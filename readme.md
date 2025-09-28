# 🤖 AI-Powered Interview Assistant

A full-stack application that provides an AI-powered interview experience. Candidates upload resumes and take automated, timed interviews with questions dynamically generated from their resumes. Interviewers get a dashboard that lists candidates, scores, and an AI-generated performance summary.

---

## ✨ Features

- **Resume Parsing** — Upload `.pdf` or `.docx` resumes to extract candidate details (Name, Email, Phone).
- **Dynamic Question Generation** — Google Gemini generates technical questions tailored to the candidate's skills and projects.
- **Timed Interview Flow** — Real-time chat-based interview with per-question timers:
  - Easy: **20s**
  - Medium: **60s**
  - Hard: **120s**
- **Automatic Submission** — Answers auto-submit when time expires.
- **Batch Evaluation** — All answers are sent to the AI in a single batch for a final holistic score and summary.
- **Interviewer Dashboard** — View candidates, sort by name/score, and navigate with pagination.
- **Detailed Candidate View** — Floating panel with full transcript, AI summary, and final score.
- **State Persistence** — Local persistence with a "Welcome Back" modal to resume unfinished interviews.
- **Robust Error Handling** — Clear UI errors and **Retry** for transient network or AI-evaluation failures.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Redux Toolkit, Tailwind CSS, shadcn/ui  
- **Backend:** Node.js, Express.js  
- **AI:** Google Gemini API  
- **State Persistence:** Redux Persist  
- **Storage:** Cloudinary (for uploaded resumes)  
- **Deployment:** Vercel / Netlify (client) + chosen Node host (server)  

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+  
- npm or pnpm  
- Google Gemini API Key  
- Cloudinary account

### Clone repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
``` 

### Install dependencies

```bash
npm install
# or
pnpm install
```

### Environment variables
Create a .env file in the project root:
```bash
# Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PORT=8080
```

### Run development server

```bash
npm run dev
```
Open: http://localhost:8080


## 📂 Project Structure

```bash
.
├── client/              # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── lib/             # API interface and utilities
│   ├── pages/           # Pages (Dashboard, Interview, etc.)
│   └── store/           # Redux Toolkit + Redux Persist
├── server/              # Backend Node/Express application
│   ├── controllers/     # Route handlers and business logic
│   ├── lib/             # Utilities (storage, AI clients)
│   ├── models/          # Type definitions / DTOs
│   ├── routes/          # API routes
│   └── services/        # AI logic (question generation, evaluation)
├── public/              # Static assets
├── vite.config.ts
└── README.md
```

## ⚙️ Key Implementation Notes
- Resume parsing uses a server-side parser (PDF/DOCX -> structured JSON) before upload to Cloudinary. Keep any PII handling secure.
- Question generation & evaluation: send resume-derived context + answers to Google Gemini. Use server-side request throttling / retries to handle rate limits.
- Timers & autosubmit: implement per-question timers on the frontend; autosubmit should store locally before sending to server to avoid data loss.
- Batch evaluation: send final candidate answers in one API call to Gemini for consistent, holistic scoring.
- State persistence: use redux-persist to persist interview state across refreshes and present a "Welcome Back" flow to resume.
- Error handling: surface transient errors to the user with a clear message and a Retry action. Log errors server-side for debugging.
