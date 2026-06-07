"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Briefcase, FileText, UserRound, ArrowRight, Target, BarChart3, LineChart, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const profile = useQuery({ queryKey: ["latest-profile"], queryFn: api.latestProfile });

  const cards = [
    { label: "Backend", value: health.data?.status ?? "checking", icon: Activity },
    { label: "Profile", value: profile.data?.profile ? "Built & Ready" : "Not Built", icon: UserRound },
    { label: "Resume Studio", value: "ATS & Human formats", icon: FileText }
  ];

  const workflowSteps = [
    { title: "1. User Profile", desc: "Build a comprehensive master profile from your existing resumes, skills, and experience.", icon: UserRound },
    { title: "2. Role Analysis", desc: "Analyze target job descriptions to extract key requirements and responsibilities.", icon: Target },
    { title: "3. Gap Analysis", desc: "Compare your profile or resume against a target role to identify missing skills.", icon: BarChart3 },
    { title: "4. Improvement Plan", desc: "Generate an actionable learning plan to bridge skill gaps before applying.", icon: LineChart },
    { title: "5. Resume Studio", desc: "Generate base or highly tailored resumes optimized for ATS and human readers.", icon: FileText },
    { title: "6. Interview Prep", desc: "Simulate behavioral and technical interviews with AI based on your profile and role.", icon: MessageSquare }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Run your AI Job Application Assistant workflow from profile building to interview practice."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" /> {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">{item.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6 border-primary/10 shadow-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <Activity className="w-5 h-5" /> Recommended Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Icon className="w-4 h-4" /> {step.title}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

