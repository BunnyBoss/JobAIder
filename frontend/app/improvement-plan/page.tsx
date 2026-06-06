"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type Plan = Record<string, unknown>;

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
          {selectedGap && (
            <Button
              onClick={() => generate.mutate(selectedGapId!)}
              disabled={generate.isPending}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Improvement Plan
            </Button>
          )}
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
          <CardHeader>
            <CardTitle>Improvement Plan #{viewingPlan.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-muted p-4">
                <div className="text-sm text-muted-foreground">Current Match Score</div>
                <div className="text-3xl font-bold mt-2">{String(viewingPlan.plan.overall_score ?? "Unknown")}%</div>
              </div>
              <div className="rounded-md bg-primary/10 p-4">
                <div className="text-sm text-muted-foreground">Improvement Potential</div>
                <div className="text-3xl font-bold mt-2">+{String(viewingPlan.plan.improvement_potential ?? 0)}%</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Quick Wins (Start Now)
              </h3>
              <ul className="space-y-2">
                {Array.isArray(viewingPlan.plan.quick_wins) &&
                  viewingPlan.plan.quick_wins.map((win, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-7 relative">
                      <span className="absolute left-0">▸</span>
                      {String(win)}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Skills to Learn (Priority Order)</h3>
              <div className="space-y-3">
                {Array.isArray(viewingPlan.plan.skills_to_learn) &&
                  viewingPlan.plan.skills_to_learn.map((skill: any, i: number) => (
                    <div key={i} className="rounded-md border p-3">
                      <div className="font-medium text-sm">{String(skill.skill)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Effort: {String(skill.effort)} · Resources: {Array.isArray(skill.resources) ? skill.resources.join(", ") : String(skill.resources)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Portfolio Projects to Build</h3>
              <div className="space-y-3">
                {Array.isArray(viewingPlan.plan.projects_to_build) &&
                  viewingPlan.plan.projects_to_build.map((project: any, i: number) => (
                    <div key={i} className="rounded-md border p-3">
                      <div className="font-medium text-sm">{String(project.title)}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{String(project.description)}</div>
                      <div className="mt-2 text-xs font-medium text-primary">Timeline: {String(project.timeline)}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4">
              <div className="text-sm font-medium">Estimated Timeline</div>
              <div className="text-2xl font-bold mt-1">{String(viewingPlan.plan.estimated_weeks)} weeks</div>
              <div className="mt-2 text-xs text-muted-foreground">Working on priority areas</div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
