import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { Api, Difficulty } from "@/lib/api";
import { RootState, interviewActions, uiActions } from "@/store";
import { cn } from "@/lib/utils";

type LoadingStatus = "idle" | "parsing" | "generating" | "done";

function difficultySeconds(d: Difficulty) {
  return d === "easy" ? 20 : d === "medium" ? 60 : 120;
}

export default function InterviewPage() {
  const dispatch = useDispatch();
  const interviewState = useSelector((s: RootState) => s.interview);
  const {
      messages,
      questions,
      current,
      status,
      timeRemaining,
      totalAsked,
      sessionId,
      finalScore,
      summary,
      evaluationError,
  } = interviewState;

  const candidate = interviewState.candidate || {};
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");
  const [uploadOpen, setUploadOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle");

  const currentQuestion = questions[current];
  const total = questions.length || 1;
  const progress = totalAsked > 0 ? (totalAsked / total) * 100 : 0;

  useEffect(() => {
    if (status === "in_progress") {
      const id = setInterval(() => dispatch(interviewActions.tick()), 1000);
      return () => clearInterval(id);
    }
  }, [dispatch, status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (status !== "completed" && messages.length > 0) {
      dispatch(uiActions.setWelcomeBack(true));
    }
  }, []);

  const timePct = useMemo(() => {
    if (!currentQuestion) return 0;
    return (
      (timeRemaining / difficultySeconds(currentQuestion.difficulty)) * 100
    );
  }, [timeRemaining, currentQuestion]);

  const canStart = Boolean(candidate.name && candidate.email);

  async function handleResume(file: File) {
    if (!file) return;
    dispatch(interviewActions.reset());
    if (!/\.(pdf|docx?)$/i.test(file.name)) {
      alert("Invalid file type. Upload PDF or DOC/DOCX.");
      return;
    }
    try {
      setLoadingStatus("parsing");
      const sessionData = await Api.parseResume(file);
      dispatch(interviewActions.setSession(sessionData));
      setLoadingStatus("generating");
      const qs = await Api.generateQuestions(sessionData.sessionId);
      dispatch(interviewActions.loadQuestions(qs.questions));

      setLoadingStatus("done");
    } catch (error) {
      console.error("Failed to process resume or generate questions:", error);
      alert("There was an error processing your resume. Please try again.");
      setLoadingStatus("idle"); 
    }
  }

  async function onSubmitAnswer() {
    if (!currentQuestion || !answer.trim() || !sessionId) return;
    try {
      await Api.saveAnswer({
        sessionId,
        questionId: currentQuestion.id,
        answer,
      });

      dispatch(
        interviewActions.submitAnswer({
          questionId: currentQuestion.id,
          answer,
        })
      );
      setAnswer("");
      dispatch(interviewActions.nextQuestion());
    } catch (error) {
      console.error("Failed to save answer:", error);
      alert("There was an issue saving your answer. Please try again.");
    }
  }

  const evaluateInterview = async () => {
      if (sessionId) {
        dispatch(interviewActions.startEvaluation());
        try {
          const analysis = await Api.finalizeAndScoreInterview(sessionId);
          dispatch(interviewActions.setFinalAnalysis(analysis));
        } catch (err) {
          console.error("Failed to evaluate interview:", err);
          const errorMessage = err instanceof Error ? err.message : "A network error occurred.";
          dispatch(interviewActions.setEvaluationError(errorMessage));
        }
      }
    };

  useEffect(() => {
    if (!uploadOpen && status === 'completed' && finalScore === null && !evaluationError) {
      evaluateInterview();
    }
  }, [uploadOpen, status, sessionId, finalScore, evaluationError]);

  useEffect(() => {
    const autoSubmitAnswer = async () => {
      if (!currentQuestion) return;

      try {
        await Api.saveAnswer({
          sessionId,
          questionId: currentQuestion.id,
          answer: answer || "",
        });

        dispatch(
          interviewActions.submitAnswer({
            questionId: currentQuestion.id,
            answer: answer || "",
          })
        );
        setAnswer("");
        dispatch(interviewActions.nextQuestion());
      } catch (error) {
        console.error("Failed to auto-save answer:", error);
        alert("There was an issue auto-saving your answer. Please try again.");
      }
    };

    if (status === "in_progress" && timeRemaining === 0 && currentQuestion !== null) {
      autoSubmitAnswer();
    }
  }, [status, timeRemaining, currentQuestion, answer, dispatch, sessionId]);

  useEffect(() => {
    if (!uploadOpen && status === "collecting" && questions.length > 0) {
      dispatch(interviewActions.startInterview());
    }
  }, [uploadOpen, status, questions, dispatch]);

  const welcomeOpen = useSelector((s: RootState) => s.ui.welcomeBackOpen);
 function getScoreVariant(score?: number | null): "default" | "sec" | "destructive" {
  if (score === null || score === undefined) {
    return "destructive";
  }
  if (score >= 75) {
    return "default"; 
  }
  if (score >= 35) {
    return "sec";
  }
  return "destructive";
}

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">AI-Powered Interview</h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {totalAsked}/{total}
              </span>
              <Progress value={progress} className="w-40" />
            </div>
            {currentQuestion && (
              <div className="relative grid place-items-center">
                <div
                  className="size-12 rounded-full grid place-items-center text-sm font-medium"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${timePct}%, hsl(var(--muted)) ${timePct}%)`,
                  }}
                >
                  <span className="bg-background size-9 rounded-full grid place-items-center">
                    {Math.max(0, timeRemaining)}s
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-3 md:p-4 bg-card-background">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm max-w-[75%]",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <p>{m.text}</p>
                    {typeof m.score === "number" && (
                      <div className="mt-1 text-xs opacity-85">
                        Score: {m.score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {status === "completed" && (
                <div className="text-center text-muted-foreground py-6">
                  Interview Complete. View results in Dashboard.
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
{status === "completed" && (
            <>
              {evaluationError && (
                <Card className="p-4 bg-destructive/10 border-destructive/50 text-destructive">
                  <h3 className="font-semibold mb-2">Evaluation Failed</h3>
                  <p className="text-sm mb-4">
                    There was a problem analyzing your answers. Please check your connection and try again.
                  </p>
                  <pre className="text-xs opacity-70 mb-4">{evaluationError}</pre>
                  <Button variant="destructive" onClick={evaluateInterview}>
                    Retry Evaluation
                  </Button>
                </Card>
              )}
              
              {finalScore !== null && !evaluationError && (
                <Card className="p-4 bg-muted">
                  <h3 className="font-semibold mb-2">Interview Analysis Complete</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm">Final Score:</span>
                    <Badge variant={getScoreVariant(finalScore)} className="text-md">{finalScore}/100</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                </Card>
              )}
            </>
          )}
            <div className="mt-3 border-t border-border pt-3">
              {status !== "completed" && (
                <div className="flex items-center gap-2">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-12"
                    disabled={status !== "in_progress"}
                  />
                  <Button
                    onClick={onSubmitAnswer}
                    disabled={!answer.trim() || status !== "in_progress"}
                  >
                    Send
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={welcomeOpen}
        onOpenChange={(v) => dispatch(uiActions.setWelcomeBack(v))}
      >
        <DialogContent className="sm:max-w-[420px] bg-card-background">
          <DialogHeader>
            <DialogTitle>Welcome Back!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have an unfinished interview session. Would you like to resume?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                dispatch(interviewActions.reset());
                dispatch(uiActions.setWelcomeBack(false));
                setUploadOpen(true);
              }}
            >
              Start New
            </Button>
            <Button onClick={() => {setUploadOpen(false); 
              dispatch(uiActions.setWelcomeBack(false))}}>
              Resume Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={uploadOpen} onOpenChange={(isOpen) => {
          setUploadOpen(isOpen);
          if (!isOpen) {
            navigate("/");
          }
        }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Upload Candidate Resume</DialogTitle>
          </DialogHeader>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleResume(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30",
            )}
          >
            <p className="text-sm mb-2">Drag & Drop File Here</p>
            <p className="text-xs text-muted-foreground">
              Or provide details manually below
            </p>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleResume(f);
                  }}
                />
                <span>Browse Files</span>
              </label>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Input
              placeholder="Full name"
              value={candidate.name || ""}
              onChange={(e) =>
                dispatch(
                  interviewActions.setCandidate({ name: e.target.value }),
                )
              }
            />
            <Input
              placeholder="Email"
              value={candidate.email || ""}
              onChange={(e) =>
                dispatch(
                  interviewActions.setCandidate({ email: e.target.value }),
                )
              }
            />
            <Input
              placeholder="Phone"
              value={candidate.phone || ""}
              onChange={(e) =>
                dispatch(
                  interviewActions.setCandidate({ phone: e.target.value }),
                )
              }
            />
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between min-h-[40px]">
            {loadingStatus === "parsing" && <p className="text-sm text-muted-foreground animate-pulse">Parsing your resume...</p>}
            {loadingStatus === "generating" && <p className="text-sm text-muted-foreground animate-pulse">Generating your interview questions...</p>}
            
            {loadingStatus !== "parsing" && loadingStatus !== "generating" && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Easy 20s</Badge>
                  <Badge variant="secondary">Medium 60s</Badge>
                  <Badge variant="secondary">Hard 120s</Badge>
                </div>
                <Button
                  disabled={!canStart || loadingStatus !== 'done'}
                  onClick={async () => { 
                    if (!sessionId) return;
                    try {
                      await Api.updateCandidateDetails(sessionId, candidate);
                      setUploadOpen(false);
                    } catch (error) {
                      console.error("Failed to update candidate details:", error);
                      alert("Could not save details. Please try again.");
                    }
                  }}
                >
                  Start Interview
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {status === 'idle' && !uploadOpen && !welcomeOpen && (
        <div className="flex justify-center items-center h-[60vh] bg-background">
          <Card className="p-8 text-center bg-card-background">
            <h2 className="text-xl font-semibold mb-4">Start a New Interview</h2>
            <p className="text-muted-foreground mb-6">
              Click the button below to upload a resume and begin.
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              Start New Interview
            </Button>
          </Card>
        </div>
      )}
      
      <Dialog open={status === 'evaluating'}>
        <DialogContent className="bg-card-background">
          <DialogHeader>
            <DialogTitle>Evaluating Your Answers</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <p className="text-muted-foreground animate-pulse">
              Our AI is analyzing your responses... Please wait.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}