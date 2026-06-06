"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function ResumeEditorPage() {
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: api.listResumes });
  const [selected, setSelected] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    const resume = resumes.data?.resumes.find((item) => item.id === selected);
    if (resume) {
      setTitle(resume.title);
      setMarkdown(resume.markdown);
    }
  }, [selected, resumes.data]);

  const save = useMutation({
    mutationFn: () => api.saveResume(Number(selected), { title, markdown }),
    onSuccess: () => resumes.refetch()
  });

  return (
    <>
      <PageHeader
        title="Resume Editor"
        description="Edit generated resume sections, accept or rewrite suggestions manually, and export the updated result from Resume Studio."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader><CardTitle>Drafts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {resumes.data?.resumes.map((resume) => (
              <button
                key={resume.id}
                className="block w-full rounded-md border p-3 text-left text-sm hover:bg-muted"
                onClick={() => setSelected(resume.id)}
              >
                <div className="font-medium">{resume.title}</div>
                <div className="text-xs text-muted-foreground">{resume.kind} · #{resume.id}</div>
              </button>
            ))}
            {!resumes.data?.resumes.length && <div className="text-sm text-muted-foreground">Generate a resume first.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Editor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resume title" />
            <Textarea className="min-h-[520px] font-mono" value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => save.mutate()} disabled={!selected || save.isPending}>Save</Button>
              <Button variant="secondary" onClick={() => setMarkdown(markdown.replace(/\bhelped\b/gi, "contributed to"))}>Rewrite Weak Verbs</Button>
            </div>
            <StatusPanel loading={save.isPending || resumes.isPending} error={save.error ?? resumes.error} success={save.data ? "Saved" : undefined} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
