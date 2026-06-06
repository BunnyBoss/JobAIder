"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Briefcase, FileText, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const profile = useQuery({ queryKey: ["latest-profile"], queryFn: api.latestProfile });

  const cards = [
    { label: "Backend", value: health.data?.status ?? "checking", icon: Activity },
    { label: "Profile", value: profile.data?.profile ? "built" : "not built", icon: UserRound },
    { label: "Resume Studio", value: "ATS + human + tailored", icon: FileText },
    { label: "Workflow", value: "local-first", icon: Briefcase }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Run the local-first job application workflow from profile building to interview practice."
      />
      <div className="grid gap-4 md:grid-cols-4">
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>MVP Order</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li>1. Build User Profile from vault or files.</li>
            <li>2. Analyze a target role.</li>
            <li>3. Generate generic ATS and human resumes.</li>
            <li>4. Generate a tailored resume.</li>
            <li>5. Run gap analysis and improvement plan.</li>
            <li>6. Practice with interview prep.</li>
          </ol>
        </CardContent>
      </Card>
    </>
  );
}

