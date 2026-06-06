"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ProfileSelect, RoleSelect } from "@/components/saved-selectors";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, API_BASE, type SavedResume } from "@/lib/api";

type ResumeKind = "ats" | "human" | "tailored";

export default function ResumeStudioPage() {
  const profiles = useQuery({ queryKey: ["profiles"], queryFn: api.listProfiles });
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });
  const [profileId, setProfileId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [mode, setMode] = useState<ResumeKind | null>(null);
  const [selected, setSelected] = useState<SavedResume | null>(null);
  const [editorText, setEditorText] = useState("");

  const generate = useMutation({
    mutationFn: (kind: ResumeKind) =>
      api.generateResume({
        profile_id: Number(profileId),
        kind,
        role_analysis_id: kind === "tailored" ? roleId : null
      }),
    onSuccess: async (resume) => {
      setSelected(resume);
      setEditorText(resume.markdown);
      await resumes.refetch();
    }
  });
  const save = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Select a resume first");
      return api.saveResume(selected.id, { title: selected.title, markdown: editorText });
    },
    onSuccess: () => resumes.refetch()
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteResume(id),
    onSuccess: async () => {
      setSelected(null);
      setEditorText("");
      await resumes.refetch();
    }
  });

  function chooseResume(resume: SavedResume) {
    setSelected(resume);
    setEditorText(resume.markdown);
  }

  return (
    <>
      <PageHeader title="Resume Studio" description="Select one profile, then generate ATS, human-friendly, or tailored resumes." />
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ProfileSelect profiles={profiles.data?.profiles ?? []} value={profileId} onChange={setProfileId} />
          {!profiles.data?.profiles.length && <div className="text-sm text-muted-foreground">Build a profile in User Profile first.</div>}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Generate Resume</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setMode("ats"); generate.mutate("ats"); }} disabled={!profileId || generate.isPending}>Generate ATS</Button>
            <Button variant="secondary" onClick={() => { setMode("human"); generate.mutate("human"); }} disabled={!profileId || generate.isPending}>Generate Human</Button>
            <Button variant="secondary" onClick={() => setMode("tailored")} disabled={!profileId}>Tailor Resume</Button>
          </div>
          {mode === "tailored" && (
            <div className="space-y-3">
              <RoleSelect roles={roles.data?.roles ?? []} value={roleId} onChange={setRoleId} />
              <Button onClick={() => generate.mutate("tailored")} disabled={!profileId || !roleId || generate.isPending}>Generate Tailored</Button>
            </div>
          )}
          <StatusPanel loading={generate.isPending} error={generate.error} success={generate.data ? `${generate.data.title} saved` : undefined} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Saved Resumes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!resumes.data?.resumes.length && <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No resumes yet. Generate one above.</div>}
          <div className="grid gap-3 lg:grid-cols-2">
            {resumes.data?.resumes.map((resume) => (
              <button key={resume.id} className="rounded-md border p-4 text-left text-sm hover:bg-muted" onClick={() => chooseResume(resume)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">#{resume.id} {resume.title}</div>
                  <div className="text-xs uppercase text-muted-foreground">{resume.kind}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Profile #{resume.profile_id}{resume.role_analysis_id ? ` · Role #${resume.role_analysis_id}` : ""}</div>
                <p className="mt-2 line-clamp-3 text-muted-foreground">{resume.markdown}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{selected.title} #{selected.id}</span>
              <Button variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {["markdown", "docx", "pdf"].map((format) => (
                <a key={format} className="rounded-md border px-3 py-2 hover:bg-muted" href={`${API_BASE}/api/resume/${selected.id}/export?format=${format}`}>
                  Export {format.toUpperCase()}
                </a>
              ))}
              <Button variant="secondary" onClick={() => setEditorText(selected.markdown)}><Eye className="h-4 w-4" /> Show Saved</Button>
            </div>
            <Textarea className="min-h-[520px] font-mono" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}><Pencil className="h-4 w-4" /> Save Edits</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Delete resume #${selected.id}?`)) remove.mutate(selected.id);
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Resume saved" : undefined} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

