import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Api, Session as BackendSession } from "@/lib/api";
import { RootState, candidateActions } from "@/store";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils"; 
const ITEMS_PER_PAGE = 9;
export default function DashboardPage() {
  const dispatch = useDispatch();
  const rows = useSelector((s: RootState) => s.candidates);
  
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "score">("name");
  const [open, setOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [fullSessionDetails, setFullSessionDetails] = useState<BackendSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Api.listCandidates().then((items) =>
      dispatch(candidateActions.setCandidates(items)),
    );
  }, [dispatch]);

  const filtered = useMemo(() => {
    const base = rows.filter((r) =>
      [r.name, r.email, r.phone, r.summary]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    return [...base].sort((a, b) =>
      sortBy === "name"
        ? (a.name || "").localeCompare(b.name || "") 
        : (b.finalScore || 0) - (a.finalScore || 0),
    );
  }, [rows, query, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  async function view(id: string) {
    setSelectedCandidateId(id);
    setOpen(true);
    setFullSessionDetails(null);
    setIsLoadingSession(true);
    try {
      const sessionData = await Api.fetchSession(id); 
      setFullSessionDetails(sessionData);
    } catch (error) {
      console.error("Failed to fetch full session details:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }

  const selectedRow = filtered.find((r) => r.id === selectedCandidateId);

  const transcriptMessages = useMemo(() => {
    if (!fullSessionDetails?.questions || !fullSessionDetails?.answers) return [];

    const messages: { id: string; role: "ai" | "user"; text: string; score?: number }[] = [];
    const questionsMap = new Map(fullSessionDetails.questions.map(q => [q.id, q]));
    const answersMap = new Map(fullSessionDetails.answers.map(a => [a.questionId, a]));

    fullSessionDetails.questions.forEach(q => {
      messages.push({
        id: `q-${q.id}`,
        role: "ai",
        text: q.text,
      });

      const answer = answersMap.get(q.id);
      if (answer) {
        messages.push({
          id: `a-${q.id}`,
          role: "user",
          text: answer.answer,
          score: answer.score, 
        });
      }
    });
    return messages;
  }, [fullSessionDetails]);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col md:flex-row gap-4">
          <h1 className="text-2xl font-semibold">AI-Powered Dashboard</h1>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search candidates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant={sortBy === "name" ? "default" : "secondary"}
              onClick={() => setSortBy("name")}
            >
              Sort: Name
            </Button>
            <Button
              variant={sortBy === "score" ? "default" : "secondary"}
              onClick={() => setSortBy("score")}
            >
              Sort: Score
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No candidates found.</p>
          ) : (
            paginatedItems.map((r) => (
              <Card key={r.id} className="flex flex-col bg-card-background">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{r.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{r.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{r.email}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base font-semibold text-muted-foreground">Final Score</span>
                    <Badge variant={getScoreVariant(r.finalScore)}>
                      {r.finalScore ?? "N/A"} / 100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 border-t mt-4">
                    {r.summary ? `${r.summary.substring(0, 100)}...` : "No summary available."}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" className="w-full" onClick={() => view(r.id)}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "fixed bottom-4 right-4 top-auto left-auto w-[460px] md:w-[525px] h-[120vh] md:h-[85vh] flex flex-col bg-card-background", // Custom positioning and fixed size
            "translate-x-0 translate-y-0 duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:slide-in-from-bottom" // Animations
          )}
          style={{ transform: 'none' }} 
        >
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          
          {isLoadingSession ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading details...</div>
          ) : selectedRow && fullSessionDetails ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="p-3 flex items-center gap-4 ">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl">
                    {selectedRow.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-lg font-semibold">{selectedRow.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail size={14} /> {selectedRow.email}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone size={14} /> {selectedRow.phone}
                  </div>
                </div>
              </div>

              <Card className="p-3 overflow-y-auto flex-1 space-y-3 bg-muted">
                <div className="font-medium mb-2">Full Interview Transcript</div>
                {transcriptMessages.length > 0 ? (
                  transcriptMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm max-w-[80%]",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground",
                        )}
                      >
                        <p>{m.text}</p>
                        
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No transcript available.</p>
                )}
              </Card>

              <Card className="p-3 bg-muted">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-lg">Assessment Summary</span>
                    <Badge className="text-md" variant={getScoreVariant(fullSessionDetails.finalScore)}>
                      {fullSessionDetails.finalScore ?? "N/A"} / 100
                    </Badge>
                  </div>
                <hr className="my-3" />
                <p className="text-sm text-muted-foreground">
                  {fullSessionDetails?.summary || "No summary available."}
                </p>
                
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">No candidate selected or details not available.</div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}