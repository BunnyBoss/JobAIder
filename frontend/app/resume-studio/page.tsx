"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, X, Download, FileText, Wand2, User, Briefcase, Layout, Sparkles, FileCode2, Settings, Target, Eye } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing(false);
  }

  return (
    <>
      <PageHeader title="Resume Studio" description="Select one profile, then generate ATS, human-friendly, or tailored resumes." />
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Layout className="h-5 w-5" /> Generate Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 bg-white/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> Source Profile</label>
              <ProfileSelect profiles={profiles.data?.profiles ?? []} value={profileId} onChange={setProfileId} />
              {!profiles.data?.profiles.length && <div className="text-xs text-red-500 font-medium mt-1">Build a profile in User Profile first.</div>}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-400"/> Resume Format</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Button 
                  variant={mode === "ats" ? "default" : "outline"} 
                  onClick={() => setMode("ats")} 
                  className="w-full text-xs sm:text-sm"
                >
                  <FileCode2 className="w-4 h-4 mr-1.5 hidden sm:inline" /> ATS Friendly
                </Button>
                <Button 
                  variant={mode === "human" ? "default" : "outline"} 
                  onClick={() => setMode("human")} 
                  className="w-full text-xs sm:text-sm"
                >
                  <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" /> Human Friendly
                </Button>
                <Button 
                  variant={mode === "tailored" ? "default" : "outline"} 
                  onClick={() => setMode("tailored")} 
                  className="w-full text-xs sm:text-sm col-span-2 lg:col-span-1"
                >
                  <Target className="w-4 h-4 mr-1.5 hidden sm:inline" /> Tailored
                </Button>
              </div>
            </div>
          </div>

          {mode === "tailored" && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary"/> Target Role Analysis</label>
              <RoleSelect roles={roles.data?.roles ?? []} value={roleId} onChange={setRoleId} />
            </div>
          )}

          <Button 
            size="lg" 
            onClick={() => mode && generate.mutate(mode)} 
            disabled={!profileId || !mode || (mode === "tailored" && !roleId) || generate.isPending} 
            className="w-full sm:w-auto gap-2"
          >
            {generate.isPending ? "Generating..." : "Generate Resume"} <Sparkles className="w-4 h-4" />
          </Button>

          <StatusPanel loading={generate.isPending} error={generate.error} success={generate.data ? `Success! ${generate.data.title} generated.` : undefined} />
        </CardContent>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4">Generated Resumes</h2>
        <StatusPanel loading={resumes.isPending} error={resumes.error} />
        {!resumes.data?.resumes.length && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
            No resumes yet. Select a profile and format above to generate one.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resumes.data?.resumes.map((resume) => (
            <div key={resume.id} className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${resume.kind === 'tailored' ? 'bg-purple-100 text-purple-700' : resume.kind === 'ats' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="truncate">{resume.title}</span>
                </div>
                <div className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${resume.kind === 'tailored' ? 'bg-purple-50 text-purple-600 border border-purple-200' : resume.kind === 'ats' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                  {resume.kind}
                </div>
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 space-y-1">
                <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Profile #{resume.profile_id}</div>
                {resume.role_analysis_id && <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Role #{resume.role_analysis_id}</div>}
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  variant="ghost" 
                  className="w-full bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/50"
                  onClick={() => chooseResume(resume)}
                >
                  <Eye className="w-4 h-4 mr-2" /> View Resume
                </Button>
              </div>
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
                {isEditing ? <Pencil className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />} 
                {isEditing ? `Edit Resume: ${selected.title}` : selected.title}
              </span>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Content
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {!isEditing && (
              <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Profile #{selected.profile_id}</span>
                  {selected.role_analysis_id && <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Role #{selected.role_analysis_id}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {["markdown", "docx", "pdf"].map((format) => (
                    <a 
                      key={format} 
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" 
                      href={`${API_BASE}/api/resume/${selected.id}/export?format=${format}`}
                    >
                      <Download className="w-4 h-4 mr-2" /> {format.toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {!isEditing ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm overflow-hidden prose dark:prose-invert max-w-none">
                {/* Fallback to pre-formatted text if no full markdown renderer is present, 
                    but styled to look much cleaner than a raw textarea */}
                <pre className="font-mono text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-sans break-words bg-transparent p-0 m-0 border-0 overflow-visible">
                  {selected.markdown}
                </pre>
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
                <Textarea 
                  className="min-h-[600px] font-mono bg-slate-50 dark:bg-slate-950 border-0 focus-visible:ring-0 p-4 text-sm leading-relaxed resize-y" 
                  value={editorText} 
                  onChange={(event) => setEditorText(event.target.value)} 
                />
              </div>
            )}
            
            <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Resume saved successfully" : undefined} />
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 flex-1 sm:flex-none"
                  onClick={() => {
                    if (window.confirm(`Delete resume #${selected.id}?`)) remove.mutate(selected.id);
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Resume
                </Button>
                {isEditing ? (
                  <>
                    <Button 
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 sm:flex-none">
                      <Pencil className="h-4 w-4 mr-2" /> Save Content
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

