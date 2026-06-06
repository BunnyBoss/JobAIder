"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ResumeSelect, RoleSelect } from "@/components/saved-selectors";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type SavedGap } from "@/lib/api";

export default function GapAnalysisPage() {
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });
  const gaps = useQuery({ queryKey: ["gaps"], queryFn: api.listGaps });
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SavedGap | null>(null);
  const [editorText, setEditorText] = useState("");

  const gap = useMutation({
    mutationFn: () => api.gapByResume(Number(resumeId), Number(roleId)),
    onSuccess: async (data) => {
      const selectedResume = resumes.data?.resumes.find((resume) => resume.id === resumeId);
      const saved = { id: data.id, profile_id: Number(selectedResume?.profile_id ?? 0), role_analysis_id: Number(roleId), analysis: data.analysis, created_at: new Date().toISOString() };
      setSelected(saved);
      setEditorText(JSON.stringify(data.analysis, null, 2));
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
  }

  return (
    <>
      <PageHeader title="Gap Analysis" description="Compare a saved resume against a saved role, then manage the saved analysis." />
      <Card>
        <CardHeader><CardTitle>Compare Resume vs Role</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 lg:grid-cols-2">
            <ResumeSelect resumes={resumes.data?.resumes ?? []} value={resumeId} onChange={setResumeId} />
            <RoleSelect roles={roles.data?.roles ?? []} value={roleId} onChange={setRoleId} />
          </div>
          <Button onClick={() => gap.mutate()} disabled={gap.isPending || !resumeId || !roleId}>Run And Save Gap Analysis</Button>
          <StatusPanel loading={gap.isPending} error={gap.error} success={gap.data ? "Gap analysis saved" : undefined} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Saved Gap Analyses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!gaps.data?.gaps.length && <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No gap analyses yet. Run one above.</div>}
          <div className="grid gap-3 lg:grid-cols-2">
            {gaps.data?.gaps.map((item) => (
              <button key={item.id} className="rounded-md border p-4 text-left text-sm hover:bg-muted" onClick={() => chooseGap(item)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Gap #{item.id}</div>
                  <div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Profile #{item.profile_id} · Role #{item.role_analysis_id}{item.analysis.resume_id ? ` · Resume #${item.analysis.resume_id}` : ""}</div>
                <div className="mt-2 text-sm text-muted-foreground">Overall score: {String(item.analysis.overall_match_score ?? "Unknown")}</div>
                <p className="mt-2 line-clamp-3 text-muted-foreground">{JSON.stringify(item.analysis.missing_skills ?? [])}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Gap Analysis #{selected.id}</span>
              <Button variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Profile #{selected.profile_id} · Role #{selected.role_analysis_id}{selected.analysis.resume_id ? ` · Resume #${selected.analysis.resume_id}` : ""}</div>
            <Button variant="secondary" onClick={() => setEditorText(JSON.stringify(selected.analysis, null, 2))}><Eye className="h-4 w-4" /> Show Saved</Button>
            <Textarea className="min-h-[520px] font-mono" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}><Pencil className="h-4 w-4" /> Save Edits</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Delete gap analysis #${selected.id}?`)) remove.mutate(selected.id);
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Gap analysis saved" : undefined} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
