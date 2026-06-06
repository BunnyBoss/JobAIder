"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, type SavedResume } from "@/lib/api";
import { Download } from "lucide-react";

export default function InterviewPrepPage() {
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: api.listProfiles });
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });

  const [profileId, setProfileId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(3);
  const [mode, setMode] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("Medium");
  const [answer, setAnswer] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [sessionFeedback, setSessionFeedback] = useState<any | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Get saved resumes for selected profile
  const profileResumes = resumes.data?.resumes?.filter(
    (r) => r.profile_id === profileId
  ) || [];
  const masterResumes = profileResumes.filter((r) => !r.role_analysis_id);
  const tailoredResumes = profileResumes.filter((r) => r.role_analysis_id);

  const start = useMutation({
    mutationFn: () =>
      api.startInterview({
        profile_id: profileId,
        role_analysis_id: roleId,
        mode,
        difficulty,
        question_count: questionCount,
      }),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setCurrentQuestion(data.question_number);
      setCurrentQuestionText(data.question);
      setIsSessionActive(true);
      setAnswer("");
    },
  });

  const submit = useMutation({
    mutationFn: (action: "submit" | "skip" | "exit") =>
      api.answerInterview(Number(sessionId), answer, action),
    onSuccess: (data) => {
      if (data.is_final_question) {
        setSessionFeedback(data.session_feedback);
        setIsSessionActive(false);
      } else {
        setCurrentQuestion(data.question_number || 0);
        setCurrentQuestionText(data.next_question || "");
      }
      setAnswer("");
    },
  });

  const handleSaveSession = () => {
    const sessionData = {
      profile_id: profileId,
      role_analysis_id: roleId,
      mode,
      difficulty,
      question_count: questionCount,
      feedback: sessionFeedback,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview_session_${profileId}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Interview Prep"
        description="Practice interviews with saved profiles, track progress, and get comprehensive feedback."
      />

      {!isSessionActive && !sessionFeedback && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Select Profile & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile</label>
                  <Select
                    value={profileId?.toString() ?? ""}
                    onChange={(e) => setProfileId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a profile...</option>
                    {profiles.data?.profiles?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interview Mode</label>
                  <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                    {["Technical", "Behavioral", "Hiring Manager", "System Design", "Mixed"].map(
                      (val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      )
                    )}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["Easy", "Medium", "Hard"].map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Number of Questions (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 3)))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Analysis (Optional)</label>
                  <Select
                    value={roleId?.toString() ?? ""}
                    onChange={(e) => setRoleId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">None - Use Master Profile</option>
                    {roles.data?.roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} at {r.company}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => start.mutate()}
                disabled={start.isPending || !profileId}
                className="w-full"
              >
                Start Interview
              </Button>
              <StatusPanel
                loading={start.isPending}
                error={start.error}
                success={start.data ? `Session #${start.data.session_id}` : undefined}
              />
            </CardContent>
          </Card>

          {profileId && (
            <>
              {masterResumes.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Master Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {masterResumes.map((resume) => (
                      <div key={resume.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {resume.kind === "ats" ? "ATS Resume" : "Human-Friendly Resume"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ID: {resume.id}
                          </span>
                        </div>
                        <div className="rounded-md bg-muted p-3 max-h-48 overflow-auto text-xs">
                          <pre className="whitespace-pre-wrap break-words font-mono">
                            {resume.markdown.substring(0, 500)}
                            {resume.markdown.length > 500 && "..."}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {roleId && tailoredResumes.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Tailored Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tailoredResumes
                      .filter((r) => r.role_analysis_id === roleId)
                      .map((resume) => (
                        <div key={resume.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Tailored for Role {resume.role_analysis_id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ID: {resume.id}
                            </span>
                          </div>
                          <div className="rounded-md bg-muted p-3 max-h-48 overflow-auto text-xs">
                            <pre className="whitespace-pre-wrap break-words font-mono">
                              {resume.markdown.substring(0, 500)}
                              {resume.markdown.length > 500 && "..."}
                            </pre>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {isSessionActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Question {currentQuestion} of {questionCount}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Progress: {Math.round((currentQuestion / questionCount) * 100)}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm">{currentQuestionText}</p>
            </div>

            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={5}
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => submit.mutate("submit")}
                disabled={!answer.trim() || submit.isPending}
                variant="default"
              >
                Submit Answer
              </Button>
              <Button
                onClick={() => submit.mutate("skip")}
                disabled={submit.isPending}
                variant="outline"
              >
                Skip Question
              </Button>
              <Button
                onClick={() => {
                  if (confirm("Exit interview? Your progress will be saved.")) {
                    submit.mutate("exit");
                  }
                }}
                disabled={submit.isPending}
                variant="destructive"
              >
                Exit Interview
              </Button>
            </div>

            <StatusPanel
              loading={submit.isPending}
              error={submit.error}
              success={undefined}
            />
          </CardContent>
        </Card>
      )}

      {sessionFeedback && (
        <Card>
          <CardHeader>
            <CardTitle>Session Complete - Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">
                  {sessionFeedback.average_score}
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Questions Answered</p>
                <p className="text-2xl font-bold">
                  {sessionFeedback.answered_questions}/
                  {sessionFeedback.total_questions}
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Technical Depth</p>
                <p className="text-2xl font-bold">
                  {sessionFeedback.breakdown.technical_depth}/5
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2">Clarity</p>
                <p className="text-lg font-semibold">
                  {sessionFeedback.breakdown.clarity}/5
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2">Communication</p>
                <p className="text-lg font-semibold">
                  {sessionFeedback.breakdown.communication}/5
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2">Structure</p>
                <p className="text-lg font-semibold">
                  {sessionFeedback.breakdown.structure}/5
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Strengths</h3>
              <ul className="list-disc list-inside space-y-1">
                {sessionFeedback.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Areas for Improvement</h3>
              <ul className="list-disc list-inside space-y-1">
                {sessionFeedback.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-sm">
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1">
                {sessionFeedback.improvements.map((imp: string, i: number) => (
                  <li key={i} className="text-sm">
                    {imp}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSaveSession}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save Session (JSON)
              </Button>
              <Button
                onClick={() => {
                  setSessionId(null);
                  setSessionFeedback(null);
                  setIsSessionActive(false);
                  setAnswer("");
                }}
              >
                Start New Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
