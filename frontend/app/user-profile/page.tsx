"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FolderSearch, Hammer, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function UserProfilePage() {
  const [vaultPath, setVaultPath] = useState("");
  const [rawText, setRawText] = useState("");
  const [documentIds, setDocumentIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorText, setEditorText] = useState("");

  const profiles = useQuery({ queryKey: ["profiles"], queryFn: api.listProfiles });
  const scan = useMutation({
    mutationFn: () => api.scanVault(vaultPath),
    onSuccess: (data) => setDocumentIds(data.documents.map((doc) => doc.id))
  });
  const upload = useMutation({
    mutationFn: (files: File[]) => api.uploadProfileFiles(files),
    onSuccess: (data) => setDocumentIds((current) => [...current, ...data.documents.map((doc) => doc.id)])
  });
  const build = useMutation({
    mutationFn: () => api.buildProfile(documentIds, rawText),
    onSuccess: async (data) => {
      setSelectedId(data.id);
      setEditorText(JSON.stringify(data.profile, null, 2));
      await profiles.refetch();
    }
  });
  const save = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("Select a profile first");
      return api.saveProfile(selectedId, { profile: JSON.parse(editorText) });
    },
    onSuccess: () => profiles.refetch()
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteProfile(id),
    onSuccess: async () => {
      setSelectedId(null);
      setEditorText("");
      await profiles.refetch();
    }
  });

  const selectedProfile = profiles.data?.profiles.find((profile) => profile.id === selectedId);

  return (
    <>
      <PageHeader
        title="User Profile"
        description="Build a unified professional profile from an Obsidian vault, supporting documents, or pasted career material."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSearch className="h-4 w-4 text-primary" /> Obsidian Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={vaultPath} onChange={(event) => setVaultPath(event.target.value)} placeholder="/path/to/obsidian-vault" />
            <Button onClick={() => scan.mutate()} disabled={!vaultPath || scan.isPending}>Scan Vault</Button>
            <StatusPanel loading={scan.isPending} error={scan.error} success={scan.data ? `${scan.data.documents.length} documents found` : undefined} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Individual Files Or Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                upload.mutate(Array.from(event.dataTransfer.files));
              }}
            >
              Drop PDF, DOCX, Markdown, or TXT files here.
            </div>
            <Input
              type="file"
              multiple
              accept=".pdf,.docx,.md,.txt"
              onChange={(event) => upload.mutate(Array.from(event.target.files ?? []))}
            />
            <StatusPanel loading={upload.isPending} error={upload.error} success={upload.data ? `${upload.data.documents.length} files uploaded` : undefined} />
            <Textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Or paste resume, LinkedIn export, skill inventory, publications, or certification notes..." />
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-primary" /> Build Master Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => build.mutate()} disabled={build.isPending || (!rawText && documentIds.length === 0)}>Build Master Profile</Button>
          <StatusPanel loading={build.isPending} error={build.error} success={build.data ? `Profile #${build.data.id} built` : undefined} />
          {build.data && <pre className="rounded-md bg-muted p-4 text-xs">{JSON.stringify(build.data.profile, null, 2)}</pre>}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Saved Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusPanel loading={profiles.isPending} error={profiles.error} />
          {!profiles.data?.profiles.length && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No saved profiles yet. Build a master profile above to create the first one.
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {profiles.data?.profiles.map((profile) => (
              <button
                key={profile.id}
                className="rounded-md border p-4 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelectedId(profile.id);
                  setEditorText(JSON.stringify(profile.profile, null, 2));
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">#{profile.id} {profile.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(profile.updated_at).toLocaleString()}</div>
                </div>
                <p className="mt-2 line-clamp-3 text-muted-foreground">{profile.summary || String(profile.profile.summary ?? "No summary")}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Experience: {String(profile.profile.years_experience ?? "Unknown")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Skills: {Array.isArray(profile.profile.skills) ? profile.profile.skills.slice(0, 6).join(", ") : "No skills extracted"}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedProfile && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Edit Profile #{selectedProfile.id}</span>
              <Button variant="ghost" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea className="min-h-[420px] font-mono" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                <Pencil className="h-4 w-4" /> Save Profile
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Delete profile #${selectedProfile.id}? Existing resumes will not be deleted.`)) {
                    remove.mutate(selectedProfile.id);
                  }
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
            <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Profile saved" : undefined} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
