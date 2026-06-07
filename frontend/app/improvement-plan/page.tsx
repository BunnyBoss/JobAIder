"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Zap, BookOpen, Rocket, Target, Clock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type Plan = Record<string, unknown>;

const getQuickWinText = (win: any) => {
  if (typeof win === "string") return win;
  if (typeof win === "object" && win !== null) {
    return win.action || win.title || win.description || win.win || Object.values(win)[0];
  }
  return String(win);
};

const getSkillText = (skill: any) => {
  if (typeof skill === "string") return { title: skill, effort: "Unknown", resources: "Not specified" };
  if (typeof skill === "object" && skill !== null) {
    return {
      title: skill.skill || skill.name || skill.title || "Unknown Skill",
      effort: skill.effort || skill.duration || skill.time || "Unknown",
      resources: skill.resources ? (Array.isArray(skill.resources) ? skill.resources.join(", ") : String(skill.resources)) : "Not specified",
    };
  }
  return { title: String(skill), effort: "Unknown", resources: "Not specified" };
};

const getProjectText = (project: any) => {
  if (typeof project === "string") return { title: "Project", description: project, timeline: "Unknown" };
  if (typeof project === "object" && project !== null) {
    return {
      title: project.title || project.name || project.project || "Portfolio Project",
      description: project.description || project.details || project.summary || "No description provided.",
      timeline: project.timeline || project.duration || project.time_estimate || "Unknown",
    };
  }
  return { title: "Project", description: String(project), timeline: "Unknown" };
};

export default function ImprovementPlanPage() {
  const gaps = useQuery({ queryKey: ["gaps"], queryFn: api.listGaps });
  const plans = useQuery({ queryKey: ["improvement-plans"], queryFn: api.listImprovementPlans });
  const [selectedGapId, setSelectedGapId] = useState<number | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<number | null>(null);

  const generate = useMutation({
    mutationFn: (gap_id: number) => api.generateImprovementPlan(gap_id),
    onSuccess: async () => {
      setSelectedGapId(null);
      await plans.refetch();
    }
  });

  const remove = useMutation({
    mutationFn: (plan_id: number) => api.deleteImprovementPlan(plan_id),
    onSuccess: () => plans.refetch()
  });

  const selectedGap = gaps.data?.gaps.find((g) => g.id === selectedGapId);
  const viewingPlan = plans.data?.plans.find((p) => p.id === viewingPlanId);

  return (
    <>
      <PageHeader
        title="Improvement Plan"
        description="Generate a structured roadmap to close skills gaps and increase job match score."
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!gaps.data?.gaps.length && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No gap analyses found. Run a gap analysis first in the Gap Analysis page.
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {gaps.data?.gaps.map((gap) => (
              <button
                key={gap.id}
                className={`rounded-md border p-4 text-left text-sm transition-colors ${
                  selectedGapId === gap.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedGapId(gap.id)}
              >
                <div className="font-medium">Gap #{gap.id}</div>
                <div className="mt-1 text-xs text-muted-foreground">Profile #{gap.profile_id} · Role #{gap.role_analysis_id}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Match score: {String(gap.analysis.overall_match_score ?? "Unknown")}%
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={() => generate.mutate(selectedGapId!)}
            disabled={!selectedGapId || generate.isPending}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {generate.isPending ? "Generating..." : "Generate Improvement Plan"}
          </Button>
          <StatusPanel
            loading={generate.isPending}
            error={generate.error}
            success={generate.data ? "Improvement plan generated" : undefined}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Saved Improvement Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusPanel loading={plans.isPending} error={plans.error} />
          {!plans.data?.plans.length && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No improvement plans yet. Generate one above.
            </div>
          )}
          <div className="space-y-3">
            {plans.data?.plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-md border p-4 text-left transition-colors w-full ${
                  viewingPlanId === plan.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button className="flex-1 text-left" onClick={() => setViewingPlanId(plan.id)}>
                    <div className="font-medium">Plan #{plan.id}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Gap #{plan.gap_analysis_id} · Created {new Date(plan.created_at).toLocaleString()}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete plan #${plan.id}?`)) {
                        remove.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Overall score: {String(plan.plan.overall_score ?? "Unknown")}% → +{String(plan.plan.improvement_potential ?? 0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {viewingPlan && (
        <Card className="mt-4">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Improvement Plan #{viewingPlan.id}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setViewingPlanId(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Target className="w-4 h-4" /> Current Match</div>
                <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{String(viewingPlan.plan.overall_score ?? "Unknown")}%</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 p-5 shadow-sm border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-center items-center text-center">
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><Zap className="w-4 h-4" /> Potential Gain</div>
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">+{String(viewingPlan.plan.improvement_potential ?? 0)}%</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-5 shadow-sm border border-blue-200 dark:border-blue-800/50 flex flex-col justify-center items-center text-center">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Est. Timeline</div>
                <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{String(viewingPlan.plan.estimated_weeks ?? "?")}w</div>
              </div>
            </div>

            {/* Flowchart Plan */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-10 pb-4 mt-8">
              
              {/* Step 1: Quick Wins */}
              <div className="relative">
                <div className="absolute -left-[21px] bg-background border-2 border-amber-500 text-amber-500 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm z-10 bg-white dark:bg-slate-950">1</div>
                <div className="pl-8">
                  <h3 className="font-bold text-xl flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                    Quick Wins <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-2">Start Now</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.isArray(viewingPlan.plan.quick_wins) && viewingPlan.plan.quick_wins.map((win, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{String(getQuickWinText(win))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Skills to Learn */}
              <div className="relative">
                <div className="absolute -left-[21px] bg-background border-2 border-blue-500 text-blue-500 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm z-10 bg-white dark:bg-slate-950">2</div>
                <div className="pl-8">
                  <h3 className="font-bold text-xl flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                    Skills to Master <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-2">Priority Order</span>
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(viewingPlan.plan.skills_to_learn) && viewingPlan.plan.skills_to_learn.map((rawSkill: any, i: number) => {
                      const skill = getSkillText(rawSkill);
                      return (
                        <div key={i} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg shrink-0 mt-1">
                              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{skill.title}</div>
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800"><Clock className="w-3.5 h-3.5" /> Effort: {skill.effort}</div>
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800"><Target className="w-3.5 h-3.5" /> {skill.resources}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 3: Portfolio Projects */}
              <div className="relative">
                <div className="absolute -left-[21px] bg-background border-2 border-indigo-500 text-indigo-500 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm z-10 bg-white dark:bg-slate-950">3</div>
                <div className="pl-8">
                  <h3 className="font-bold text-xl flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                    Portfolio Projects <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-2">Showcase Expertise</span>
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.isArray(viewingPlan.plan.projects_to_build) && viewingPlan.plan.projects_to_build.map((rawProject: any, i: number) => {
                      const project = getProjectText(rawProject);
                      return (
                        <div key={i} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <div className="font-semibold text-sm text-indigo-900 dark:text-indigo-200 line-clamp-1">{project.title}</div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="text-sm text-slate-600 dark:text-slate-300 flex-1 leading-relaxed mb-4">{project.description}</div>
                            <div className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" /> Timeline: {project.timeline}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
