"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FolderSearch, Hammer, Pencil, Trash2, X, Clock, Target, FileText, UploadCloud, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const safeArray = (val: any) => Array.isArray(val) ? val : [];

const getSkillsList = (profileObj: any): string[] => {
  if (!profileObj || typeof profileObj !== "object") return [];
  const rawSkills = profileObj.skills || profileObj.Skills || profileObj.core_skills || profileObj.technical_skills;
  
  if (Array.isArray(rawSkills)) {
    return rawSkills.map(s => {
      if (typeof s === "string") return s;
      if (typeof s === "object" && s !== null) {
        return s.name || s.skill || s.title || Object.values(s)[0] || "Unknown Skill";
      }
      return String(s);
    });
  }
  
  if (typeof rawSkills === "string") {
    return rawSkills.split(",").map(s => s.trim()).filter(Boolean);
  }
  
  if (typeof rawSkills === "object" && rawSkills !== null) {
    const allSkills: string[] = [];
    Object.values(rawSkills).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (typeof v === "string") allSkills.push(v);
          else if (typeof v === "object" && v !== null) {
            allSkills.push(v.name || v.skill || v.title || Object.values(v)[0] || "Unknown Skill");
          } else allSkills.push(String(v));
        });
      } else if (typeof val === "string") {
        allSkills.push(val);
      }
    });
    return allSkills;
  }
  
  return [];
};

const renderListItem = (item: any): string => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    const val = item.title || item.name || item.content || item.note || item.text || item.description || item.value;
    if (val) return String(val);
    const values = Object.values(item)
      .filter((v: any) => typeof v === "string" || typeof v === "number")
      .join(" - ");
    return values || JSON.stringify(item);
  }
  return String(item);
};

export default function UserProfilePage() {
  const [vaultPath, setVaultPath] = useState("");
  const [rawText, setRawText] = useState("");
  const [documentIds, setDocumentIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorText, setEditorText] = useState("");
  const [isEditingJson, setIsEditingJson] = useState(false);

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
    onSuccess: async () => {
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
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderSearch className="h-5 w-5 text-blue-500" /> Obsidian Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-slate-500">Scan a local Obsidian vault directory to extract markdown notes.</p>
            <div className="flex gap-2">
              <Input className="flex-1" value={vaultPath} onChange={(event) => setVaultPath(event.target.value)} placeholder="/path/to/obsidian-vault" />
              <Button onClick={() => scan.mutate()} disabled={!vaultPath || scan.isPending} variant="secondary">Scan</Button>
            </div>
            <StatusPanel loading={scan.isPending} error={scan.error} success={scan.data ? `Successfully loaded ${scan.data.documents.length} documents` : undefined} />
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-indigo-500" /> Files & Raw Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div
              className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                upload.mutate(Array.from(event.dataTransfer.files));
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag & drop files here</div>
              <div className="text-xs text-slate-500 mt-1">PDF, DOCX, Markdown, or TXT</div>
            </div>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.md,.txt"
              className="hidden"
              onChange={(event) => upload.mutate(Array.from(event.target.files ?? []))}
            />
            <StatusPanel loading={upload.isPending} error={upload.error} success={upload.data ? `${upload.data.documents.length} files uploaded` : undefined} />
            <Textarea className="min-h-[100px] resize-y" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Or paste resume, LinkedIn export, skill inventory..." />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Hammer className="h-5 w-5" /> Build Master Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Combine all uploaded documents, scanned vaults, and pasted text into a unified, structured master profile using AI.
          </p>
          <Button size="lg" className="w-full sm:w-auto gap-2" onClick={() => build.mutate()} disabled={build.isPending || (!rawText && documentIds.length === 0)}>
            {build.isPending ? "Building Profile..." : "Build Master Profile"} <ChevronRight className="w-4 h-4" />
          </Button>
          <StatusPanel loading={build.isPending} error={build.error} success={build.data ? `Success! Profile #${build.data.id} built. You can find it in the Saved Profiles below.` : undefined} />
        </CardContent>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4">Saved Profiles</h2>
        <StatusPanel loading={profiles.isPending} error={profiles.error} />
        
        {!profiles.data?.profiles.length && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
            No saved profiles yet. Build a master profile above to create the first one.
          </div>
        )}
        
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.data?.profiles.map((profile) => (
            <div
              key={profile.id}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">#{profile.id}</div>
                  <span className="truncate">{profile.name}</span>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(profile.updated_at).toLocaleDateString()}</div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300 flex-1">
                {profile.summary || String(profile.profile.summary ?? "No summary provided.")}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Experience: <span className="font-medium text-slate-700 dark:text-slate-200">{String(profile.profile.years_experience ?? "Unknown")}</span></div>
                <div className="text-xs text-slate-500 flex items-start gap-1.5"><Target className="w-3.5 h-3.5 shrink-0 mt-0.5"/> 
                    <span className="line-clamp-1 flex-1">Skills: <span className="font-medium text-slate-700 dark:text-slate-200">
                      {getSkillsList(profile.profile).length > 0 ? getSkillsList(profile.profile).slice(0, 4).join(", ") : "No skills extracted"}
                    </span></span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="mt-4 w-full bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/50"
                onClick={() => {
                  setSelectedId(profile.id);
                  setEditorText(JSON.stringify(profile.profile, null, 2));
                  setIsEditingJson(false);
                }}
              >
                <FileText className="w-4 h-4 mr-2" /> View Profile
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedProfile && (
        <Card className="mt-6 border-slate-300 dark:border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span className="flex items-center gap-2">
                {isEditingJson ? <Pencil className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />} 
                {isEditingJson ? `Edit Profile #${selectedProfile.id} JSON` : `Profile #${selectedProfile.id}: ${selectedProfile.name}`}
              </span>
              <div className="flex items-center gap-2">
                {!isEditingJson && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingJson(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit JSON
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {!isEditingJson ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{String(selectedProfile.profile?.summary || selectedProfile.summary || "No summary provided.")}</p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Experience</h3>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{String(selectedProfile.profile.years_experience ?? "Unknown")}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Core Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {getSkillsList(selectedProfile.profile).length > 0 ? (
                        getSkillsList(selectedProfile.profile).map((s, i) => (
                          <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300">{s}</span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">No skills extracted</span>
                      )}
                    </div>
                  </div>
                </div>

                {safeArray(selectedProfile?.profile?.experience).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</h3>
                    <div className="space-y-3">
                      {safeArray(selectedProfile.profile.experience).map((exp: any, i: number) => (
                        <div key={i} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1">
                          <div className="font-medium text-sm text-primary mb-1">{exp.date_range || exp.date || exp.dates || exp.duration || exp.period || exp.timeline || exp.start_date || "Unknown Date"}</div>
                          <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{exp.description || exp.role || exp.title || String(exp)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {safeArray(selectedProfile?.profile?.projects).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Projects</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {safeArray(selectedProfile.profile.projects).map((proj: any, i: number) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{proj.name || proj.title || proj.project || String(proj)}</div>
                          {(proj.source || proj.description) && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description || proj.source}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {safeArray(selectedProfile?.profile?.publications).length > 0 && (
                  <details className="group border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <summary className="font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-4 py-3 cursor-pointer select-none outline-none">
                      Publications ({safeArray(selectedProfile.profile.publications).length})
                    </summary>
                    <div className="p-4 space-y-2 bg-white dark:bg-slate-950">
                      {safeArray(selectedProfile.profile.publications).map((pub: any, i: number) => (
                        <div key={i} className="text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">{renderListItem(pub)}</div>
                      ))}
                    </div>
                  </details>
                )}

                {safeArray(selectedProfile?.profile?.certifications).length > 0 && (
                  <details className="group border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <summary className="font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-4 py-3 cursor-pointer select-none outline-none">
                      Certifications ({safeArray(selectedProfile.profile.certifications).length})
                    </summary>
                    <div className="p-4 space-y-2 bg-white dark:bg-slate-950">
                      {safeArray(selectedProfile.profile.certifications).map((cert: any, i: number) => (
                        <div key={i} className="text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">{renderListItem(cert)}</div>
                      ))}
                    </div>
                  </details>
                )}

                {safeArray(selectedProfile?.profile?.career_notes).length > 0 && (
                  <details className="group border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <summary className="font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-4 py-3 cursor-pointer select-none outline-none">
                      Career Notes ({safeArray(selectedProfile.profile.career_notes).length})
                    </summary>
                    <div className="p-4 space-y-2 bg-white dark:bg-slate-950">
                      {safeArray(selectedProfile.profile.career_notes).map((note: any, i: number) => (
                        <div key={i} className="text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">{renderListItem(note)}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Textarea className="min-h-[420px] font-mono bg-slate-50 dark:bg-slate-950 border-0 focus-visible:ring-0 p-4" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
              </div>
            )}
            
            <div className="flex flex-wrap justify-between items-center pt-2">
              <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Profile saved successfully." : undefined} />
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 flex-1 sm:flex-none"
                  onClick={() => {
                    if (window.confirm(`Delete profile #${selectedProfile.id}? Existing resumes will not be deleted.`)) {
                      remove.mutate(selectedProfile.id);
                    }
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
                    onClick={() => setSelectedId(null)}
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
