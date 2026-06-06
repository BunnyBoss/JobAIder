"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, X, BarChart3, AlertCircle, CheckCircle2, ChevronRight, Target, FileText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ResumeSelect, RoleSelect } from "@/components/saved-selectors";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type SavedGap } from "@/lib/api";

const safeArray = (val: any) => Array.isArray(val) ? val : [];

const getSkillsList = (skillsObj: any): string[] => {
  if (!skillsObj) return [];
  if (Array.isArray(skillsObj)) return skillsObj.map(String);
  if (typeof skillsObj === "string") return skillsObj.split(",").map(s => s.trim()).filter(Boolean);
  if (typeof skillsObj === "object") {
    const allSkills: string[] = [];
    Object.values(skillsObj).forEach(val => {
      if (Array.isArray(val)) allSkills.push(...val.map(String));
      else if (typeof val === "string") allSkills.push(val);
    });
    return allSkills;
  }
  return [];
};

export default function GapAnalysisPage() {
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });
  const gaps = useQuery({ queryKey: ["gaps"], queryFn: api.listGaps });
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SavedGap | null>(null);
  const [editorText, setEditorText] = useState("");
  const [isEditingJson, setIsEditingJson] = useState(false);

  const gap = useMutation({
    mutationFn: () => api.gapByResume(Number(resumeId), Number(roleId)),
    onSuccess: async (data) => {
      const selectedResume = resumes.data?.resumes.find((resume) => resume.id === resumeId);
      const saved = { id: data.id, profile_id: Number(selectedResume?.profile_id ?? 0), role_analysis_id: Number(roleId), analysis: data.analysis, created_at: new Date().toISOString() };
      await gaps.refetch();
    }
  });
  const save = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Select a gap analysis first");
      return api.saveGap(selected.id, { analysis: JSON.parse(editorText) });
    },
    onSuccess: () => gaps.refetch()
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteGap(id),
    onSuccess: async () => {
      setSelected(null);
      setEditorText("");
      await gaps.refetch();
    }
  });

  function chooseGap(item: SavedGap) {
    setSelected(item);
    setEditorText(JSON.stringify(item.analysis, null, 2));
    setIsEditingJson(false);
  }

  return (
    <>
      <PageHeader title="Gap Analysis" description="Compare a saved resume against a saved role, then manage the saved analysis." />
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><BarChart3 className="h-5 w-5" /> Compare Resume vs Role</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Select a saved resume and a target role to automatically generate a detailed gap analysis and get actionable recommendations.
          </p>
          <div className="grid gap-4 lg:grid-cols-2 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <ResumeSelect resumes={resumes.data?.resumes ?? []} value={resumeId} onChange={setResumeId} />
            <RoleSelect roles={roles.data?.roles ?? []} value={roleId} onChange={setRoleId} />
          </div>
          <Button size="lg" onClick={() => gap.mutate()} disabled={gap.isPending || !resumeId || !roleId} className="w-full sm:w-auto gap-2">
            {gap.isPending ? "Analyzing Gaps..." : "Run And Save Gap Analysis"} <ChevronRight className="w-4 h-4" />
          </Button>
          <StatusPanel loading={gap.isPending} error={gap.error} success={gap.data ? `Success! Gap Analysis saved below.` : undefined} />
        </CardContent>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4">Saved Gap Analyses</h2>
        <StatusPanel loading={gaps.isPending} error={gaps.error} />
        {!gaps.data?.gaps.length && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
            No saved gap analyses yet. Run an analysis above to create the first one.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gaps.data?.gaps.map((item) => (
            <div key={item.id} className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">#{item.id}</div>
                  <span>Gap Analysis</span>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 space-y-1">
                <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Profile #{item.profile_id} {item.analysis?.resume_id ? `(Resume #${item.analysis.resume_id})` : ""}</div>
                <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Target Role #{item.role_analysis_id}</div>
              </div>
              <div className="mt-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Match Score</div>
                <div className="text-lg font-bold text-primary">{String(item.analysis?.overall_match_score ?? "N/A")}{String(item.analysis?.overall_match_score).includes("%") ? "" : "%"}</div>
              </div>
              <Button 
                variant="ghost" 
                className="mt-4 w-full bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/50"
                onClick={() => chooseGap(item)}
              >
                <BarChart3 className="w-4 h-4 mr-2" /> View Analysis
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <Card className="mt-6 border-slate-300 dark:border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span className="flex items-center gap-2">
                {isEditingJson ? <Pencil className="w-5 h-5 text-primary" /> : <BarChart3 className="w-5 h-5 text-primary" />} 
                {isEditingJson ? `Edit Gap Analysis #${selected.id} JSON` : `Gap Analysis #${selected.id}`}
              </span>
              <div className="flex items-center gap-2">
                {!isEditingJson && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingJson(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit JSON
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-4 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4" /> Profile #{selected.profile_id} {selected.analysis?.resume_id ? `(Resume #${selected.analysis.resume_id})` : ""}</div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4" /> Target Role #{selected.role_analysis_id}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Match Score</div>
                <div className="text-3xl font-bold text-primary">{String(selected.analysis?.overall_match_score ?? "N/A")}{String(selected.analysis?.overall_match_score).includes("%") ? "" : "%"}</div>
              </div>
            </div>

            {!isEditingJson ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSkillsList(selected.analysis?.missing_skills).length > 0 ? (
                      getSkillsList(selected.analysis?.missing_skills).map((s, i) => (
                        <span key={i} className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 px-2.5 py-1 rounded-md text-sm font-medium">{s}</span>
                      ))
                    ) : (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No missing skills identified</span>
                    )}
                  </div>
                </div>

                {safeArray(selected.analysis?.experience_gaps).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Experience Gaps</h3>
                    <div className="space-y-2">
                      {safeArray(selected.analysis.experience_gaps).map((gap: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{String(gap.description || gap.gap || gap)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {safeArray(selected.analysis?.recommendations).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Actionable Recommendations</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {safeArray(selected.analysis.recommendations).map((rec: any, i: number) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">{String(rec.title || rec.action || "Recommendation")}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{String(rec.description || rec.details || rec)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Textarea className="min-h-[420px] font-mono bg-slate-50 dark:bg-slate-950 border-0 focus-visible:ring-0 p-4 text-xs" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
              </div>
            )}
            
            <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Gap analysis saved" : undefined} />
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 flex-1 sm:flex-none"
                  onClick={() => {
                    if (window.confirm(`Delete gap analysis #${selected.id}?`)) remove.mutate(selected.id);
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                {isEditingJson ? (
                  <>
                    <Button 
                      variant="ghost"
                      onClick={() => setIsEditingJson(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 sm:flex-none">
                      <Pencil className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="ghost"
                    onClick={() => setSelected(null)}
                    className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
