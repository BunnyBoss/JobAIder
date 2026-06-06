"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ResumeSelect } from "@/components/saved-selectors";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Download, PlayCircle, SkipForward, ArrowRight, Star, CheckCircle2, AlertCircle, Target, MessageSquare, Briefcase, Zap } from "lucide-react";

const safeArray = (val: any) => Array.isArray(val) ? val : [];

export default function InterviewPrepPage() {
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });

  const [resumeId, setResumeId] = useState<number | null>(null);
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

  const start = useMutation({
    mutationFn: () =>
      api.startInterview({
        resume_id: resumeId,
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
      resume_id: resumeId,
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
    link.download = `interview_session_resume_${resumeId}_${Date.now()}.json`;
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
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><PlayCircle className="w-5 h-5"/> Start Mock Interview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3 bg-white/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> Base Resume</label>
                  <ResumeSelect resumes={resumes.data?.resumes ?? []} value={resumeId} onChange={setResumeId} />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-400"/> Interview Mode</label>
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

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Zap className="w-4 h-4 text-slate-400"/> Difficulty</label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["Easy", "Medium", "Hard"].map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Number of Questions (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 3)))}
                    className="w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400"/> Target Role Analysis (Optional)
                  </label>
                  <Select
                    value={roleId?.toString() ?? ""}
                    onChange={(e) => setRoleId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">None - Use selected resume only</option>
                    {roles.data?.roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} at {r.company}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => start.mutate()}
                disabled={start.isPending || !resumeId}
                className="w-full gap-2"
              >
                {start.isPending ? "Preparing Session..." : "Start Interview"} <ArrowRight className="w-4 h-4" />
              </Button>
              <StatusPanel
                loading={start.isPending}
                error={start.error}
                success={start.data ? `Session #${start.data.session_id}` : undefined}
              />
            </CardContent>
          </Card>

        </>
      )}

      {isSessionActive && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Question {currentQuestion} <span className="text-muted-foreground text-sm font-normal">of {questionCount}</span></CardTitle>
                <div className="text-sm font-semibold text-primary">
                  {Math.round(((currentQuestion - 1) / questionCount) * 100)}% Completed
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.round(((currentQuestion - 1) / questionCount) * 100)}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{currentQuestionText}</p>
            </div>

            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your response here... (Take your time, articulate clearly as if in a real interview)"
              rows={8}
              className="resize-y text-base bg-white dark:bg-slate-950 focus-visible:ring-primary/50"
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => submit.mutate("submit")}
                disabled={!answer.trim() || submit.isPending}
                variant="default"
                className="flex-1 gap-2 text-base shadow-sm"
              >
                Submit Answer <CheckCircle2 className="w-4 h-4"/>
              </Button>
              <Button
                size="lg"
                onClick={() => submit.mutate("skip")}
                disabled={submit.isPending}
                variant="secondary"
                className="flex-1 gap-2"
              >
                Skip <SkipForward className="w-4 h-4"/>
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (confirm("Exit interview? Your progress will be saved.")) {
                    submit.mutate("exit");
                  }
                }}
                disabled={submit.isPending}
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Exit Session
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
        <Card className="border-green-500/30 shadow-xl overflow-hidden">
          <div className="w-full h-1.5 bg-gradient-to-r from-green-400 via-primary to-blue-500"></div>
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex items-center justify-center flex-col text-center space-y-2 mt-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <Star className="w-8 h-8 text-green-600 dark:text-green-400 fill-current" />
              </div>
              <CardTitle className="text-2xl">Session Complete</CardTitle>
              <p className="text-base text-muted-foreground">Here is your comprehensive interview performance feedback.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Average Score</p>
                <div className={`text-4xl font-bold ${Number(sessionFeedback.average_score) >= 4 ? "text-green-600" : Number(sessionFeedback.average_score) >= 3 ? "text-orange-500" : "text-red-500"}`}>
                  {sessionFeedback.average_score}<span className="text-xl text-slate-400">/5</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Completed</p>
                <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                  {sessionFeedback.answered_questions}<span className="text-xl text-slate-400">/{sessionFeedback.total_questions}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tech Depth</p>
                <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                  {sessionFeedback.breakdown?.technical_depth ?? 0}<span className="text-xl text-slate-400">/5</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Clarity</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                  {sessionFeedback.breakdown?.clarity ?? 0}/5
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Communication</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                  {sessionFeedback.breakdown?.communication ?? 0}/5
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Structure</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                  {sessionFeedback.breakdown?.structure ?? 0}/5
                </p>
              </div>
            </div>

            {safeArray(sessionFeedback.strengths).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Strengths</h3>
                <div className="space-y-2">
                  {safeArray(sessionFeedback.strengths).map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {safeArray(sessionFeedback.weaknesses).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Areas for Improvement</h3>
                <div className="space-y-2">
                  {safeArray(sessionFeedback.weaknesses).map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {safeArray(sessionFeedback.improvements).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Actionable Recommendations</h3>
                <div className="space-y-2">
                  {safeArray(sessionFeedback.improvements).map((imp: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => {
                  setSessionId(null);
                  setSessionFeedback(null);
                  setIsSessionActive(false);
                  setAnswer("");
                }}
                size="lg"
                className="flex-1"
              >
                Start New Session
              </Button>
              <Button
                onClick={handleSaveSession}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
