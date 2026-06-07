"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, X, Upload, Building2, Target, Briefcase, Clock, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

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

export default function RoleAnalysisPage() {
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorText, setEditorText] = useState("");
  const [isEditingJson, setIsEditingJson] = useState(false);
  const roles = useQuery({ queryKey: ["roles"], queryFn: api.listRoles });

  const analyze = useMutation({
    mutationFn: async (text: string) => {
      // Auto-extract title and company from content
      return api.analyzeRole({ title: "Target Role", company: "Unknown Company", content: text });
    },
    onSuccess: async () => {
      setContent("");
      setFileContent("");
      setFileNames([]);
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

  const [isExtracting, setIsExtracting] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileNames, setFileNames] = useState<string[]>([]);

  async function handleFileUpload(files: File[]) {
    if (files.length === 0) return;
    try {
      setIsExtracting(true);
      const res = await api.extractText(files);
      const combined = res.files.map(f => f.text).join("\n\n");
      setFileContent(prev => prev ? `${prev}\n\n${combined}` : combined);
      setFileNames(prev => [...prev, ...files.map(f => f.name)]);
    } catch (err) {
      console.error("Failed to extract text:", err);
      alert("Failed to read file contents.");
    } finally {
      setIsExtracting(false);
    }
  }

  const selectedRole = roles.data?.roles.find((role) => role.id === selectedId);

  return (
    <>
      <PageHeader
        title="Role Analysis"
        description="Upload or paste a job description to extract role requirements, skills, and seniority level."
      />
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" /> Analyze Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Upload or paste a job posting to extract role requirements, key skills, and determine seniority fit.
          </p>
          <div
            className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-8 text-center transition-all hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFileUpload(Array.from(event.dataTransfer.files));
            }}
          >
            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop PDF, DOCX, Markdown, or TXT files here</p>
            <p className="text-xs text-slate-500 mt-1">or select files using the button below</p>
            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 py-2 px-4">
                Select Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.md,.txt"
                  className="hidden"
                  onChange={(event) => handleFileUpload(Array.from(event.target.files ?? []))}
                  disabled={isExtracting}
                />
              </label>
            </div>
            {isExtracting && <div className="text-sm text-primary mt-2 animate-pulse">Extracting text from files...</div>}
            {fileNames.length > 0 && !isExtracting && (
              <div className="mt-3 text-sm text-green-600 dark:text-green-500 font-medium">
                Loaded {fileNames.length} file(s): {fileNames.join(", ")}
              </div>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste additional job description, notes, or company context here..."
            className="min-h-[120px] bg-white dark:bg-slate-950 resize-y"
          />
          <Button 
            size="lg" 
            className="w-full sm:w-auto gap-2" 
            onClick={() => {
              const combined = [fileContent, content].filter(Boolean).join("\n\n");
              analyze.mutate(combined);
            }} 
            disabled={(!content && !fileContent) || analyze.isPending}
          >
            {analyze.isPending ? "Analyzing..." : "Extract Insights"} <ChevronRight className="w-4 h-4" />
          </Button>
          <StatusPanel
            loading={analyze.isPending}
            error={analyze.error}
            success={analyze.data ? `Success! Role analysis #${analyze.data.id} created and saved below.` : undefined}
          />
        </CardContent>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4">Saved Role Analyses</h2>
        <StatusPanel loading={roles.isPending} error={roles.error} />
        {!roles.data?.roles.length && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
            No saved role analyses yet. Analyze a job description above to create the first one.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.data?.roles.map((role) => (
            <div
              key={role.id}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">#{role.id}</div>
                  <span className="truncate">{role.title}</span>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(role.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 mb-3">
                <Building2 className="w-4 h-4" /> <span className="font-medium">{role.company}</span>
              </div>
              <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400 flex-1">
                {String(role.analysis.role_summary ?? "No summary")}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5"/> Seniority: <span className="font-medium text-slate-700 dark:text-slate-200">{String(role.analysis.seniority_level ?? "Unknown")}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5"/> Domain: <span className="font-medium text-slate-700 dark:text-slate-200">{String(role.analysis.domain_focus ?? "Unknown")}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="mt-4 w-full bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/50"
                onClick={() => {
                  setSelectedId(role.id);
                  setEditorText(JSON.stringify(role.analysis, null, 2));
                  setIsEditingJson(false);
                }}
              >
                <FileText className="w-4 h-4 mr-2" /> View Analysis
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedRole && (
        <Card className="mt-6 border-slate-300 dark:border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span className="flex items-center gap-2">
                {isEditingJson ? <Pencil className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />} 
                {isEditingJson ? `Edit Role Analysis #${selectedRole.id} JSON` : `Role Analysis #${selectedRole.id}: ${selectedRole.title}`}
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
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Title</label>
                <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{selectedRole.title}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</label>
                <div className="mt-1 text-sm font-medium flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-slate-400" /> {selectedRole.company}
                </div>
              </div>
            </div>

            {!isEditingJson ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Role Summary</h3>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    {String(selectedRole.analysis?.role_summary || "No summary provided.")}
                  </p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Seniority</h3>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{String(selectedRole.analysis?.seniority_level ?? "Unknown")}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Domain Focus</h3>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{String(selectedRole.analysis?.domain_focus ?? "Unknown")}</div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {getSkillsList(selectedRole.analysis?.required_skills).length > 0 ? (
                        getSkillsList(selectedRole.analysis?.required_skills).map((s, i) => (
                          <span key={i} className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md text-sm font-medium">{s}</span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">No skills extracted</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Nice-to-Have Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {getSkillsList(selectedRole.analysis?.nice_to_have_skills).length > 0 ? (
                        getSkillsList(selectedRole.analysis?.nice_to_have_skills).map((s, i) => (
                          <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-sm font-medium">{s}</span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md">None identified</span>
                      )}
                    </div>
                  </div>
                </div>

                {safeArray(selectedRole.analysis?.responsibilities).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Responsibilities</h3>
                    <div className="space-y-2">
                      {safeArray(selectedRole.analysis.responsibilities).map((resp: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{String(resp.description || resp.title || resp)}</span>
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
              <StatusPanel loading={save.isPending || remove.isPending} error={save.error ?? remove.error} success={save.data ? "Role analysis saved" : undefined} />
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 flex-1 sm:flex-none"
                  onClick={() => {
                    if (window.confirm(`Delete role analysis #${selectedRole.id}?`)) {
                      remove.mutate(selectedRole.id);
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
