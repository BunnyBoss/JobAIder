"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, X, Upload } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function RoleAnalysisPage() {
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorText, setEditorText] = useState("");
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });

  const analyze = useMutation({
    mutationFn: async (text: string) => {
      // Auto-extract title and company from content
      return api.analyzeRole({ title: "Target Role", company: "Unknown Company", content: text });
    },
    onSuccess: async (data) => {
      setSelectedId(data.id);
      setEditorText(JSON.stringify(data.analysis, null, 2));
      await roles.refetch();
    }
  });

  const save = useMutation({
    mutationFn: () => {
      const selected = roles.data?.roles.find((role) => role.id === selectedId);
      if (!selected) throw new Error("Select a role analysis first");
      return api.saveRole(selected.id, {
        title: selected.title,
        company: selected.company,
        source_text: selected.source_text,
        analysis: JSON.parse(editorText)
      });
    },
    onSuccess: () => roles.refetch()
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: async () => {
      setSelectedId(null);
      setEditorText("");
      await roles.refetch();
    }
  });

  async function handleFileUpload(files: File[]) {
    for (const file of files) {
      const text = await file.text();
      setContent(text);
      analyze.mutate(text);
    }
  }

  const selectedRole = roles.data?.roles.find((role) => role.id === selectedId);

  return (
    <>
      <PageHeader
        title="Role Analysis"
        description="Upload or paste a job description to extract role requirements, skills, and seniority level."
      />
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFileUpload(Array.from(event.dataTransfer.files));
            }}
          >
            <Upload className="mx-auto h-6 w-6 mb-2" />
            <p>Drop PDF, DOCX, Markdown, or TXT files here</p>
            <p className="text-xs mt-1">or use the input below</p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.md,.txt"
            onChange={(event) => handleFileUpload(Array.from(event.target.files ?? []))}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Or paste job description, posting, company information, or research papers..."
            className="min-h-[200px]"
          />
          <Button onClick={() => analyze.mutate(content)} disabled={!content || analyze.isPending}>
            Analyze Job Description
          </Button>
          <StatusPanel
            loading={analyze.isPending}
            error={analyze.error}
            success={analyze.data ? `Role analysis #${analyze.data.id} created` : undefined}
          />
          {analyze.data && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Role</div>
                  <div className="font-semibold">{analyze.data.title}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Company</div>
                  <div className="font-semibold">{analyze.data.company}</div>
                </div>
              </div>
              <pre className="rounded-md bg-muted p-4 text-xs overflow-auto max-h-[300px]">
                {JSON.stringify(analyze.data.analysis, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Saved Role Analyses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusPanel loading={roles.isPending} error={roles.error} />
          {!roles.data?.roles.length && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No saved role analyses yet. Analyze a job description above to create the first one.
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {roles.data?.roles.map((role) => (
              <button
                key={role.id}
                className="rounded-md border p-4 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelectedId(role.id);
                  setEditorText(JSON.stringify(role.analysis, null, 2));
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">#{role.id} {role.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(role.created_at).toLocaleString()}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Company: {role.company}</div>
                <p className="mt-2 line-clamp-3 text-muted-foreground">
                  {String(role.analysis.role_summary ?? "No summary")}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Seniority: {String(role.analysis.seniority_level ?? "Unknown")} · Domain:{" "}
                  {String(role.analysis.domain_focus ?? "Unknown")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Required: {Array.isArray(role.analysis.required_skills) ? role.analysis.required_skills.slice(0, 6).join(", ") : "No skills"}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Edit Role Analysis #{selectedRole.id}</span>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role Title</label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">{selectedRole.title}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Company</label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">{selectedRole.company}</div>
              </div>
            </div>
            <Textarea className="min-h-[420px] font-mono text-xs" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                <Pencil className="h-4 w-4" /> Save Analysis
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Delete role analysis #${selectedRole.id}?`)) {
                    remove.mutate(selectedRole.id);
                  }
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            <StatusPanel
              loading={save.isPending || remove.isPending}
              error={save.error ?? remove.error}
              success={save.data ? "Role analysis saved" : undefined}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
